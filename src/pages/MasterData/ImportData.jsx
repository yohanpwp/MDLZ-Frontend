import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Upload, 
  FileText, 
  Database, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  RotateCcw,
  X,
  Clock,
  AlertTriangle,
  Download
} from 'lucide-react';
import Button from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import DataTable from '../../components/ui/DataTable';
import FileUploader from '../../components/file-upload/FileUploader';
import {
  importMasterData,
  validateImportFile,
  rollbackImport,
  setSelectedDataType,
  setShowPreview,
  setShowRollbackConfirm,
  clearValidationResult,
  clearError,
  loadImportHistory,
  resetImportState,
  selectIsImporting,
  selectIsValidating,
  selectImportProgress,
  selectValidationResult,
  selectPreviewData,
  selectShowPreview,
  selectImportHistory,
  selectSelectedDataType,
  selectError,
  selectValidationErrors,
  selectImportErrors,
  selectCurrentImport,
  selectShowRollbackConfirm,
  selectRollbackImportId
} from '../../redux/slices/masterDataSlice';

const ImportData = () => {
  const dispatch = useDispatch();
  const [selectedFile, setSelectedFile] = useState(null);
  const [importOptions, setImportOptions] = useState({
    replaceExisting: false,
    skipDuplicates: true,
    validateData: true
  });

  // Redux state
  const isImporting = useSelector(selectIsImporting);
  const isValidating = useSelector(selectIsValidating);
  const importProgress = useSelector(selectImportProgress);
  const validationResult = useSelector(selectValidationResult);
  const previewData = useSelector(selectPreviewData);
  const showPreview = useSelector(selectShowPreview);
  const importHistory = useSelector(selectImportHistory);
  const selectedDataType = useSelector(selectSelectedDataType);
  const error = useSelector(selectError);
  const validationErrors = useSelector(selectValidationErrors);
  const importErrors = useSelector(selectImportErrors);
  const currentImport = useSelector(selectCurrentImport);
  const showRollbackConfirm = useSelector(selectShowRollbackConfirm);
  const rollbackImportId = useSelector(selectRollbackImportId);

  // Load import history on component mount
  useEffect(() => {
    dispatch(loadImportHistory());
  }, [dispatch]);

  // Data type configurations
  const dataTypeConfigs = {
    customers: {
      title: 'Customer Data',
      description: 'Import customer information, contact details, and billing preferences',
      icon: Database,
      requiredFields: ['customerCode', 'customerName', 'email'],
      sampleData: 'customerCode,customerName,email,phone,address\nCUST001,ABC Corp,contact@abc.com,555-0123,123 Main St'
    },
    products: {
      title: 'Product Catalog',
      description: 'Import product information, pricing, and validation rules',
      icon: FileText,
      requiredFields: ['productCode', 'productName', 'unitPrice'],
      sampleData: 'productCode,productName,unitPrice,category,taxRate\nPROD001,Widget A,29.99,Electronics,10'
    },
    references: {
      title: 'Reference Data',
      description: 'Import tax rates, currencies, and other reference information',
      icon: Upload,
      requiredFields: ['referenceType', 'referenceCode', 'referenceValue'],
      sampleData: 'referenceType,referenceCode,referenceValue,description\nTAX_RATE,VAT_STANDARD,20,Standard VAT Rate'
    }
  };

  const handleDataTypeSelect = (dataType) => {
    dispatch(setSelectedDataType(dataType));
    setSelectedFile(null);
    dispatch(clearValidationResult());
    dispatch(clearError());
  };

  const handleDownloadTemplate = () => {
    if (!selectedDataType) return;

    const config = dataTypeConfigs[selectedDataType];
    const csvContent = config.sampleData;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    // TODO : Change this into selected template from server later
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `${selectedDataType}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleFileSelect = (fileData) => {
    setSelectedFile(fileData);
    dispatch(clearValidationResult());
    dispatch(clearError());
    
    // Auto-validate file
    dispatch(validateImportFile({ 
      file: fileData.file, 
      dataType: selectedDataType 
    }));
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    dispatch(clearValidationResult());
    dispatch(setShowPreview(false));
  };

  const handleImportConfirm = () => {
    if (!selectedFile || !validationResult?.isValid) return;

    dispatch(importMasterData({
      file: selectedFile.file,
      dataType: selectedDataType,
      options: importOptions
    }));
  };

  const handleRollback = (importId) => {
    dispatch(setShowRollbackConfirm({ show: true, importId }));
  };

  const handleRollbackConfirm = () => {
    if (rollbackImportId) {
      dispatch(rollbackImport(rollbackImportId));
    }
  };

  const handleRollbackCancel = () => {
    dispatch(setShowRollbackConfirm({ show: false }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'completed_with_errors':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'rolled_back':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
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
        <h1 className="text-3xl font-bold text-foreground">Import Data</h1>
        <p className="text-muted-foreground">
          Import master data including customers, products, and reference information
        </p>
      </div>

      {/* Error display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Import Error</h4>
            <p className="text-sm">{error}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => dispatch(clearError())}
            className="ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Validation Errors</h4>
            <ul className="text-sm mt-2 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </Alert>
      )}

      {/* Import errors */}
      {importErrors.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Import Completed with Errors</h4>
            <p className="text-sm">Some records could not be imported:</p>
            <ul className="text-sm mt-2 space-y-1 max-h-32 overflow-y-auto">
              {importErrors.slice(0, 10).map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
              {importErrors.length > 10 && (
                <li>• ... and {importErrors.length - 10} more errors</li>
              )}
            </ul>
          </div>
        </Alert>
      )}

      {/* Data type selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(dataTypeConfigs).map(([dataType, config]) => {
          const Icon = config.icon;
          const isSelected = selectedDataType === dataType;
          
          return (
            <div 
              key={dataType}
              className={`bg-card border rounded-lg p-6 cursor-pointer transition-colors ${
                isSelected 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleDataTypeSelect(dataType)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{config.title}</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                {config.description}
              </p>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">Required fields:</p>
                <p>{config.requiredFields.join(', ')}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* File upload section */}
      {selectedDataType && (
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            Upload {dataTypeConfigs[selectedDataType].title}
          </h3>
          
          <FileUploader
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            disabled={isImporting || isValidating}
            className="mb-4"
          />
          <div className="text-sm text-muted-foreground text-center">
            Need a starting point?{' '}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={handleDownloadTemplate}>
              Download the template file.
            </Button>
          </div>

          {/* Import options */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">Import Options</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importOptions.replaceExisting}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      replaceExisting: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Replace existing data</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importOptions.skipDuplicates}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      skipDuplicates: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Skip duplicate records</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={importOptions.validateData}
                    onChange={(e) => setImportOptions(prev => ({
                      ...prev,
                      validateData: e.target.checked
                    }))}
                    className="rounded"
                  />
                  <span className="text-sm">Validate data before import</span>
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation progress */}
      {isValidating && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3">
            <LoadingSpinner size="sm" />
            <span>Validating file...</span>
          </div>
        </div>
      )}

      {/* Data preview */}
      {showPreview && previewData && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Data Preview</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => dispatch(setShowPreview(false))}
              >
                <Eye className="h-4 w-4 mr-2" />
                Hide Preview
              </Button>
              <Button
                onClick={handleImportConfirm}
                disabled={!validationResult?.isValid || isImporting}
              >
                {isImporting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Confirm Import
                  </>
                )}
              </Button>
            </div>
          </div>

          {validationResult && (
            <div className="mb-4">
              <Alert variant={validationResult.isValid ? "default" : "destructive"}>
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <div>
                  <p className="font-medium">
                    {validationResult.isValid 
                      ? `File validated successfully - ${validationResult.recordCount} records found`
                      : 'File validation failed'
                    }
                  </p>
                  {validationResult.warnings?.length > 0 && (
                    <ul className="text-sm mt-2">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </Alert>
            </div>
          )}

          <DataTable
            data={previewData}
            maxHeight="300px"
          />
        </div>
      )}

      {/* Import progress */}
      {isImporting && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Importing Data</h3>
              <span className="text-sm text-muted-foreground">
                {importProgress.progress}%
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${importProgress.progress}%` }}
              />
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{importProgress.message}</span>
            </div>
          </div>
        </div>
      )}

      {/* Import history */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Import History</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(loadImportHistory())}
          >
            Refresh
          </Button>
        </div>
        
        <div className="space-y-3">
          {importHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No imports found. Start by importing your first data file.
            </p>
          ) : (
            importHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium capitalize">{item.dataType}</p>
                  <p className="text-sm text-muted-foreground">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.startTime).toLocaleString()}
                    {item.duration && ` • ${formatDuration(item.duration)}`}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.recordCount > 0 ? `${item.recordCount} records` : 'No records'}
                      {item.errorCount > 0 && ` • ${item.errorCount} errors`}
                    </p>
                  </div>
                  {item.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRollback(item.id)}
                      title="Rollback import"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rollback confirmation dialog */}
      {showRollbackConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Rollback</h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to rollback this import? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleRollbackCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRollbackConfirm}>
                Rollback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportData;