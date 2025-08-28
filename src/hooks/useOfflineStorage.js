import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for offline data storage and synchronization
 */
export const useOfflineStorage = (key, initialValue = null) => {
  const [data, setData] = useState(initialValue);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsedData = JSON.parse(stored);
        setData(parsedData.data);
        setLastSyncTime(parsedData.lastSync);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, [key]);

  // Save data to localStorage whenever data changes
  useEffect(() => {
    if (data !== null) {
      try {
        const dataToStore = {
          data,
          lastSync: lastSyncTime,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(dataToStore));
      } catch (error) {
        console.error('Error saving offline data:', error);
      }
    }
  }, [key, data, lastSyncTime]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load pending sync operations
  useEffect(() => {
    try {
      const pendingKey = `${key}_pending`;
      const stored = localStorage.getItem(pendingKey);
      if (stored) {
        setPendingSync(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading pending sync operations:', error);
    }
  }, [key]);

  // Save pending sync operations
  useEffect(() => {
    try {
      const pendingKey = `${key}_pending`;
      localStorage.setItem(pendingKey, JSON.stringify(pendingSync));
    } catch (error) {
      console.error('Error saving pending sync operations:', error);
    }
  }, [key, pendingSync]);

  // Update data
  const updateData = useCallback((newData, syncOperation = null) => {
    setData(newData);
    
    // If offline and sync operation provided, add to pending queue
    if (!isOnline && syncOperation) {
      setPendingSync(prev => [...prev, {
        id: Date.now().toString(),
        operation: syncOperation,
        data: newData,
        timestamp: Date.now()
      }]);
    }
  }, [isOnline]);

  // Clear all data
  const clearData = useCallback(() => {
    setData(initialValue);
    setLastSyncTime(null);
    setPendingSync([]);
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_pending`);
  }, [key, initialValue]);

  // Sync pending operations when back online
  const syncPendingOperations = useCallback(async (syncFunction) => {
    if (!isOnline || pendingSync.length === 0) return;

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const operation of pendingSync) {
      try {
        await syncFunction(operation);
        successfulSyncs.push(operation.id);
      } catch (error) {
        console.error('Sync operation failed:', error);
        failedSyncs.push(operation);
      }
    }

    // Remove successful syncs from pending queue
    setPendingSync(prev => prev.filter(op => !successfulSyncs.includes(op.id)));
    
    if (successfulSyncs.length > 0) {
      setLastSyncTime(Date.now());
    }

    return {
      successful: successfulSyncs.length,
      failed: failedSyncs.length
    };
  }, [isOnline, pendingSync]);

  // Get storage info
  const getStorageInfo = useCallback(() => {
    try {
      const used = new Blob([localStorage.getItem(key) || '']).size;
      const pending = pendingSync.length;
      
      return {
        used,
        pending,
        isOnline,
        lastSync: lastSyncTime
      };
    } catch (error) {
      return {
        used: 0,
        pending: 0,
        isOnline,
        lastSync: lastSyncTime
      };
    }
  }, [key, pendingSync.length, isOnline, lastSyncTime]);

  return {
    data,
    isOnline,
    pendingSync: pendingSync.length,
    lastSyncTime,
    updateData,
    clearData,
    syncPendingOperations,
    getStorageInfo
  };
};

/**
 * Hook for managing offline file cache
 */
export const useOfflineFileCache = () => {
  const [cachedFiles, setCachedFiles] = useState(new Map());

  // Cache file data
  const cacheFile = useCallback(async (fileId, fileData) => {
    try {
      // Convert file to base64 for storage
      const base64Data = await fileToBase64(fileData);
      const cacheEntry = {
        id: fileId,
        data: base64Data,
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        timestamp: Date.now()
      };
      
      localStorage.setItem(`file_cache_${fileId}`, JSON.stringify(cacheEntry));
      setCachedFiles(prev => new Map(prev.set(fileId, cacheEntry)));
      
      return true;
    } catch (error) {
      console.error('Error caching file:', error);
      return false;
    }
  }, []);

  // Retrieve cached file
  const getCachedFile = useCallback(async (fileId) => {
    try {
      const cached = localStorage.getItem(`file_cache_${fileId}`);
      if (cached) {
        const cacheEntry = JSON.parse(cached);
        // Convert base64 back to file
        const file = await base64ToFile(cacheEntry.data, cacheEntry.name, cacheEntry.type);
        return file;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving cached file:', error);
      return null;
    }
  }, []);

  // Clear file cache
  const clearFileCache = useCallback(() => {
    cachedFiles.forEach((_, fileId) => {
      localStorage.removeItem(`file_cache_${fileId}`);
    });
    setCachedFiles(new Map());
  }, [cachedFiles]);

  // Load cached files on mount
  useEffect(() => {
    const loadCachedFiles = () => {
      const cached = new Map();
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('file_cache_')) {
          try {
            const fileId = key.replace('file_cache_', '');
            const cacheEntry = JSON.parse(localStorage.getItem(key));
            cached.set(fileId, cacheEntry);
          } catch (error) {
            console.error('Error loading cached file:', error);
          }
        }
      }
      setCachedFiles(cached);
    };

    loadCachedFiles();
  }, []);

  return {
    cachedFiles: Array.from(cachedFiles.values()),
    cacheFile,
    getCachedFile,
    clearFileCache
  };
};

// Utility functions
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

const base64ToFile = (base64Data, fileName, fileType) => {
  return new Promise((resolve) => {
    fetch(base64Data)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], fileName, { type: fileType });
        resolve(file);
      });
  });
};