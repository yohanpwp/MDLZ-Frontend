import { useAuthGuard, useTokenExpirationMonitor } from '../../hooks/useAuthGuard';
import SessionExpirationWarning from './SessionExpirationWarning';

/**
 * AuthGuard Component
 * 
 * Global authentication guard that monitors token expiration
 * and handles automatic redirects. Should be placed at the app root level.
 */
const AuthGuard = ({ children }) => {
  // Initialize auth monitoring
  useAuthGuard();
  useTokenExpirationMonitor();

  return (
    <>
      <SessionExpirationWarning />
      {children}
    </>
  );
};

export default AuthGuard;