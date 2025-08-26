import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '../redux/slices/authSlice.js';
import LoginForm from '../components/auth/LoginForm.jsx';

/**
 * Login Page Component
 * 
 * Provides the login page for the Invoice Validation System.
 * Redirects authenticated users to their intended destination.
 */
const Login = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLoginSuccess = (result) => {
    console.log('Login successful:', result.user.username);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Invoice Validation System v1.0
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Secure financial document validation and compliance
        </p>
      </div>
    </div>
  );
};

export default Login;