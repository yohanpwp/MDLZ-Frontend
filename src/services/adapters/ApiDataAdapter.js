import { IDataAdapter, DATA_SOURCE_TYPES } from '../interfaces/IDataAdapter.js'

/**
 * API Data Adapter
 * จัดการข้อมูลผ่าน REST API
 */
export class ApiDataAdapter extends IDataAdapter {
  constructor(options = {}) {
    super()
    this.sourceType = DATA_SOURCE_TYPES.API
    this.baseUrl = options.baseUrl || ''
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    this.timeout = options.timeout || 30000
    this.retryAttempts = options.retryAttempts || 3
    this.retryDelay = options.retryDelay || 1000
  }

  /**
   * อ่านข้อมูลจาก API
   */
  async read(options = {}) {
    const {
      endpoint,
      id,
      params = {},
      headers = {}
    } = options

    let url = this._buildUrl(endpoint, id)
    
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params)
      url += `?${searchParams.toString()}`
    }

    return await this._makeRequest('GET', url, null, headers)
  }

  /**
   * เขียนข้อมูลไปยัง API (CREATE)
   */
  async write(data, options = {}) {
    const {
      endpoint,
      headers = {}
    } = options

    const url = this._buildUrl(endpoint)
    return await this._makeRequest('POST', url, data, headers)
  }

  /**
   * อัพเดทข้อมูลผ่าน API
   */
  async update(id, data, options = {}) {
    const {
      endpoint,
      method = 'PUT',
      headers = {}
    } = options

    const url = this._buildUrl(endpoint, id)
    return await this._makeRequest(method, url, data, headers)
  }

  /**
   * ลบข้อมูลผ่าน API
   */
  async delete(id, options = {}) {
    const {
      endpoint,
      headers = {}
    } = options

    const url = this._buildUrl(endpoint, id)
    return await this._makeRequest('DELETE', url, null, headers)
  }

  /**
   * ค้นหาข้อมูลผ่าน API
   */
  async search(query, options = {}) {
    const {
      endpoint = 'search',
      headers = {}
    } = options

    const url = this._buildUrl(endpoint)
    return await this._makeRequest('POST', url, query, headers)
  }

  /**
   * ตรวจสอบสถานะการเชื่อมต่อ API
   */
  async isConnected() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers,
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * ซิงค์ข้อมูลกับ API
   */
  async sync(options = {}) {
    const {
      localData = [],
      endpoint = 'sync',
      strategy = 'merge' // 'merge', 'overwrite', 'append'
    } = options

    try {
      const syncPayload = {
        data: localData,
        strategy,
        timestamp: new Date().toISOString()
      }

      const result = await this._makeRequest('POST', this._buildUrl(endpoint), syncPayload)
      
      return {
        success: true,
        conflicts: result.conflicts || [],
        merged: result.merged || [],
        errors: result.errors || []
      }
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`)
    }
  }

  /**
   * Batch operations
   */
  async batch(operations, options = {}) {
    const {
      endpoint = 'batch',
      headers = {}
    } = options

    const batchPayload = {
      operations,
      timestamp: new Date().toISOString()
    }

    return await this._makeRequest('POST', this._buildUrl(endpoint), batchPayload, headers)
  }

  // Private methods
  _buildUrl(endpoint, id = null) {
    let url = `${this.baseUrl}/${endpoint}`.replace(/\/+/g, '/')
    if (id) {
      url += `/${id}`
    }
    return url
  }

  async _makeRequest(method, url, data = null, additionalHeaders = {}) {
    const requestHeaders = {
      ...this.headers,
      ...additionalHeaders
    }

    const requestOptions = {
      method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(this.timeout)
    }

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      requestOptions.body = JSON.stringify(data)
    }

    let lastError
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        
        if (!response.ok) {
          const errorData = await this._parseErrorResponse(response)
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`)
        }

        // Handle different content types
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          return await response.json()
        } else {
          return await response.text()
        }

      } catch (error) {
        lastError = error
        
        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error
        }

        // Wait before retry (except on last attempt)
        if (attempt < this.retryAttempts) {
          await this._delay(this.retryDelay * attempt)
        }
      }
    }

    throw new Error(`Request failed after ${this.retryAttempts} attempts: ${lastError.message}`)
  }

  async _parseErrorResponse(response) {
    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        const text = await response.text()
        return { message: text }
      }
    } catch (error) {
      return { message: 'Unknown error occurred' }
    }
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Set authentication token
   */
  setAuthToken(token, type = 'Bearer') {
    this.headers['Authorization'] = `${type} ${token}`
  }

  /**
   * Remove authentication token
   */
  removeAuthToken() {
    delete this.headers['Authorization']
  }

  /**
   * Update base configuration
   */
  updateConfig(config) {
    if (config.baseUrl) this.baseUrl = config.baseUrl
    if (config.headers) this.headers = { ...this.headers, ...config.headers }
    if (config.timeout) this.timeout = config.timeout
    if (config.retryAttempts) this.retryAttempts = config.retryAttempts
    if (config.retryDelay) this.retryDelay = config.retryDelay
  }
}