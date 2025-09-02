import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from '../redux/slices/authSlice.js';
import { useLanguage } from '../contexts/LanguageContext';
import LoginForm from '../components/auth/LoginForm.jsx';
import ThemeToggle from '../components/ui/ThemeToggle';
import LanguageSwitcher from '../components/ui/LanguageSwitcher';
import { Shield, FileText } from 'lucide-react';

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
  const { t } = useLanguage();

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10 flex flex-col">
      {/* Header with theme and language controls */}
      <header className="absolute top-0 right-0 p-6 flex items-center gap-3 z-10">
        <ThemeToggle variant="ghost" showLabel={false} />
        <LanguageSwitcher variant="ghost" size="sm" />
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and title section */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary/10 mb-6">
              <div className="relative">
                <FileText className="h-8 w-8 text-primary" />
                <Shield className="h-4 w-4 text-primary absolute -top-1 -right-1" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('invoice.title') || 'Invoice Validation System'}
            </h1>
            
            <p className="text-muted-foreground">
              {t('auth.login') || 'Sign in to your account'}
            </p>
          </div>

          {/* Login form */}
          <div className="bg-card border border-border rounded-lg shadow-lg p-8">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>

          {/* Features highlight */}
          <div className="text-center space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Secure Authentication</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span>Document Validation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="p-6 text-center border-t border-border bg-card/50">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Invoice Validation System v1.0
          </p>
          <p className="text-xs text-muted-foreground">
            Secure financial document validation and compliance
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Login;