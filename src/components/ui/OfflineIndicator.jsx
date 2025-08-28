import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Wifi, WifiOff, Cloud, CloudOff, Sync } from 'lucide-react';

const OfflineIndicator = ({ 
  showWhenOnline = false, 
  pendingSync = 0,
  onSync,
  className = '' 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't show when online unless explicitly requested
  if (isOnline && !showWhenOnline && !showNotification && pendingSync === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (pendingSync > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (pendingSync > 0) return `${pendingSync} pending`;
    return 'Online';
  };

  const getIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (pendingSync > 0) return <CloudOff className="h-4 w-4" />;
    return <Wifi className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status indicator */}
      <div className="flex items-center space-x-2 px-2 py-1 rounded-full bg-white shadow-sm border">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        {getIcon()}
        <span className="text-xs font-medium text-gray-700">
          {getStatusText()}
        </span>
      </div>

      {/* Sync button when there are pending operations */}
      {isOnline && pendingSync > 0 && onSync && (
        <button
          onClick={onSync}
          className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <Sync className="h-3 w-3" />
          <span>Sync</span>
        </button>
      )}

      {/* Notification toast */}
      {showNotification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg transition-all duration-300 ${
          isOnline 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Cloud className="h-4 w-4" />
            ) : (
              <CloudOff className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? 'Back online' : 'You are offline'}
            </span>
          </div>
          {!isOnline && (
            <p className="text-xs mt-1 opacity-90">
              Changes will be saved locally and synced when connection is restored.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

OfflineIndicator.propTypes = {
  showWhenOnline: PropTypes.bool,
  pendingSync: PropTypes.number,
  onSync: PropTypes.func,
  className: PropTypes.string
};

export default OfflineIndicator;