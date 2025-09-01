/**
 * Data Service Configuration
 * กำหนดค่าสำหรับ Data Service และ Adapters
 */

// Development configuration
export const developmentConfig = {
  primarySource: 'file',
  fallbackSource: 'localStorage',
  offlineMode: true,
  syncEnabled: false, // Disable sync in development
  
  file: {
    encoding: 'utf-8',
    delimiter: ',',
    supportedFormats: ['json', 'csv', 'xlsx', 'xls']
  },
  
  localStorage: {
    keyPrefix: 'dev_',
    storageType: 'localStorage', // 'localStorage' or 'indexedDB'
    dbName: 'DevDatabase',
    dbVersion: 1,
    storeName: 'data'
  }
}

// Production configuration
export const productionConfig = {
  primarySource: 'api',
  fallbackSource: 'localStorage',
  offlineMode: true,
  syncEnabled: true,
  
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://api.yourapp.com',
    headers: {
      'Content-Type': 'application/json',
      // Authorization will be set dynamically
    },
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  file: {
    encoding: 'utf-8',
    delimiter: ',',
    supportedFormats: ['json', 'csv', 'xlsx', 'xls']
  },
  
  localStorage: {
    keyPrefix: 'app_',
    storageType: 'indexedDB', // Use IndexedDB for production
    dbName: 'AppDatabase',
    dbVersion: 1,
    storeName: 'data'
  }
}

// Test configuration
export const testConfig = {
  primarySource: 'localStorage',
  fallbackSource: 'localStorage',
  offlineMode: true,
  syncEnabled: false,
  
  localStorage: {
    keyPrefix: 'test_',
    storageType: 'localStorage',
    dbName: 'TestDatabase',
    dbVersion: 1,
    storeName: 'data'
  }
}

/**
 * Get configuration based on environment
 */
export function getDataServiceConfig() {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return productionConfig
    case 'test':
      return testConfig
    default:
      return developmentConfig
  }
}

/**
 * Configuration for specific use cases
 */
export const useCaseConfigs = {
  // File-only operations (import/export)
  fileOnly: {
    primarySource: 'file',
    fallbackSource: 'localStorage',
    offlineMode: false,
    syncEnabled: false
  },
  
  // API-first with offline support
  apiWithOffline: {
    primarySource: 'api',
    fallbackSource: 'localStorage',
    offlineMode: true,
    syncEnabled: true
  },
  
  // Local-only operations
  localOnly: {
    primarySource: 'localStorage',
    fallbackSource: 'localStorage',
    offlineMode: true,
    syncEnabled: false
  },
  
  // Hybrid mode (file import + API sync)
  hybrid: {
    primarySource: 'api',
    fallbackSource: 'localStorage',
    offlineMode: true,
    syncEnabled: true,
    allowFileOperations: true
  }
}

/**
 * Default validation rules
 */
export const validationRules = {
  required: ['id'],
  types: {
    id: 'string',
    createdAt: 'string',
    updatedAt: 'string'
  },
  formats: {
    createdAt: 'iso-date',
    updatedAt: 'iso-date'
  }
}

/**
 * Sync strategies
 */
export const syncStrategies = {
  // Merge local and remote data
  MERGE: 'merge',
  
  // Overwrite local with remote
  OVERWRITE_LOCAL: 'overwrite_local',
  
  // Overwrite remote with local
  OVERWRITE_REMOTE: 'overwrite_remote',
  
  // Append local to remote
  APPEND: 'append',
  
  // Manual conflict resolution
  MANUAL: 'manual'
}

/**
 * Cache policies
 */
export const cachePolicies = {
  // Cache everything
  CACHE_ALL: 'cache_all',
  
  // Cache only successful reads
  CACHE_READS: 'cache_reads',
  
  // No caching
  NO_CACHE: 'no_cache',
  
  // Cache with TTL
  CACHE_TTL: 'cache_ttl'
}

/**
 * Error handling strategies
 */
export const errorStrategies = {
  // Fail fast
  FAIL_FAST: 'fail_fast',
  
  // Retry with exponential backoff
  RETRY_EXPONENTIAL: 'retry_exponential',
  
  // Fallback to cache
  FALLBACK_CACHE: 'fallback_cache',
  
  // Queue for later
  QUEUE_RETRY: 'queue_retry'
}