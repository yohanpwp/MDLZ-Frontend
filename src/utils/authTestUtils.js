/**
 * Authentication Test Utilities
 * 
 * Utilities for testing authentication flows and token expiration
 */

/**
 * Simulate token expiration for testing
 * This function modifies the stored auth data to make the token appear expired
 */
export const simulateTokenExpiration = () => {
  const storageKey = 'invoice_validation_auth';
  const authData = localStorage.getItem(storageKey);
  
  if (authData) {
    try {
      const data = JSON.parse(authData);
      // Set expiration to 1 second ago
      data.expiresIn = Date.now() - 1000;
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('Token expiration simulated - token should expire immediately');
    } catch (error) {
      console.error('Error simulating token expiration:', error);
    }
  } else {
    console.log('No auth data found to expire');
  }
};

/**
 * Simulate token expiring soon (in 2 minutes) for testing warning
 */
export const simulateTokenExpiringSoon = () => {
  const storageKey = 'invoice_validation_auth';
  const authData = localStorage.getItem(storageKey);
  
  if (authData) {
    try {
      const data = JSON.parse(authData);
      // Set expiration to 2 minutes from now
      data.expiresIn = Date.now() + (2 * 60 * 1000);
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('Token set to expire in 2 minutes - warning should appear');
    } catch (error) {
      console.error('Error simulating token expiring soon:', error);
    }
  } else {
    console.log('No auth data found to modify');
  }
};

/**
 * Reset token to normal expiration time
 */
export const resetTokenExpiration = () => {
  const storageKey = 'invoice_validation_auth';
  const authData = localStorage.getItem(storageKey);
  
  if (authData) {
    try {
      const data = JSON.parse(authData);
      // Set expiration to 20 minutes from now (normal)
      data.expiresIn = Date.now() + (20 * 60 * 1000);
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('Token expiration reset to normal (20 minutes)');
    } catch (error) {
      console.error('Error resetting token expiration:', error);
    }
  } else {
    console.log('No auth data found to reset');
  }
};

/**
 * Get current token expiration info for debugging
 */
export const getTokenExpirationInfo = () => {
  const storageKey = 'invoice_validation_auth';
  const authData = localStorage.getItem(storageKey);
  
  if (authData) {
    try {
      const data = JSON.parse(authData);
      const now = Date.now();
      const expiresIn = data.expiresIn;
      const timeUntilExpiry = expiresIn - now;
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60));
      
      return {
        expiresAt: new Date(expiresIn).toLocaleString(),
        timeUntilExpiry: timeUntilExpiry,
        minutesUntilExpiry: minutesUntilExpiry,
        isExpired: timeUntilExpiry <= 0,
        willExpireSoon: timeUntilExpiry > 0 && timeUntilExpiry < 5 * 60 * 1000
      };
    } catch (error) {
      console.error('Error getting token expiration info:', error);
      return null;
    }
  } else {
    return null;
  }
};

// Make functions available globally for testing in browser console
if (typeof window !== 'undefined') {
  window.authTestUtils = {
    simulateTokenExpiration,
    simulateTokenExpiringSoon,
    resetTokenExpiration,
    getTokenExpirationInfo
  };
}