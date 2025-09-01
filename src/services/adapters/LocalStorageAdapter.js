import { IDataAdapter, DATA_SOURCE_TYPES } from '../interfaces/IDataAdapter.js'

/**
 * Local Storage Data Adapter
 * จัดการข้อมูลผ่าน localStorage และ IndexedDB
 */
export class LocalStorageAdapter extends IDataAdapter {
  constructor(options = {}) {
    super()
    this.sourceType = DATA_SOURCE_TYPES.LOCAL_STORAGE
    this.storageType = options.storageType || 'localStorage' // 'localStorage' or 'indexedDB'
    this.keyPrefix = options.keyPrefix || 'app_'
    this.dbName = options.dbName || 'AppDatabase'
    this.dbVersion = options.dbVersion || 1
    this.storeName = options.storeName || 'data'
    
    if (this.storageType === 'indexedDB') {
      this._initIndexedDB()
    }
  }

  /**
   * อ่านข้อมูลจาก local storage
   */
  async read(options = {}) {
    const { key, id } = options

    if (this.storageType === 'localStorage') {
      return this._readFromLocalStorage(key, id)
    } else {
      return await this._readFromIndexedDB(key, id)
    }
  }

  /**
   * เขียนข้อมูลไปยัง local storage
   */
  async write(data, options = {}) {
    const { key, id } = options

    if (this.storageType === 'localStorage') {
      return this._writeToLocalStorage(data, key, id)
    } else {
      return await this._writeToIndexedDB(data, key, id)
    }
  }

  /**
   * อัพเดทข้อมูลใน local storage
   */
  async update(id, data, options = {}) {
    const { key } = options

    if (this.storageType === 'localStorage') {
      return this._updateInLocalStorage(id, data, key)
    } else {
      return await this._updateInIndexedDB(id, data, key)
    }
  }

  /**
   * ลบข้อมูลจาก local storage
   */
  async delete(id, options = {}) {
    const { key } = options

    if (this.storageType === 'localStorage') {
      return this._deleteFromLocalStorage(id, key)
    } else {
      return await this._deleteFromIndexedDB(id, key)
    }
  }

  /**
   * ค้นหาข้อมูลใน local storage
   */
  async search(query, options = {}) {
    const { key } = options
    
    if (this.storageType === 'localStorage') {
      return this._searchInLocalStorage(query, key)
    } else {
      return await this._searchInIndexedDB(query, key)
    }
  }

  /**
   * Local storage เชื่อมต่อได้เสมอ
   */
  async isConnected() {
    try {
      if (this.storageType === 'localStorage') {
        // Test localStorage availability
        const testKey = '__test__'
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
        return true
      } else {
        // Test IndexedDB availability
        return 'indexedDB' in window
      }
    } catch (error) {
      return false
    }
  }

  /**
   * Local storage ไม่ต้องซิงค์
   */
  async sync(options = {}) {
    return {
      success: true,
      message: 'Local storage does not require synchronization'
    }
  }

  /**
   * Clear all data
   */
  async clear(options = {}) {
    if (this.storageType === 'localStorage') {
      return this._clearLocalStorage()
    } else {
      return await this._clearIndexedDB()
    }
  }

  /**
   * Get storage info
   */
  async getStorageInfo() {
    if (this.storageType === 'localStorage') {
      return this._getLocalStorageInfo()
    } else {
      return await this._getIndexedDBInfo()
    }
  }

  // LocalStorage methods
  _readFromLocalStorage(key, id) {
    try {
      const fullKey = this._getFullKey(key)
      const stored = localStorage.getItem(fullKey)
      
      if (!stored) return null
      
      const data = JSON.parse(stored)
      
      if (id) {
        return Array.isArray(data) ? data.find(item => item.id === id) : null
      }
      
      return data
    } catch (error) {
      throw new Error(`Failed to read from localStorage: ${error.message}`)
    }
  }

  _writeToLocalStorage(data, key, id) {
    try {
      const fullKey = this._getFullKey(key)
      
      if (id) {
        // Update existing array
        const existing = this._readFromLocalStorage(key) || []
        const index = existing.findIndex(item => item.id === id)
        
        if (index >= 0) {
          existing[index] = { ...existing[index], ...data, id }
        } else {
          existing.push({ ...data, id })
        }
        
        localStorage.setItem(fullKey, JSON.stringify(existing))
        return { ...data, id }
      } else {
        localStorage.setItem(fullKey, JSON.stringify(data))
        return data
      }
    } catch (error) {
      throw new Error(`Failed to write to localStorage: ${error.message}`)
    }
  }

  _updateInLocalStorage(id, data, key) {
    return this._writeToLocalStorage(data, key, id)
  }

  _deleteFromLocalStorage(id, key) {
    try {
      const fullKey = this._getFullKey(key)
      
      if (id) {
        const existing = this._readFromLocalStorage(key) || []
        const filtered = existing.filter(item => item.id !== id)
        localStorage.setItem(fullKey, JSON.stringify(filtered))
        return true
      } else {
        localStorage.removeItem(fullKey)
        return true
      }
    } catch (error) {
      throw new Error(`Failed to delete from localStorage: ${error.message}`)
    }
  }

  _searchInLocalStorage(query, key) {
    try {
      const data = this._readFromLocalStorage(key)
      if (!Array.isArray(data)) return []

      const { field, value, operator = 'includes' } = query

      return data.filter(item => {
        const fieldValue = item[field]
        if (fieldValue === undefined) return false

        switch (operator) {
          case 'equals':
            return fieldValue === value
          case 'includes':
            return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
          case 'startsWith':
            return String(fieldValue).toLowerCase().startsWith(String(value).toLowerCase())
          case 'endsWith':
            return String(fieldValue).toLowerCase().endsWith(String(value).toLowerCase())
          default:
            return false
        }
      })
    } catch (error) {
      throw new Error(`Failed to search in localStorage: ${error.message}`)
    }
  }

  _clearLocalStorage() {
    try {
      const keys = Object.keys(localStorage)
      const prefixedKeys = keys.filter(key => key.startsWith(this.keyPrefix))
      
      prefixedKeys.forEach(key => localStorage.removeItem(key))
      
      return {
        success: true,
        clearedKeys: prefixedKeys.length
      }
    } catch (error) {
      throw new Error(`Failed to clear localStorage: ${error.message}`)
    }
  }

  _getLocalStorageInfo() {
    try {
      const keys = Object.keys(localStorage)
      const prefixedKeys = keys.filter(key => key.startsWith(this.keyPrefix))
      
      let totalSize = 0
      prefixedKeys.forEach(key => {
        totalSize += localStorage.getItem(key).length
      })

      return {
        type: 'localStorage',
        keys: prefixedKeys.length,
        estimatedSize: totalSize,
        available: true
      }
    } catch (error) {
      return {
        type: 'localStorage',
        available: false,
        error: error.message
      }
    }
  }

  // IndexedDB methods (simplified implementation)
  async _initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true })
          store.createIndex('key', 'key', { unique: false })
        }
      }
    })
  }

  async _readFromIndexedDB(key, id) {
    if (!this.db) await this._initIndexedDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      if (id) {
        const request = store.get(id)
        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(request.error)
      } else {
        const index = store.index('key')
        const request = index.getAll(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }
    })
  }

  async _writeToIndexedDB(data, key, id) {
    if (!this.db) await this._initIndexedDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const record = { ...data, key, id }
      const request = store.put(record)
      
      request.onsuccess = () => resolve(record)
      request.onerror = () => reject(request.error)
    })
  }

  async _updateInIndexedDB(id, data, key) {
    return await this._writeToIndexedDB(data, key, id)
  }

  async _deleteFromIndexedDB(id, key) {
    if (!this.db) await this._initIndexedDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.delete(id)
      request.onsuccess = () => resolve(true)
      request.onerror = () => reject(request.error)
    })
  }

  async _searchInIndexedDB(query, key) {
    if (!this.db) await this._initIndexedDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('key')
      
      const request = index.getAll(key)
      request.onsuccess = () => {
        const results = request.result
        const { field, value, operator = 'includes' } = query
        
        const filtered = results.filter(item => {
          const fieldValue = item[field]
          if (fieldValue === undefined) return false

          switch (operator) {
            case 'equals':
              return fieldValue === value
            case 'includes':
              return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
            default:
              return false
          }
        })
        
        resolve(filtered)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async _clearIndexedDB() {
    if (!this.db) await this._initIndexedDB()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.clear()
      request.onsuccess = () => resolve({ success: true })
      request.onerror = () => reject(request.error)
    })
  }

  async _getIndexedDBInfo() {
    try {
      if (!this.db) await this._initIndexedDB()
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)
        
        const request = store.count()
        request.onsuccess = () => {
          resolve({
            type: 'indexedDB',
            records: request.result,
            available: true
          })
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      return {
        type: 'indexedDB',
        available: false,
        error: error.message
      }
    }
  }

  // Helper methods
  _getFullKey(key) {
    return `${this.keyPrefix}${key}`
  }
}