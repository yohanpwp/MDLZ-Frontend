/**
 * Formatting utilities for internationalization
 * Handles date, time, number, and currency formatting based on locale
 */

// Locale mappings for Intl API
const LOCALE_MAPPINGS = {
  en: 'en-US',
  th: 'th-TH'
};

// Currency mappings
const CURRENCY_MAPPINGS = {
  en: 'USD',
  th: 'THB'
};

/**
 * Get locale string for Intl API
 * @param {string} language - Language code
 * @returns {string} Locale string
 */
const getLocale = (language) => {
  return LOCALE_MAPPINGS[language] || LOCALE_MAPPINGS.en;
};

/**
 * Get currency code for language
 * @param {string} language - Language code
 * @returns {string} Currency code
 */
const getCurrency = (language) => {
  return CURRENCY_MAPPINGS[language] || CURRENCY_MAPPINGS.en;
};

/**
 * Format date based on language
 * @param {Date|string|number} date - Date to format
 * @param {string} language - Language code
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, language = 'en', options = {}) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const locale = getLocale(language);
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  try {
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateObj.toLocaleDateString();
  }
};

/**
 * Format time based on language
 * @param {Date|string|number} date - Date to format
 * @param {string} language - Language code
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted time
 */
export const formatTime = (date, language = 'en', options = {}) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const locale = getLocale(language);
  const defaultOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.warn('Time formatting error:', error);
    return dateObj.toLocaleTimeString();
  }
};

/**
 * Format date and time based on language
 * @param {Date|string|number} date - Date to format
 * @param {string} language - Language code
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date and time
 */
export const formatDateTime = (date, language = 'en', options = {}) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const locale = getLocale(language);
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
  } catch (error) {
    console.warn('DateTime formatting error:', error);
    return dateObj.toLocaleString();
  }
};

/**
 * Format number based on language
 * @param {number} number - Number to format
 * @param {string} language - Language code
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted number
 */
export const formatNumber = (number, language = 'en', options = {}) => {
  if (number === null || number === undefined || isNaN(number)) return '';
  
  const locale = getLocale(language);
  
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    console.warn('Number formatting error:', error);
    return number.toString();
  }
};

/**
 * Format currency based on language
 * @param {number} amount - Amount to format
 * @param {string} language - Language code
 * @param {string} currency - Currency code (optional, defaults to language currency)
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, language = 'en', currency = null, options = {}) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  
  const locale = getLocale(language);
  const currencyCode = currency || getCurrency(language);
  
  const defaultOptions = {
    style: 'currency',
    currency: currencyCode
  };
  
  try {
    return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(amount);
  } catch (error) {
    console.warn('Currency formatting error:', error);
    return `${currencyCode} ${amount}`;
  }
};

/**
 * Format percentage based on language
 * @param {number} value - Value to format (0.1 = 10%)
 * @param {string} language - Language code
 * @param {Object} options - Intl.NumberFormat options
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, language = 'en', options = {}) => {
  if (value === null || value === undefined || isNaN(value)) return '';
  
  const locale = getLocale(language);
  const defaultOptions = {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  };
  
  try {
    return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value);
  } catch (error) {
    console.warn('Percentage formatting error:', error);
    return `${(value * 100).toFixed(2)}%`;
  }
};

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string|number} date - Date to format
 * @param {string} language - Language code
 * @param {Object} options - Intl.RelativeTimeFormat options
 * @returns {string} Formatted relative time
 */
export const formatRelativeTime = (date, language = 'en', options = {}) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const locale = getLocale(language);
  const now = new Date();
  const diffInSeconds = Math.floor((dateObj.getTime() - now.getTime()) / 1000);
  
  const defaultOptions = {
    numeric: 'auto'
  };
  
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { ...defaultOptions, ...options });
    
    // Determine the appropriate unit and value
    const absDiff = Math.abs(diffInSeconds);
    
    if (absDiff < 60) {
      return rtf.format(diffInSeconds, 'second');
    } else if (absDiff < 3600) {
      return rtf.format(Math.floor(diffInSeconds / 60), 'minute');
    } else if (absDiff < 86400) {
      return rtf.format(Math.floor(diffInSeconds / 3600), 'hour');
    } else if (absDiff < 2592000) {
      return rtf.format(Math.floor(diffInSeconds / 86400), 'day');
    } else if (absDiff < 31536000) {
      return rtf.format(Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(Math.floor(diffInSeconds / 31536000), 'year');
    }
  } catch (error) {
    console.warn('Relative time formatting error:', error);
    return formatDate(date, language);
  }
};

/**
 * Format file size based on language
 * @param {number} bytes - File size in bytes
 * @param {string} language - Language code
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, language = 'en', decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes || isNaN(bytes)) return '';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  
  return `${formatNumber(value, language)} ${sizes[i]}`;
};

/**
 * Get date input format for HTML input[type="date"] based on language
 * @param {Date|string|number} date - Date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toISOString().split('T')[0];
};

/**
 * Parse date from HTML input[type="date"] format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDateFromInput = (dateString) => {
  if (!dateString) return null;
  
  const date = new Date(dateString + 'T00:00:00');
  return isNaN(date.getTime()) ? null : date;
};