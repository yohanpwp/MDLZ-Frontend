import React from 'react';

const Form = ({ children, onSubmit, className = '' }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(e);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      {children}
    </form>
  );
};

const FormField = ({ 
  label, 
  required = false, 
  error, 
  children, 
  className = '',
  description 
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
};

const FormInput = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error,
  className = '',
  ...props 
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`
        w-full border rounded-md px-3 py-2 text-sm
        focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? 'border-destructive' : 'border-border'}
        bg-background text-foreground placeholder:text-muted-foreground
        ${className}
      `}
      {...props}
    />
  );
};

const FormTextarea = ({ 
  placeholder, 
  value, 
  onChange, 
  error,
  rows = 3,
  className = '',
  ...props 
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className={`
        w-full border rounded-md px-3 py-2 text-sm resize-none
        focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? 'border-destructive' : 'border-border'}
        bg-background text-foreground placeholder:text-muted-foreground
        ${className}
      `}
      {...props}
    />
  );
};

const FormSelect = ({ 
  options = [], 
  value, 
  onChange, 
  error,
  placeholder = 'Select an option',
  className = '',
  ...props 
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`
        w-full border rounded-md px-3 py-2 text-sm
        focus:outline-none focus:ring-1 focus:ring-ring focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        ${error ? 'border-destructive' : 'border-border'}
        bg-background text-foreground
        ${className}
      `}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const FormCheckbox = ({ 
  label, 
  checked, 
  onChange, 
  error,
  className = '',
  ...props 
}) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className={`
          rounded border-border text-primary focus:ring-offset-0 focus:ring-ring
          ${error ? 'border-destructive' : ''}
        `}
        {...props}
      />
      <span className="text-sm font-medium text-foreground ml-2">{label}</span>
    </label>
  );
};

const FormActions = ({ children, className = '' }) => {
  return (
    <div className={`flex items-center justify-end gap-2 pt-4 border-t border-border ${className}`}>
      {children}
    </div>
  );
};

export {
  Form,
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormCheckbox,
  FormActions
};