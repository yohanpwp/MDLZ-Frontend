import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Download, FileText, Table, Settings, CheckCircle, AlertCircle, X, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { exportReport } from '../../redux/slices/reportsSlice';
import { EXPORT_FORMATS } from '../../types/reports';
import ExportService from '../../services/ExportService';

const ExportOptions = ({ report, onClose }) => {
  const dispatch = useDispatch();
  const { isExporting, exports } = useSelector(state => state.reports);
  const { user } = useSelector(state => state.auth);
  
  const [exportOptions, setExportOptions] = useState({
    format: EXPORT_FORMATS.PDF,
    filename: report.name.replace(/[^a-zA-Z0-9]/g, '_'),
    includeCharts: true,
    includeMetadata: true,
    includeRawData: false,
    formatOptions: {}
  });

  const [exportProgress, setExportProgress] = useState(null);
  const [currentExportId, setCurrentExportId] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Progress tracking callback
  const handleProgressUpdate = useCallback((progress) => {
    setExportProgress(progress);
    
    // Show completion notification
    if (progress.status === 'completed') {
      addNotification({
        type: 'success',
        title: 'Export Completed',
        message: `${exportOptions.filename}.${exportOptions.format} has been exported successfully`,
        timestamp: new Date(),
        downloadUrl: progress.downloadUrl
      });
    } else if (progress.status === 'failed') {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: progress.error || 'An error occurred during export',
        timestamp: new Date()
      });
    }
  }, [exportOptions.filename, exportOptions.format]);

  // Add notification
  const addNotification = (notification) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
    
    // Auto-remove success notifications after 10 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(id);
      }, 10000);
    }
  };

  // Remove notification
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleExport = async () => {
    try {
      setExportProgress({ status: 'preparing', progress: 0, currentStep: 'Initializing export...' });
      
      const result = await dispatch(exportReport({
        reportId: report.id,
        exportOptions,
        onProgress: handleProgressUpdate
      })).unwrap();
      
      setCurrentExportId(result.exportId);
      
      // Auto-download the file
      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (error) {
      setExportProgress({ 
        status: 'failed', 
        progress: 0, 
        error: error.message,
        currentStep: 'Export failed'
      });
    }
  };

  // Cancel export
  const handleCancelExport = () => {
    if (currentExportId) {
      const success = ExportService.cancelExport(currentExportId);
      if (success) {
        setExportProgress({ 
          status: 'cancelled', 
          progress: 0, 
          currentStep: 'Export cancelled',
          cancelledAt: new Date()
        });
        setCurrentExportId(null);
        
        addNotification({
          type: 'info',
          title: 'Export Cancelled',
          message: 'The export operation has been cancelled',
          timestamp: new Date()
        });
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentExportId) {
        // Clean up any listeners when component unmounts
        ExportService.removeProgressListener(currentExportId, handleProgressUpdate);
      }
    };
  }, [currentExportId, handleProgressUpdate]);

  const handleOptionChange = (key, value) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFormatOptionChange = (key, value) => {
    setExportOptions(prev => ({
      ...prev,
      formatOptions: {
        ...prev.formatOptions,
        [key]: value
      }
    }));
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'excel':
        return <Table className="h-4 w-4" />;
      case 'csv':
        return <Table className="h-4 w-4" />;
      case 'json':
        return <Settings className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatDescription = (format) => {
    switch (format) {
      case 'pdf':
        return 'Formatted document with charts and styling';
      case 'excel':
        return 'Spreadsheet with multiple sheets and formatting';
      case 'csv':
        return 'Simple comma-separated values file';
      case 'json':
        return 'Raw data in JSON format for developers';
      default:
        return '';
    }
  };

  const getEstimatedSize = () => {
    const baseSize = report.recordCount * 0.1; // KB per record
    let multiplier = 1;
    
    if (exportOptions.format === 'pdf') multiplier = 2;
    if (exportOptions.includeCharts) multiplier *= 1.5;
    if (exportOptions.includeRawData) multiplier *= 2;
    
    const sizeKB = baseSize * multiplier;
    
    if (sizeKB < 1024) {
      return `~${Math.round(sizeKB)} KB`;
    } else {
      return `~${(sizeKB / 1024).toFixed(1)} MB`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Export Report</h3>
        <p className="text-muted-foreground">
          Configure export options for "{report.name}"
        </p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                p-4 rounded-lg border flex items-start gap-3
                ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : ''}
                ${notification.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
                ${notification.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''}
              `}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {notification.type === 'success' && <CheckCircle className="h-4 w-4" />}
                  {notification.type === 'error' && <AlertCircle className="h-4 w-4" />}
                  {notification.type === 'info' && <Clock className="h-4 w-4" />}
                  <span className="font-medium">{notification.title}</span>
                </div>
                <p className="text-sm">{notification.message}</p>
                {notification.downloadUrl && (
                  <a
                    href={notification.downloadUrl}
                    download
                    className="text-sm underline hover:no-underline mt-1 inline-block"
                  >
                    Download file
                  </a>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-current hover:bg-black/10 rounded p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Export Progress */}
      {exportProgress && (
        <div className="p-4 border rounded-lg">
          {(exportProgress.status === 'preparing' || exportProgress.status === 'exporting') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  <span className="font-medium">
                    {exportProgress.status === 'preparing' ? 'Preparing export...' : 'Exporting...'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelExport}
                  className="text-red-600 hover:text-red-700"
                >
                  Cancel
                </Button>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{exportProgress.currentStep || 'Processing...'}</span>
                  <span>{Math.round(exportProgress.progress || 0)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress.progress || 0}%` }}
                  />
                </div>
              </div>
              
              {/* Estimated time */}
              {exportProgress.estimatedEndTime && (
                <div className="text-sm text-muted-foreground">
                  Estimated completion: {new Date(exportProgress.estimatedEndTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
          
          {exportProgress.status === 'completed' && (
            <div className="flex items-center gap-3 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <div>
                <span className="font-medium">Export completed successfully!</span>
                {exportProgress.processingTimeMs && (
                  <div className="text-sm text-muted-foreground">
                    Completed in {(exportProgress.processingTimeMs / 1000).toFixed(1)} seconds
                  </div>
                )}
              </div>
            </div>
          )}
          
          {exportProgress.status === 'failed' && (
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <div>
                <span className="font-medium">Export failed</span>
                <div className="text-sm">{exportProgress.error}</div>
              </div>
            </div>
          )}
          
          {exportProgress.status === 'cancelled' && (
            <div className="flex items-center gap-3 text-orange-600">
              <X className="h-5 w-5" />
              <span>Export cancelled by user</span>
            </div>
          )}
        </div>
      )}

      {/* Format Selection */}
      <div>
        <h4 className="font-medium mb-3">Export Format</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(EXPORT_FORMATS).map(([key, format]) => (
            <div
              key={format}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all
                ${exportOptions.format === format 
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
                }
              `}
              onClick={() => handleOptionChange('format', format)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {getFormatIcon(format)}
                </div>
                <div>
                  <h5 className="font-medium uppercase">{format}</h5>
                  <p className="text-sm text-muted-foreground">
                    {getFormatDescription(format)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filename */}
      <div>
        <h4 className="font-medium mb-3">Filename</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={exportOptions.filename}
            onChange={(e) => handleOptionChange('filename', e.target.value)}
            placeholder="Enter filename..."
            className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="px-3 py-2 bg-accent text-muted-foreground rounded-md">
            .{exportOptions.format}
          </div>
        </div>
      </div>

      {/* Content Options */}
      <div>
        <h4 className="font-medium mb-3">Content Options</h4>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={exportOptions.includeCharts}
              onChange={(e) => handleOptionChange('includeCharts', e.target.checked)}
              className="rounded border-border focus:ring-primary"
            />
            <div>
              <span className="font-medium">Include Charts</span>
              <p className="text-sm text-muted-foreground">
                Include visual charts and graphs in the export
              </p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={exportOptions.includeMetadata}
              onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
              className="rounded border-border focus:ring-primary"
            />
            <div>
              <span className="font-medium">Include Metadata</span>
              <p className="text-sm text-muted-foreground">
                Include generation date, user, and filter information
              </p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={exportOptions.includeRawData}
              onChange={(e) => handleOptionChange('includeRawData', e.target.checked)}
              className="rounded border-border focus:ring-primary"
            />
            <div>
              <span className="font-medium">Include Raw Data</span>
              <p className="text-sm text-muted-foreground">
                Include detailed raw validation data (increases file size)
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Format-specific Options */}
      {exportOptions.format === 'pdf' && (
        <div>
          <h4 className="font-medium mb-3">PDF Options</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Page Size</label>
              <select
                value={exportOptions.formatOptions.pageSize || 'a4'}
                onChange={(e) => handleFormatOptionChange('pageSize', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Orientation</label>
              <select
                value={exportOptions.formatOptions.orientation || 'portrait'}
                onChange={(e) => handleFormatOptionChange('orientation', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {exportOptions.format === 'excel' && (
        <div>
          <h4 className="font-medium mb-3">Excel Options</h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions.formatOptions.separateSheets || false}
                onChange={(e) => handleFormatOptionChange('separateSheets', e.target.checked)}
                className="rounded border-border focus:ring-primary"
              />
              <div>
                <span className="font-medium">Separate Sheets</span>
                <p className="text-sm text-muted-foreground">
                  Create separate sheets for different data sections
                </p>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions.formatOptions.includeFormulas || false}
                onChange={(e) => handleFormatOptionChange('includeFormulas', e.target.checked)}
                className="rounded border-border focus:ring-primary"
              />
              <div>
                <span className="font-medium">Include Formulas</span>
                <p className="text-sm text-muted-foreground">
                  Add Excel formulas for calculations
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Export Summary */}
      <div className="p-4 bg-accent/30 rounded-lg">
        <h4 className="font-medium mb-2">Export Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Records:</span>
            <span className="ml-2 font-medium">{report.recordCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Format:</span>
            <span className="ml-2 font-medium uppercase">{exportOptions.format}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Estimated Size:</span>
            <span className="ml-2 font-medium">{getEstimatedSize()}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Filename:</span>
            <span className="ml-2 font-medium">{exportOptions.filename}.{exportOptions.format}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          onClick={handleExport}
          disabled={
            isExporting || 
            !exportOptions.filename.trim() || 
            exportProgress?.status === 'completed' ||
            exportProgress?.status === 'preparing' ||
            exportProgress?.status === 'exporting'
          }
          className="flex items-center gap-2"
        >
          {(isExporting || exportProgress?.status === 'preparing' || exportProgress?.status === 'exporting') ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {exportProgress?.status === 'preparing' ? 'Preparing...' : 'Exporting...'}
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export Report
            </>
          )}
        </Button>
        
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ExportOptions;