import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for form validation with real-time feedback
 */
export const useFormValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validation functions
  const validateField = useCallback(async (fieldName, value) => {
    const rules = validationRules[fieldName];
    if (!rules) return null;

    for (const rule of rules) {
      const error = await rule(value, values);
      if (error) return error;
    }
    return null;
  }, [validationRules, values]);

  const validateForm = useCallback(async () => {
    setIsValidating(true);
    const newErrors = {};
    
    for (const fieldName of Object.keys(validationRules)) {
      const error = await validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
      }
    }
    
    setErrors(newErrors);
    setIsValidating(false);
    
    const formIsValid = Object.keys(newErrors).length === 0;
    setIsValid(formIsValid);
    
    return formIsValid;
  }, [validateField, validationRules, values]);

  // Handle field changes
  const handleChange = useCallback(async (fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Real-time validation for touched fields
    if (touched[fieldName]) {
      const error = await validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  }, [validateField, touched]);

  // Handle field blur (mark as touched)
  const handleBlur = useCallback(async (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate on blur
    const error = await validateField(fieldName, values[fieldName]);
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, [validateField, values]);

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, [initialValues]);

  // Set field error manually
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  // Clear field error
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Update form validity when errors change
  useEffect(() => {
    const hasErrors = Object.values(errors).some(error => error !== null && error !== undefined);
    const hasValues = Object.keys(values).length > 0;
    setIsValid(hasValues && !hasErrors);
  }, [errors, values]);

  return {
    values,
    errors,
    touched,
    isValidating,
    isValid,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    setFieldError,
    clearFieldError,
    setValues
  };
};

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required') => (value) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return message;
    }
    return null;
  },

  email: (message = 'Please enter a valid email address') => (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
  },

  minLength: (min, message) => (value) => {
    if (!value) return null;
    const msg = message || `Must be at least ${min} characters`;
    return value.length >= min ? null : msg;
  },

  maxLength: (max, message) => (value) => {
    if (!value) return null;
    const msg = message || `Must be no more than ${max} characters`;
    return value.length <= max ? null : msg;
  },

  pattern: (regex, message = 'Invalid format') => (value) => {
    if (!value) return null;
    return regex.test(value) ? null : message;
  },

  number: (message = 'Must be a valid number') => (value) => {
    if (!value) return null;
    return !isNaN(value) && !isNaN(parseFloat(value)) ? null : message;
  },

  min: (min, message) => (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    const msg = message || `Must be at least ${min}`;
    return num >= min ? null : msg;
  },

  max: (max, message) => (value) => {
    if (!value) return null;
    const num = parseFloat(value);
    const msg = message || `Must be no more than ${max}`;
    return num <= max ? null : msg;
  },

  fileSize: (maxSizeInMB, message) => (file) => {
    if (!file) return null;
    const msg = message || `File size must be less than ${maxSizeInMB}MB`;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes ? null : msg;
  },

  fileType: (allowedTypes, message) => (file) => {
    if (!file) return null;
    const msg = message || `File type must be one of: ${allowedTypes.join(', ')}`;
    return allowedTypes.includes(file.type) ? null : msg;
  },

  custom: (validatorFn, message = 'Invalid value') => async (value, allValues) => {
    try {
      const isValid = await validatorFn(value, allValues);
      return isValid ? null : message;
    } catch (error) {
      return message;
    }
  }
};