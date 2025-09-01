import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Upload, FileText, X } from 'lucide-react';
import { FileValidator, FileValidationError } from '../../utils/FileValidator';
import UploadProgress from './UploadProgress';

const FileUploader = ({ 
  onFileSelect, 
  onFileRemove, 
  disabled = false,
  multiple = false,
  className = '' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = [];
    let validationError = null;

    // Validate each file
    for (const file of fileArray) {
      try {
        const validationResult = FileValidator.validateFile(file);
        validFiles.push({
          file,
          ...validationResult,
          id: `${file.name}-${Date.now()}-${Math.random()}`
        });
      } catch (err) {
        if (err instanceof FileValidationError) {
          validationError = err.message;
          break;
        }
      }
    }

    if (validationError) {
      setError(validationError);
      setUploadStatus('error');
      return;
    }

    // Clear any previous errors
    setError(null);
    
    if (multiple) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    } else {
      setSelectedFiles(validFiles);
    }

    // Notify parent component
    if (onFileSelect) {
      validFiles.forEach(fileData => {
        onFileSelect(fileData);
      });
    }

    // Simulate upload progress
    setUploadStatus('uploading');
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setUploadStatus('completed');
          return 100;
        }
        return prev + 10;
      });
    }, 200);

  }, [onFileSelect, multiple]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  const handleFileInputChange = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const handleRemoveFile = useCallback((fileId) => {
    setSelectedFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId);
      const removedFile = prev.find(f => f.id === fileId);
      
      if (removedFile && onFileRemove) {
        onFileRemove(removedFile);
      }
      
      // Reset status if no files left
      if (updatedFiles.length === 0) {
        setUploadStatus('idle');
        setUploadProgress(0);
        setError(null);
      }
      
      return updatedFiles;
    });
  }, [onFileRemove]);

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const allowedExtensions = FileValidator.getAllowedExtensions();
  const maxFileSize = FileValidator.formatFileSize(FileValidator.getMaxFileSize());

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* File Drop Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedExtensions.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        
        <h3 className="text-lg font-medium mb-2">
          {dragActive ? 'Drop files here' : 'Upload your files'}
        </h3>
        
        <p className="text-sm mb-4 text-muted-foreground">
          Drag and drop your files here, or click to browse
        </p>
        
        <div className="text-xs text-gray-500">
          <p>Supported formats: {allowedExtensions.join(', ')}</p>
          <p>Maximum file size: {maxFileSize}</p>
        </div>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Selected Files ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((fileData) => (
              <div
                key={fileData.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fileData.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {fileData.formattedSize} • {fileData.fileType.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(fileData.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <UploadProgress
            status={uploadStatus}
            progress={uploadProgress}
            fileName={selectedFiles[0]?.fileName}
            error={error}
            totalRecords={0} // Will be updated when file processing is implemented
          />
        </div>
      )}
    </div>
  );
};

FileUploader.propTypes = {
  onFileSelect: PropTypes.func,
  onFileRemove: PropTypes.func,
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  className: PropTypes.string
};

export default FileUploader;