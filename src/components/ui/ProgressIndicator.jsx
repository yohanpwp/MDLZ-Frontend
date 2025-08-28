import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';

const ProgressIndicator = ({ 
  steps, 
  currentStep, 
  variant = 'horizontal',
  showLabels = true,
  className = ''
}) => {
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (stepIndex, step) => {
    const status = getStepStatus(stepIndex);
    
    if (step.error) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return (
          <div className="h-5 w-5 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
        );
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStepClasses = (stepIndex, step) => {
    const status = getStepStatus(stepIndex);
    
    if (step.error) {
      return 'text-red-600';
    }
    
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'current':
        return 'text-blue-600 font-medium';
      default:
        return 'text-gray-400';
    }
  };

  const getConnectorClasses = (stepIndex) => {
    const status = getStepStatus(stepIndex);
    return status === 'completed' ? 'bg-green-500' : 'bg-gray-200';
  };

  if (variant === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            <div className="flex flex-col items-center mr-4">
              {getStepIcon(index, step)}
              {index < steps.length - 1 && (
                <div className={`w-0.5 h-8 mt-2 ${getConnectorClasses(index)}`}></div>
              )}
            </div>
            
            {showLabels && (
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${getStepClasses(index, step)}`}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </p>
                )}
                {step.error && (
                  <p className="text-xs text-red-500 mt-1">
                    {step.error}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div className="flex flex-col items-center">
            {getStepIcon(index, step)}
            
            {showLabels && (
              <div className="mt-2 text-center">
                <p className={`text-xs ${getStepClasses(index, step)}`}>
                  {step.label}
                </p>
                {step.error && (
                  <p className="text-xs text-red-500 mt-1">
                    Error
                  </p>
                )}
              </div>
            )}
          </div>
          
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${getConnectorClasses(index)}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

ProgressIndicator.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      description: PropTypes.string,
      error: PropTypes.string
    })
  ).isRequired,
  currentStep: PropTypes.number.isRequired,
  variant: PropTypes.oneOf(['horizontal', 'vertical']),
  showLabels: PropTypes.bool,
  className: PropTypes.string
};

export default ProgressIndicator;