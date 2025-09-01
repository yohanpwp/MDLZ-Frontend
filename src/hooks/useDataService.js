import { useState, useEffect, useCallback, useRef } from 'react'
import { DataService } from '../services/DataService.js'

/**
 * Custom hook for unified data operations
 * รองรับทั้ง file-based และ API operations
 */
export function useDataService(config = {}) {
  const [dataService] = useState(() => new DataService(config))
  const [status, setStatus] = useState({
    isOnline: navigator.onLine,
    currentAdapter: null,
    syncQueueLength: 0,
    adapters: {}
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const statusUpdateRef = useRef()

  // Update status periodically
  const updateStatus = useCallback(async () => {
    try {
      const newStatus = await dataService.getStatus()
      setStatus(newStatus)
    } catch (error) {
      console.error('Failed to update data service status:', error)
    }
  }, [dataService])

  useEffect(() => {
    updateStatus()
    
    // Update status every 30 seconds
    statusUpdateRef.current = setInterval(updateStatus, 30000)
    
    return () => {
      if (statusUpdateRef.current) {
        clearInterval(statusUpdateRef.current)
      }
    }
  }, [updateStatus])

  /**
   * Read data with loading state management
   */
  const read = useCallback(async (options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.read(options)
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
      updateStatus()
    }
  }, [dataService, updateStatus])

  /**
   * Write data with loading state management
   */
  const write = useCallback(async (data, options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.write(data, options)
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
      updateStatus()
    }
  }, [dataService, updateStatus])

  /**
   * Update data with loading state management
   */
  const update = useCallback(async (id, data, options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.update(id, data, options)
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
      updateStatus()
    }
  }, [dataService, updateStatus])

  /**
   * Delete data with loading state management
   */
  const remove = useCallback(async (id, options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.delete(id, options)
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
      updateStatus()
    }
  }, [dataService, updateStatus])

  /**
   * Search data with loading state management
   */
  const search = useCallback(async (query, options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.search(query, options)
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [dataService])

  /**
   * Sync data between adapters
   */
  const sync = useCallback(async (options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.sync(options)
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
      updateStatus()
    }
  }, [dataService, updateStatus])

  /**
   * Switch to specific adapter
   */
  const switchAdapter = useCallback(async (sourceType) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.switchAdapter(sourceType)
      await updateStatus()
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [dataService, updateStatus])

  /**
   * Import file data
   */
  const importFile = useCallback(async (file, options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.read({ 
        ...options, 
        source: 'file',
        file 
      })
      
      // Optionally save to current adapter
      if (options.saveToAdapter && result) {
        await dataService.write(result, {
          key: options.key || 'imported_data'
        })
      }
      
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
      updateStatus()
    }
  }, [dataService, updateStatus])

  /**
   * Export data to file
   */
  const exportFile = useCallback(async (data, options = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await dataService.write(data, {
        ...options,
        source: 'file'
      })
      return result
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }, [dataService])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Force status update
   */
  const refreshStatus = useCallback(() => {
    updateStatus()
  }, [updateStatus])

  return {
    // Data operations
    read,
    write,
    update,
    remove,
    search,
    sync,
    
    // File operations
    importFile,
    exportFile,
    
    // Adapter management
    switchAdapter,
    
    // State
    loading,
    error,
    status,
    
    // Utilities
    clearError,
    refreshStatus,
    
    // Direct access to service (for advanced usage)
    dataService
  }
}

/**
 * Hook for file-specific operations
 */
export function useFileOperations(config = {}) {
  const fileConfig = {
    ...config,
    primarySource: 'file',
    fallbackSource: 'localStorage'
  }
  
  const {
    importFile,
    exportFile,
    loading,
    error,
    clearError
  } = useDataService(fileConfig)

  return {
    importFile,
    exportFile,
    loading,
    error,
    clearError
  }
}

/**
 * Hook for API-specific operations with offline support
 */
export function useApiOperations(config = {}) {
  const apiConfig = {
    ...config,
    primarySource: 'api',
    fallbackSource: 'localStorage',
    offlineMode: true,
    syncEnabled: true
  }
  
  const dataService = useDataService(apiConfig)

  return {
    ...dataService,
    // API-specific methods can be added here
  }
}