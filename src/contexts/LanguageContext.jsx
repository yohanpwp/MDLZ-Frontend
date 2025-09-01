import React, { createContext, useContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';

// Import translation files
import enTranslations from '../locales/en.json';
import thTranslations from '../locales/th.json';

// Available languages
export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false
  },
  th: {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    rtl: false
  }
};

// Translation resources
const translations = {
  en: enTranslations,
  th: thTranslations
};

// Default language
const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'preferred-language';

// Language context
const LanguageContext = createContext();

// Language reducer
const languageReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return {
        ...state,
        currentLanguage: action.payload,
        isLoading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
    default:
      return state;
  }
};

// Detect browser language
const detectBrowserLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  const browserLang = navigator.language || navigator.languages?.[0];
  if (!browserLang) return DEFAULT_LANGUAGE;
  
  // Extract language code (e.g., 'en-US' -> 'en')
  const langCode = browserLang.split('-')[0];
  
  // Check if we support this language
  return Object.keys(LANGUAGES).includes(langCode) ? langCode : DEFAULT_LANGUAGE;
};

// Get stored language preference
const getStoredLanguage = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read language preference from localStorage:', error);
    return null;
  }
};

// Store language preference
const storeLanguage = (language) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch (error) {
    console.warn('Failed to store language preference:', error);
  }
};

// Language provider component
export const LanguageProvider = ({ children }) => {
  const initialLanguage = getStoredLanguage() || detectBrowserLanguage();
  
  const [state, dispatch] = useReducer(languageReducer, {
    currentLanguage: initialLanguage,
    isLoading: false
  });

  // Set language
  const setLanguage = (language) => {
    if (!Object.keys(LANGUAGES).includes(language)) {
      console.warn(`Unsupported language: ${language}`);
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Store preference
    storeLanguage(language);
    
    // Update document language attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
    
    // Set language in state
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  };

  // Initialize language on mount
  useEffect(() => {
    setLanguage(state.currentLanguage);
  }, []);

  // Translation function
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[state.currentLanguage];
    
    // Navigate through nested keys
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to English if key not found
        value = translations[DEFAULT_LANGUAGE];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            console.warn(`Translation key not found: ${key}`);
            return key; // Return key as fallback
          }
        }
        break;
      }
    }
    
    // Handle string interpolation
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }
    
    return value || key;
  };

  // Get current language info
  const getCurrentLanguage = () => LANGUAGES[state.currentLanguage];

  // Check if language is RTL
  const isRTL = () => getCurrentLanguage()?.rtl || false;

  const value = {
    currentLanguage: state.currentLanguage,
    isLoading: state.isLoading,
    languages: LANGUAGES,
    setLanguage,
    t,
    getCurrentLanguage,
    isRTL
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

LanguageProvider.propTypes = {
  children: PropTypes.node.isRequired
};

// Custom hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};

export default LanguageContext;