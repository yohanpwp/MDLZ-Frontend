import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const UploadProgress = ({ 
  status, 
  progress = 0, 
  fileName, 
  error = null,
  recordsProcessed = 0,
  totalRecords = 0 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return totalRecords > 0 
          ? `Processing records (${recordsProcessed}/${totalRecords})`
          : 'Processing file...';
      case 'completed':
        return `Successfully processed ${totalRecords} records`;
      case 'error':
        return 'Upload failed';
      default:
        return 'Ready to upload';
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3 mb-3">
        {getStatusIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {fileName}
          </p>
          <p className="text-sm text-gray-500">
            {getStatusText()}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Success Details */}
      {status === 'completed' && totalRecords > 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            File processed successfully with {totalRecords} records
          </p>
        </div>
      )}
    </div>
  );
};

UploadProgress.propTypes = {
  status: PropTypes.oneOf(['idle', 'uploading', 'processing', 'completed', 'error']).isRequired,
  progress: PropTypes.number,
  fileName: PropTypes.string,
  error: PropTypes.string,
  recordsProcessed: PropTypes.number,
  totalRecords: PropTypes.number
};

export default UploadProgress;