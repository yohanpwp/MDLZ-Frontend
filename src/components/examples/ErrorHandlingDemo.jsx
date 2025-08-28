import React, { useState } from 'react';
import Button from '../ui/Button';
import ErrorMessage from '../error/ErrorMessage';
import LoadingState from '../ui/LoadingState';
import ProgressIndicator from '../ui/ProgressIndicator';
import FormInput from '../ui/FormInput';
import { useErrorHandler, useAsyncOperation } from '../../hooks/useErrorHandler';
import { useFormValidation, validationRules } from '../../hooks/useFormValidation';

const ErrorHandlingDemo = () => {
  const [demoType, setDemoType] = useState('');
  const { error, handleError, clearError, retry } = useErrorHandler();
  const { isLoading, execute } = useAsyncOperation();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Form validation demo
  const formValidation = useFormValidation(
    { email: '', password: '', confirmPassword: '' },
    {
      email: [
        validationRules.required('Email is required'),
        validationRules.email()
      ],
      password: [
        validationRules.required('Password is required'),
        validationRules.minLength(8, 'Password must be at least 8 characters')
      ],
      confirmPassword: [
        validationRules.required('Please confirm your password'),
        validationRules.custom(
          (value, allValues) => value === allValues.password,
          'Passwords do not match'
        )
      ]
    }
  );

  const steps = [
    { label: 'Initialize', description: 'Setting up the process' },
    { label: 'Validate', description: 'Checking data integrity' },
    { label: 'Process', description: 'Processing the data' },
    { label: 'Complete', description: 'Finalizing the operation' }
  ];

  // Simulate different types of errors
  const simulateError = async (type) => {
    setDemoType(type);
    
    try {
      await execute(async () => {
        // Simulate loading
        for (let i = 0; i <= 100; i += 10) {
          setProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Simulate different error types
        switch (type) {
          case 'network':
            throw new Error('Failed to fetch data from server');
          case 'validation':
            throw new Error('Invalid data format detected');
          case 'permission':
            const permError = new Error('Access denied');
            permError.status = 403;
            throw permError;
          case 'server':
            const serverError = new Error('Internal server error');
            serverError.status = 500;
            throw serverError;
          case 'file':
            throw new Error('Unsupported file format');
          default:
            throw new Error('Something went wrong');
        }
      }, { operation: type });
    } catch (err) {
      // Error is handled by useAsyncOperation
    }
  };

  // Simulate successful operation with progress
  const simulateSuccess = async () => {
    setDemoType('success');
    clearError();
    
    try {
      await execute(async () => {
        for (let step = 0; step < steps.length; step++) {
          setCurrentStep(step);
          
          // Simulate work for each step
          for (let i = 0; i <= 100; i += 20) {
            setProgress((step * 100 + i) / steps.length);
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        setCurrentStep(steps.length);
        setProgress(100);
      }, { operation: 'success' });
    } catch (err) {
      // Error handling
    }
  };

  const handleRetry = () => {
    retry(() => simulateError(demoType));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Error Handling & UX Enhancement Demo
        </h2>

        {/* Error Simulation Buttons */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Error Simulation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button 
              onClick={() => simulateError('network')}
              variant="outline"
              disabled={isLoading}
            >
              Network Error
            </Button>
            <Button 
              onClick={() => simulateError('validation')}
              variant="outline"
              disabled={isLoading}
            >
              Validation Error
            </Button>
            <Button 
              onClick={() => simulateError('permission')}
              variant="outline"
              disabled={isLoading}
            >
              Permission Error
            </Button>
            <Button 
              onClick={() => simulateError('server')}
              variant="outline"
              disabled={isLoading}
            >
              Server Error
            </Button>
            <Button 
              onClick={() => simulateError('file')}
              variant="outline"
              disabled={isLoading}
            >
              File Error
            </Button>
            <Button 
              onClick={simulateSuccess}
              variant="default"
              disabled={isLoading}
            >
              Success Flow
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6">
            <ErrorMessage
              error={error}
              onRetry={handleRetry}
              onDismiss={clearError}
            />
          </div>
        )}

        {/* Loading States */}
        {isLoading && (
          <div className="mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Loading States
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <LoadingState message="Processing..." />
                <LoadingState variant="dots" />
                <LoadingState variant="progress" progress={progress} message="Upload Progress" />
              </div>
              
              <div>
                <LoadingState variant="skeleton" />
              </div>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {(isLoading || currentStep > 0) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Progress Indicator
            </h3>
            <ProgressIndicator
              steps={steps}
              currentStep={currentStep}
              variant="horizontal"
            />
          </div>
        )}

        {/* Form Validation Demo */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Form Validation with Real-time Feedback
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formValidation.values.email}
              onChange={formValidation.handleChange}
              onBlur={formValidation.handleBlur}
              error={formValidation.errors.email}
              touched={formValidation.touched.email}
              placeholder="Enter your email"
              required
            />
            
            <FormInput
              label="Password"
              name="password"
              type="password"
              value={formValidation.values.password}
              onChange={formValidation.handleChange}
              onBlur={formValidation.handleBlur}
              error={formValidation.errors.password}
              touched={formValidation.touched.password}
              placeholder="Enter your password"
              showPasswordToggle
              required
            />
            
            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formValidation.values.confirmPassword}
              onChange={formValidation.handleChange}
              onBlur={formValidation.handleBlur}
              error={formValidation.errors.confirmPassword}
              touched={formValidation.touched.confirmPassword}
              placeholder="Confirm your password"
              required
            />
          </div>
          
          <div className="mt-4">
            <Button 
              onClick={() => formValidation.validateForm()}
              disabled={!formValidation.isValid}
              variant={formValidation.isValid ? 'default' : 'outline'}
            >
              Submit Form
            </Button>
            <span className="ml-3 text-sm text-gray-600">
              Form is {formValidation.isValid ? 'valid' : 'invalid'}
            </span>
          </div>
        </div>

        {/* Loading State Variants */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Loading State Variants
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-md">
              <p className="text-sm text-gray-600 mb-2">Small Spinner</p>
              <LoadingState size="sm" message="Loading..." />
            </div>
            
            <div className="p-4 border rounded-md">
              <p className="text-sm text-gray-600 mb-2">Default Spinner</p>
              <LoadingState message="Processing..." />
            </div>
            
            <div className="p-4 border rounded-md">
              <p className="text-sm text-gray-600 mb-2">Large Spinner</p>
              <LoadingState size="lg" message="Uploading..." />
            </div>
            
            <div className="p-4 border rounded-md">
              <p className="text-sm text-gray-600 mb-2">Dots Animation</p>
              <LoadingState variant="dots" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandlingDemo;