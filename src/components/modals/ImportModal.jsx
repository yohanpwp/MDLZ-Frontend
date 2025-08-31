import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Form, FormField, FormActions } from '../ui/Form';
import { Alert, AlertDescription } from '../ui/Alert';

const ImportModal = ({ 
  isOpen, 
  onClose, 
  onImport, 
  dataType = 'data',
  acceptedFormats = ['.csv'],
  requiredColumns = [],
  optionalColumns = [],
  isLoading = false,
  error = null
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      onImport(selectedFile);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setDragActive(false);
    onClose();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Import ${dataType.charAt(0).toUpperCase() + dataType.slice(1)}`}
      size="md"
    >
      <div className="p-6">
        <Form>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FormField label="Select File">
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-colors
                ${dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50'
                }
                ${selectedFile ? 'bg-muted/30' : ''}
              `}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-12 w-12 text-primary mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Remove File
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-foreground font-medium">
                      Drop your file here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supported formats: {acceptedFormats.join(', ')}
                    </p>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </FormField>

          {(requiredColumns.length > 0 || optionalColumns.length > 0) && (
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-foreground">File Format Requirements</h4>
              
              {requiredColumns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Required columns:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {requiredColumns.join(', ')}
                  </p>
                </div>
              )}
              
              {optionalColumns.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Optional columns:
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {optionalColumns.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}

          <FormActions>
            <Button 
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!selectedFile || isLoading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? 'Importing...' : 'Import'}
            </Button>
          </FormActions>
        </Form>
      </div>
    </Modal>
  );
};

export default ImportModal;