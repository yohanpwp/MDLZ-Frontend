import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

const FormInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  showPasswordToggle = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const hasError = touched && error;
  const isValid = touched && !error && value;

  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(name);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  const getInputClasses = () => {
    let classes = 'w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
    
    if (hasError) {
      classes += ' border-red-300 focus:border-red-500 focus:ring-red-500';
    } else if (isValid) {
      classes += ' border-green-300 focus:border-green-500 focus:ring-green-500';
    } else {
      classes += ' border-gray-300 focus:border-blue-500 focus:ring-blue-500';
    }
    
    if (disabled) {
      classes += ' bg-gray-50 text-gray-500 cursor-not-allowed';
    } else {
      classes += ' bg-white text-gray-900';
    }
    
    return classes;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputClasses()}
          {...props}
        />
        
        {/* Password toggle button */}
        {type === 'password' && showPasswordToggle && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
        
        {/* Validation icons */}
        {!showPasswordToggle && (hasError || isValid) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {hasError ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}
      
      {/* Success message */}
      {isValid && !hasError && (
        <p className="text-sm text-green-600 flex items-center">
          <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
          Looks good!
        </p>
      )}
    </div>
  );
};

FormInput.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  touched: PropTypes.bool,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  className: PropTypes.string,
  showPasswordToggle: PropTypes.bool
};

export default FormInput;