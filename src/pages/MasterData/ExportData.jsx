import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  Settings,
  BarChart3,
  Database,
  Clock,
  AlertCircle,
  CheckCircle,
  Search
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import {
  exportMasterData,
  setExportFilters,
  loadExportHistory,
  loadMasterData,
  resetExportState,
  selectIsExporting,
  selectExportProgress,
  selectExportHistory,
  selectSelectedDataType,
  selectMasterDataByType,
  selectError
} from '../../redux/slices/masterDataSlice';
import MasterDataService from '../../services/MasterDataService';

const ExportData = () => {
  const dispatch = useDispatch();
  const [selectedDataType, setSelectedDataType] = useState('customers');
  const [showFilters, setShowFilters] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: 'all',
    search: ''
  });
  const [statistics, setStatistics] = useState(null);

  // Redux state
  const isExporting = useSelector(selectIsExporting);
  const exportProgress = useSelector(selectExportProgress);
  const exportHistory = useSelector(selectExportHistory);
  const error = useSelector(selectError);
  const masterData = useSelector(state => selectMasterDataByType(state, selectedDataType));

  // Load data on component mount and when data type changes
  useEffect(() => {
    dispatch(loadExportHistory());
    dispatch(loadMasterData({ dataType: selectedDataType }));
    
    // Load statistics
    const stats = MasterDataService.getExportStatistics();
    setStatistics(stats);
  }, [dispatch, selectedDataType]);

  // Data type configurations
  const dataTypeConfigs = {
    customers: {
      title: 'Customer Database',
      description: 'Export customer information and contact details',
      icon: Database,
      color: 'blue'
    },
    products: {
      title: 'Product Catalog',
      description: 'Export product information and pricing data',
      icon: FileText,
      color: 'green'
    },
    references: {
      title: 'Reference Data',
      description: 'Export tax rates, currencies, and other reference information',
      icon: Settings,
      color: 'purple'
    }
  };

  // Available export formats
  const exportFormats = MasterDataService.getAvailableFormats();

  const handleExport = async (dataType, customFilters = {}) => {
    const exportFilters = { ...filters, ...customFilters };
    
    dispatch(exportMasterData({
      dataType,
      filters: exportFilters,
      format: exportFormat,
      options: {
        includeMetadata: true,
        timestamp: true
      }
    }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    dispatch(setExportFilters(newFilters));
  };

  const getDataTypeStats = (dataType) => {
    const data = masterData;
    const activeCount = data.filter(item => item.isActive !== false).length;
    const inactiveCount = data.length - activeCount;
    
    return {
      total: data.length,
      active: activeCount,
      inactive: inactiveCount
    };
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Export Data</h1>
        <p className="text-muted-foreground">
          Export master data and validation results for backup or analysis
        </p>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Export Error</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Export statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium">Total Exports</span>
            </div>
            <p className="text-2xl font-bold mt-2">{statistics.totalExports}</p>
            <p className="text-xs text-muted-foreground">
              {statistics.exportsLast30Days} in last 30 days
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Records Exported</span>
            </div>
            <p className="text-2xl font-bold mt-2">{statistics.totalRecordsExported.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              Avg: {statistics.averageExportSize} per export
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Download className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium">Popular Format</span>
            </div>
            <p className="text-2xl font-bold mt-2 uppercase">
              {Object.entries(statistics.formatBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'CSV'}
            </p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium">Most Exported</span>
            </div>
            <p className="text-2xl font-bold mt-2 capitalize">
              {Object.entries(statistics.dataTypeBreakdown).sort(([,a], [,b]) => b - a)[0]?.[0] || 'Customers'}
            </p>
          </div>
        </div>
      )}

      {/* Export options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(dataTypeConfigs).map(([dataType, config]) => {
          const Icon = config.icon;
          const stats = getDataTypeStats(dataType);
          const isSelected = selectedDataType === dataType;
          
          return (
            <div 
              key={dataType}
              className={`bg-card border rounded-lg p-6 cursor-pointer transition-colors ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedDataType(dataType)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-${config.color}-100`}>
                  <Icon className={`h-6 w-6 text-${config.color}-600`} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{config.title}</h3>
                  <p className="text-sm text-muted-foreground">{stats.total} records</p>
                </div>
              </div>
              
              <p className="text-muted-foreground mb-4 text-sm">
                {config.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Badge variant="secondary" size="sm">
                    {stats.active} active
                  </Badge>
                  {stats.inactive > 0 && (
                    <Badge variant="outline" size="sm">
                      {stats.inactive} inactive
                    </Badge>
                  )}
                </div>
                
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExport(dataType);
                  }}
                  disabled={isExporting || stats.total === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Export configuration */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Export Configuration</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
        </div>

        {/* Format selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Export Format</label>
          <div className="grid grid-cols-3 gap-3">
            {exportFormats.map((format) => (
              <label key={format.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.value}
                  checked={exportFormat === format.value}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="rounded"
                />
                <div>
                  <span className="text-sm font-medium">{format.label}</span>
                  <p className="text-xs text-muted-foreground">{format.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm"
              >
                <option value="all">All Records</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* Export button */}
        <div className="flex justify-end mt-4">
          <Button
            onClick={() => handleExport(selectedDataType)}
            disabled={isExporting}
            className="min-w-32"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {dataTypeConfigs[selectedDataType]?.title}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Export progress */}
      {isExporting && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Exporting Data</h3>
              <span className="text-sm text-muted-foreground">
                {exportProgress.progress}%
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress.progress}%` }}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{exportProgress.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Export history */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Export History</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(loadExportHistory())}
          >
            Refresh
          </Button>
        </div>
        
        <div className="space-y-3">
          {exportHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No exports found. Start by exporting your first data file.
            </p>
          ) : (
            exportHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium capitalize">
                      {item.dataType} ({item.format?.toUpperCase()})
                    </p>
                    <p className="text-sm text-muted-foreground">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.startTime).toLocaleString()}
                      {item.duration && ` • ${formatDuration(item.duration)}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    {item.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${
                      item.status === 'completed' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.recordCount?.toLocaleString()} records
                  </p>
                  {item.fileSize && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.fileSize)}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportData;