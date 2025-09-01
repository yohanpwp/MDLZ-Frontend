import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  formatDate,
  formatTime,
  formatDateTime,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatRelativeTime,
  formatFileSize,
  formatDateForInput,
  parseDateFromInput
} from '../utils/formatters';

/**
 * Custom hook that provides formatting functions with current language context
 * @returns {Object} Formatting functions bound to current language
 */
export const useFormatters = () => {
  const { currentLanguage } = useLanguage();

  // Date formatting
  const formatDateLocalized = useCallback((date, options) => {
    return formatDate(date, currentLanguage, options);
  }, [currentLanguage]);

  const formatTimeLocalized = useCallback((date, options) => {
    return formatTime(date, currentLanguage, options);
  }, [currentLanguage]);

  const formatDateTimeLocalized = useCallback((date, options) => {
    return formatDateTime(date, currentLanguage, options);
  }, [currentLanguage]);

  const formatRelativeTimeLocalized = useCallback((date, options) => {
    return formatRelativeTime(date, currentLanguage, options);
  }, [currentLanguage]);

  // Number formatting
  const formatNumberLocalized = useCallback((number, options) => {
    return formatNumber(number, currentLanguage, options);
  }, [currentLanguage]);

  const formatCurrencyLocalized = useCallback((amount, currency, options) => {
    return formatCurrency(amount, currentLanguage, currency, options);
  }, [currentLanguage]);

  const formatPercentageLocalized = useCallback((value, options) => {
    return formatPercentage(value, currentLanguage, options);
  }, [currentLanguage]);

  // File size formatting
  const formatFileSizeLocalized = useCallback((bytes, decimals) => {
    return formatFileSize(bytes, currentLanguage, decimals);
  }, [currentLanguage]);

  // Commonly used date formats
  const formatShortDate = useCallback((date) => {
    return formatDate(date, currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [currentLanguage]);

  const formatLongDate = useCallback((date) => {
    return formatDate(date, currentLanguage, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  }, [currentLanguage]);

  const formatShortDateTime = useCallback((date) => {
    return formatDateTime(date, currentLanguage, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [currentLanguage]);

  // Commonly used number formats
  const formatInteger = useCallback((number) => {
    return formatNumber(number, currentLanguage, {
      maximumFractionDigits: 0
    });
  }, [currentLanguage]);

  const formatDecimal = useCallback((number, decimals = 2) => {
    return formatNumber(number, currentLanguage, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, [currentLanguage]);

  const formatCompactNumber = useCallback((number) => {
    return formatNumber(number, currentLanguage, {
      notation: 'compact',
      compactDisplay: 'short'
    });
  }, [currentLanguage]);

  // Currency formatting with common options
  const formatPrice = useCallback((amount, currency) => {
    return formatCurrency(amount, currentLanguage, currency, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, [currentLanguage]);

  const formatCompactCurrency = useCallback((amount, currency) => {
    return formatCurrency(amount, currentLanguage, currency, {
      notation: 'compact',
      compactDisplay: 'short'
    });
  }, [currentLanguage]);

  return {
    // Basic formatters
    formatDate: formatDateLocalized,
    formatTime: formatTimeLocalized,
    formatDateTime: formatDateTimeLocalized,
    formatRelativeTime: formatRelativeTimeLocalized,
    formatNumber: formatNumberLocalized,
    formatCurrency: formatCurrencyLocalized,
    formatPercentage: formatPercentageLocalized,
    formatFileSize: formatFileSizeLocalized,
    
    // Date input helpers
    formatDateForInput,
    parseDateFromInput,
    
    // Convenience formatters
    formatShortDate,
    formatLongDate,
    formatShortDateTime,
    formatInteger,
    formatDecimal,
    formatCompactNumber,
    formatPrice,
    formatCompactCurrency,
    
    // Current language
    currentLanguage
  };
};