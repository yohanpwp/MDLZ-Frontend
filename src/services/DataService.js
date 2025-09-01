import { FileDataAdapter } from './adapters/FileDataAdapter.js'
import { ApiDataAdapter } from './adapters/ApiDataAdapter.js'
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter.js'
import { DATA_SOURCE_TYPES } from './interfaces/IDataAdapter.js'

/**
 * Unified Data Service
 * จัดการข้อมูลผ่าน adapter pattern รองรับทั้ง file และ API
 */
export class DataService {
  constructor(config = {}) {
    this.config = {
      primarySource: 'file', // 'file', 'api', 'localStorage'
      fallbackSource: 'localStorage',
      offlineMode: true,
      syncEnabled: true,
      ...config
    }
    
    this.adapters = new Map()
    this.currentAdapter = null
    this.syncQueue = []
    this.isOnline = navigator.onLine
    
    this._initializeAdapters()
    this._setupNetworkListeners()
  }

  /**
   * Initialize all adapters
   */
  _initializeAdapters() {
    // File adapter
    this.adapters.set(DATA_SOURCE_TYPES.FILE, new FileDataAdapter(this.config.file))
    
    // API adapter
    if (this.config.api) {
      this.adapters.set(DATA_SOURCE_TYPES.API, new ApiDataAdapter(this.config.api))
    }
    
    // Local storage adapter
    this.adapters.set(DATA_SOURCE_TYPES.LOCAL_STORAGE, new LocalStorageAdapter(this.config.localStorage))
    
    // Set current adapter based on configuration and network status
    this._setCurrentAdapter()
  }

  /**
   * Set current adapter based on availability and configuration
   */
  async _setCurrentAdapter() {
    const primaryAdapter = this.adapters.get(this._mapSourceType(this.config.primarySource))
    const fallbackAdapter = this.adapters.get(this._mapSourceType(this.config.fallbackSource))

    try {
      if (primaryAdapter && await primaryAdapter.isConnected()) {
        this.currentAdapter = primaryAdapter
        return
      }
    } catch (error) {
      console.warn('Primary adapter not available:', error.message)
    }

    // Use fallback adapter
    if (fallbackAdapter && await fallbackAdapter.isConnected()) {
      this.currentAdapter = fallbackAdapter
    } else {
      throw new Error('No available data adapters')
    }
  }

  /**
   * Read data with automatic fallback
   */
  async read(options = {}) {
    const { useCache = true, source } = options

    try {
      // Use specific source if requested
      if (source) {
        const adapter = this.adapters.get(this._mapSourceType(source))
        if (adapter) {
          return await adapter.read(options)
        }
      }

      // Try current adapter first
      if (this.currentAdapter) {
        const result = await this.currentAdapter.read(options)
        
        // Cache result if using API and cache is enabled
        if (useCache && this.currentAdapter.sourceType === DATA_SOURCE_TYPES.API) {
          await this._cacheData(options.key || 'default', result)
        }
        
        return result
      }

      throw new Error('No adapter available for reading')
    } catch (error) {
      // Try fallback from cache if primary fails
      if (useCache && this.config.offlineMode) {
        return await this._readFromCache(options.key || 'default')
      }
      throw error
    }
  }

  /**
   * Write data with offline support
   */
  async write(data, options = {}) {
    const { sync = true, source } = options

    try {
      // Use specific source if requested
      if (source) {
        const adapter = this.adapters.get(this._mapSourceType(source))
        if (adapter) {
          return await adapter.write(data, options)
        }
      }

      // Write to current adapter
      if (this.currentAdapter) {
        const result = await this.currentAdapter.write(data, options)
        
        // Cache for offline access
        if (this.config.offlineMode) {
          await this._cacheData(options.key || 'default', data)
        }
        
        return result
      }

      throw new Error('No adapter available for writing')
    } catch (error) {
      // Queue for sync if offline and sync is enabled
      if (sync && this.config.syncEnabled && !this.isOnline) {
        await this._queueForSync('write', data, options)
        
        // Save to local storage as fallback
        const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
        if (localAdapter) {
          return await localAdapter.write(data, options)
        }
      }
      throw error
    }
  }

  /**
   * Update data with conflict resolution
   */
  async update(id, data, options = {}) {
    const { sync = true, source } = options

    try {
      // Use specific source if requested
      if (source) {
        const adapter = this.adapters.get(this._mapSourceType(source))
        if (adapter) {
          return await adapter.update(id, data, options)
        }
      }

      if (this.currentAdapter) {
        const result = await this.currentAdapter.update(id, data, options)
        
        // Update cache
        if (this.config.offlineMode) {
          await this._updateCache(options.key || 'default', id, data)
        }
        
        return result
      }

      throw new Error('No adapter available for updating')
    } catch (error) {
      // Queue for sync if offline
      if (sync && this.config.syncEnabled && !this.isOnline) {
        await this._queueForSync('update', { id, data }, options)
        
        // Update local storage
        const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
        if (localAdapter) {
          return await localAdapter.update(id, data, options)
        }
      }
      throw error
    }
  }

  /**
   * Delete data
   */
  async delete(id, options = {}) {
    const { sync = true, source } = options

    try {
      if (source) {
        const adapter = this.adapters.get(this._mapSourceType(source))
        if (adapter) {
          return await adapter.delete(id, options)
        }
      }

      if (this.currentAdapter) {
        const result = await this.currentAdapter.delete(id, options)
        
        // Remove from cache
        if (this.config.offlineMode) {
          await this._removeFromCache(options.key || 'default', id)
        }
        
        return result
      }

      throw new Error('No adapter available for deleting')
    } catch (error) {
      if (sync && this.config.syncEnabled && !this.isOnline) {
        await this._queueForSync('delete', { id }, options)
        
        const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
        if (localAdapter) {
          return await localAdapter.delete(id, options)
        }
      }
      throw error
    }
  }

  /**
   * Search data across adapters
   */
  async search(query, options = {}) {
    const { source, useCache = true } = options

    try {
      if (source) {
        const adapter = this.adapters.get(this._mapSourceType(source))
        if (adapter) {
          return await adapter.search(query, options)
        }
      }

      if (this.currentAdapter) {
        return await this.currentAdapter.search(query, options)
      }

      throw new Error('No adapter available for searching')
    } catch (error) {
      // Search in cache if primary fails
      if (useCache && this.config.offlineMode) {
        const cachedData = await this._readFromCache(options.key || 'default')
        if (cachedData && Array.isArray(cachedData)) {
          const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
          return await localAdapter.search(query, cachedData)
        }
      }
      throw error
    }
  }

  /**
   * Sync data between adapters
   */
  async sync(options = {}) {
    if (!this.config.syncEnabled) {
      return { success: false, message: 'Sync is disabled' }
    }

    const apiAdapter = this.adapters.get(DATA_SOURCE_TYPES.API)
    const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)

    if (!apiAdapter || !localAdapter) {
      return { success: false, message: 'Required adapters not available for sync' }
    }

    try {
      // Get local data
      const localData = await localAdapter.read({ key: options.key || 'default' })
      
      // Sync with API
      const syncResult = await apiAdapter.sync({
        localData: localData || [],
        ...options
      })

      // Process sync queue
      if (this.syncQueue.length > 0) {
        await this._processSyncQueue()
      }

      return {
        success: true,
        ...syncResult
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get adapter status
   */
  async getStatus() {
    const status = {
      isOnline: this.isOnline,
      currentAdapter: this.currentAdapter?.sourceType || null,
      syncQueueLength: this.syncQueue.length,
      adapters: {}
    }

    for (const [type, adapter] of this.adapters) {
      try {
        status.adapters[type] = {
          available: await adapter.isConnected(),
          type: adapter.sourceType
        }
      } catch (error) {
        status.adapters[type] = {
          available: false,
          error: error.message
        }
      }
    }

    return status
  }

  /**
   * Switch to specific adapter
   */
  async switchAdapter(sourceType) {
    const adapter = this.adapters.get(this._mapSourceType(sourceType))
    
    if (!adapter) {
      throw new Error(`Adapter for ${sourceType} not found`)
    }

    if (await adapter.isConnected()) {
      this.currentAdapter = adapter
      return true
    }

    throw new Error(`Adapter for ${sourceType} is not available`)
  }

  // Private methods
  _mapSourceType(source) {
    const mapping = {
      'file': DATA_SOURCE_TYPES.FILE,
      'api': DATA_SOURCE_TYPES.API,
      'localStorage': DATA_SOURCE_TYPES.LOCAL_STORAGE,
      'indexedDB': DATA_SOURCE_TYPES.INDEXED_DB
    }
    return mapping[source] || source
  }

  _setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this._setCurrentAdapter()
      
      // Process sync queue when back online
      if (this.config.syncEnabled && this.syncQueue.length > 0) {
        this._processSyncQueue()
      }
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this._setCurrentAdapter()
    })
  }

  async _cacheData(key, data) {
    const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
    if (localAdapter) {
      await localAdapter.write(data, { key: `cache_${key}` })
    }
  }

  async _readFromCache(key) {
    const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
    if (localAdapter) {
      return await localAdapter.read({ key: `cache_${key}` })
    }
    return null
  }

  async _updateCache(key, id, data) {
    const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
    if (localAdapter) {
      await localAdapter.update(id, data, { key: `cache_${key}` })
    }
  }

  async _removeFromCache(key, id) {
    const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
    if (localAdapter) {
      await localAdapter.delete(id, { key: `cache_${key}` })
    }
  }

  async _queueForSync(operation, data, options) {
    this.syncQueue.push({
      operation,
      data,
      options,
      timestamp: new Date().toISOString()
    })

    // Persist sync queue
    const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
    if (localAdapter) {
      await localAdapter.write(this.syncQueue, { key: 'sync_queue' })
    }
  }

  async _processSyncQueue() {
    if (this.syncQueue.length === 0) return

    const apiAdapter = this.adapters.get(DATA_SOURCE_TYPES.API)
    if (!apiAdapter || !await apiAdapter.isConnected()) return

    const processedItems = []
    const failedItems = []

    for (const item of this.syncQueue) {
      try {
        switch (item.operation) {
          case 'write':
            await apiAdapter.write(item.data, item.options)
            break
          case 'update':
            await apiAdapter.update(item.data.id, item.data.data, item.options)
            break
          case 'delete':
            await apiAdapter.delete(item.data.id, item.options)
            break
        }
        processedItems.push(item)
      } catch (error) {
        console.error('Sync failed for item:', item, error)
        failedItems.push({ ...item, error: error.message })
      }
    }

    // Update sync queue (keep failed items)
    this.syncQueue = failedItems

    // Persist updated sync queue
    const localAdapter = this.adapters.get(DATA_SOURCE_TYPES.LOCAL_STORAGE)
    if (localAdapter) {
      await localAdapter.write(this.syncQueue, { key: 'sync_queue' })
    }

    return {
      processed: processedItems.length,
      failed: failedItems.length
    }
  }
}