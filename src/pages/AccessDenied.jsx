import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { selectUser } from '../redux/slices/authSlice.js';
import Button from '../components/ui/Button.jsx';

/**
 * AccessDenied Page Component
 * 
 * Displays access denied message when users don't have sufficient permissions
 * to access a particular route or resource.
 */
const AccessDenied = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white shadow-lg rounded-lg p-8 border border-gray-200 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>

          {/* Message */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              You don't have permission to access this resource.
            </p>
            
            {user && (
              <div className="bg-gray-50 rounded-md p-4 text-left">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Current User:</span> {user.firstname} {user.lastname}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Role:</span> {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-4">
              If you believe this is an error, please contact your system administrator.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleGoBack}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Invoice Validation System
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Contact your administrator for access requests
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;