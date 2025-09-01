# Data Service Architecture

สถาปัตยกรรม frontend ที่รองรับทั้งระบบ file-based และเตรียมพร้อมสำหรับ API integration

## 🎯 วัตถุประสงค์

- รองรับการทำงานแบบ file-based (import/export) ในปัจจุบัน
- เตรียมพร้อมสำหรับ API integration ในอนาคต
- Offline-first architecture
- Unified data service interface
- Data synchronization strategy

## 🏗️ สถาปัตยกรรม

```
┌─────────────────────────────────────────┐
│           React Components              │
├─────────────────────────────────────────┤
│              Hooks Layer                │
│  useDataService | useFileOperations     │
├─────────────────────────────────────────┤
│            Data Service                 │
│        (Unified Interface)              │
├─────────────────────────────────────────┤
│             Adapters                    │
│  File | API | LocalStorage | IndexedDB  │
└─────────────────────────────────────────┘
```

## 🚀 การใช้งาน

### 1. Basic Usage

```javascript
import { useDataService } from './hooks/useDataService.js'

function MyComponent() {
  const {
    read, write, update, remove, search,
    importFile, exportFile,
    loading, error, status
  } = useDataService({
    primarySource: 'file',
    fallbackSource: 'localStorage'
  })

  // Import file
  const handleImport = async (file) => {
    const data = await importFile(file)
    console.log('Imported data:', data)
  }

  // Export data
  const handleExport = async () => {
    await exportFile(myData, {
      filename: 'export',
      format: 'xlsx'
    })
  }
}
```

### 2. File Operations Only

```javascript
import { useFileOperations } from './hooks/useDataService.js'

function FileManager() {
  const { importFile, exportFile, loading, error } = useFileOperations()

  // รองรับ JSON, CSV, Excel
  const formats = ['json', 'csv', 'xlsx']
}
```

### 3. API with Offline Support

```javascript
const apiConfig = {
  primarySource: 'api',
  fallbackSource: 'localStorage',
  offlineMode: true,
  syncEnabled: true,
  api: {
    baseUrl: 'https://api.example.com',
    headers: { 'Authorization': 'Bearer token' }
  }
}

const { sync, status } = useDataService(apiConfig)

// ซิงค์ข้อมูลเมื่อกลับมา online
useEffect(() => {
  if (status.isOnline && status.syncQueueLength > 0) {
    sync()
  }
}, [status.isOnline])
```

## 📁 โครงสร้างไฟล์

```
src/
├── services/
│   ├── interfaces/
│   │   └── IDataAdapter.js          # Interface สำหรับ adapters
│   ├── adapters/
│   │   ├── FileDataAdapter.js       # File import/export
│   │   ├── ApiDataAdapter.js        # REST API operations
│   │   └── LocalStorageAdapter.js   # Local storage operations
│   └── DataService.js               # Unified service
├── hooks/
│   └── useDataService.js            # React hooks
├── config/
│   └── dataService.js               # Configuration
└── components/examples/
    └── DataServiceDemo.jsx          # Demo component
```

## 🔧 Configuration

### Development (File-first)
```javascript
{
  primarySource: 'file',
  fallbackSource: 'localStorage',
  offlineMode: true,
  syncEnabled: false
}
```

### Production (API-first)
```javascript
{
  primarySource: 'api',
  fallbackSource: 'localStorage',
  offlineMode: true,
  syncEnabled: true,
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL,
    timeout: 30000,
    retryAttempts: 3
  }
}
```

## 📊 Supported File Formats

| Format | Import | Export | Notes |
|--------|--------|--------|-------|
| JSON   | ✅     | ✅     | Native support |
| CSV    | ✅     | ✅     | Via PapaParse |
| Excel  | ✅     | ✅     | Via SheetJS (.xlsx, .xls) |

## 🔄 Data Flow

### File Import Flow
```
File Upload → FileAdapter → Validation → LocalStorage → UI Update
```

### API Sync Flow
```
Local Data → ApiAdapter → Server → Conflict Resolution → Local Update
```

### Offline Flow
```
User Action → Queue → LocalStorage → [Online] → API Sync
```

## 🛠️ Features

### ✅ ปัจจุบัน (File-based)
- File import/export (JSON, CSV, Excel)
- Local data validation
- Client-side data transformation
- Browser storage (localStorage/IndexedDB)
- Offline capability

### 🔄 อนาคต (API Integration)
- REST API integration
- Real-time synchronization
- Conflict resolution
- Background sync
- Multi-user support

## 🎮 Demo

รัน application และคลิก "Data Service Demo" เพื่อทดสอบ:

1. **File Operations**: Import/Export ไฟล์ต่างๆ
2. **Adapter Switching**: เปลี่ยนระหว่าง file, API, localStorage
3. **Offline Support**: ทดสอบการทำงานแบบ offline
4. **Data Sync**: ซิงค์ข้อมูลระหว่าง adapters

## 🔒 Security

- Input validation สำหรับทุก operations
- File type และ size validation
- XSS protection
- Secure API authentication
- Data encryption สำหรับ sensitive data

## 📈 Performance

- Lazy loading สำหรับ large datasets
- Batch operations
- Intelligent caching
- Background processing
- Memory management

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Performance tests
npm run test:performance
```

## 🚀 Migration Path

### Phase 1: Current (File-only)
- ใช้ FileDataAdapter
- LocalStorage สำหรับ cache
- ไม่มี API integration

### Phase 2: Hybrid
- เพิ่ม ApiDataAdapter
- เปิดใช้ sync functionality
- รองรับทั้ง file และ API

### Phase 3: API-first
- เปลี่ยน primary source เป็น API
- File operations เป็น secondary
- Full offline-first architecture

## 📚 API Reference

### DataService Methods

```javascript
// CRUD operations
await dataService.read(options)
await dataService.write(data, options)
await dataService.update(id, data, options)
await dataService.delete(id, options)
await dataService.search(query, options)

// Sync operations
await dataService.sync(options)
await dataService.switchAdapter(sourceType)

// Status
await dataService.getStatus()
```

### Hook Methods

```javascript
const {
  // Data operations
  read, write, update, remove, search, sync,
  
  // File operations
  importFile, exportFile,
  
  // State
  loading, error, status,
  
  // Utilities
  clearError, refreshStatus, switchAdapter
} = useDataService(config)
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details