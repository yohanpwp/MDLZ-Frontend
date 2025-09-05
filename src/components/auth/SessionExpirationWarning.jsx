import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import { logoutUser } from '../../redux/slices/authSlice';
import AuthService from '../../services/AuthService';
import Button from '../ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * Session Expiration Warning Component
 * 
 * Shows a warning when the user's session is about to expire
 * and provides options to extend or logout
 */
const SessionExpirationWarning = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      return;
    }

    const checkExpiration = () => {
      const timeUntilExpiry = AuthService.getTimeUntilExpiry();
      const minutes = Math.floor(timeUntilExpiry / (1000 * 60));
      
      setTimeRemaining(minutes);

      // Show warning if less than 5 minutes remaining
      if (timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }

      // Auto-logout if expired
      if (timeUntilExpiry <= 0) {
        setShowWarning(false);
      }
    };

    // Check immediately
    checkExpiration();

    // Check every 30 seconds
    const interval = setInterval(checkExpiration, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleExtendSession = async () => {
    // In a real app, this would call an API to refresh the token
    // For now, we'll just hide the warning
    setShowWarning(false);
    
    // You could implement token refresh logic here
    console.log('Extending session...');
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    setShowWarning(false);
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <p className="mt-1 text-sm text-yellow-700">
              Your session will expire in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}. 
              Would you like to extend your session?
            </p>
            <div className="mt-3 flex space-x-2">
              <Button
                size="sm"
                onClick={handleExtendSession}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Extend Session
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleLogout}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Logout
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-yellow-700 hover:bg-yellow-100"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpirationWarning;