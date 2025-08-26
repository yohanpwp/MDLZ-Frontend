/**
 * DiscrepancyAlert Component
 * 
 * Displays validation discrepancy alerts with severity indicators,
 * acknowledgment functionality, and detailed discrepancy information.
 */

import React from 'react';
import { useDispatch } from 'react-redux';
import { Alert, AlertDescription, AlertTitle } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  acknowledgeAlert, 
  dismissAlert 
} from '../../redux/slices/validationSlice';
import { SEVERITY_LEVELS } from '../../types/validation';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  X, 
  Check,
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';

/**
 * Get severity configuration including colors, icons, and labels
 */
const getSeverityConfig = (severity) => {
  const configs = {
    [SEVERITY_LEVELS.CRITICAL]: {
      variant: 'destructive',
      icon: AlertTriangle,
      label: 'Critical',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800'
    },
    [SEVERITY_LEVELS.HIGH]: {
      variant: 'destructive',
      icon: AlertCircle,
      label: 'High',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-800'
    },
    [SEVERITY_LEVELS.MEDIUM]: {
      variant: 'default',
      icon: AlertCircle,
      label: 'Medium',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800'
    },
    [SEVERITY_LEVELS.LOW]: {
      variant: 'secondary',
      icon: Info,
      label: 'Low',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800'
    }
  };
  
  return configs[severity] || configs[SEVERITY_LEVELS.MEDIUM];
};

/**
 * Format currency values for display
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Individual alert item component
 */
const AlertItem = ({ alert, onAcknowledge, onDismiss, showActions = true }) => {
  const severityConfig = getSeverityConfig(alert.severity);
  const SeverityIcon = severityConfig.icon;
  
  return (
    <Alert 
      variant={severityConfig.variant}
      className={`${severityConfig.bgColor} ${severityConfig.borderColor} mb-3`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <SeverityIcon className="h-5 w-5 mt-0.5" />
          
          <div className="flex-1 min-w-0">
            <AlertTitle className="flex items-center space-x-2 mb-2">
              <span>Discrepancy Detected</span>
              <Badge variant={severityConfig.variant} className="text-xs">
                {severityConfig.label}
              </Badge>
              {alert.acknowledged && (
                <Badge variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Acknowledged
                </Badge>
              )}
            </AlertTitle>
            
            <AlertDescription className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Record:</span>
                    <span className="font-mono">{alert.recordId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Field:</span>
                    <span className="capitalize">{alert.field}</span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="font-medium">Discrepancy:</span>
                    <span className="font-mono font-semibold text-red-600">
                      {formatCurrency(alert.discrepancy)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">Detected:</span>
                    <span>{formatDate(alert.createdAt)}</span>
                  </div>
                </div>
              </div>
              
              {alert.message && (
                <div className="mt-3 p-2 bg-white/50 rounded border">
                  <p className="text-sm">{alert.message}</p>
                </div>
              )}
              
              {alert.acknowledged && alert.acknowledgedAt && (
                <div className="mt-2 text-xs text-gray-600">
                  Acknowledged on {formatDate(alert.acknowledgedAt)}
                </div>
              )}
            </AlertDescription>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2 ml-4">
            {!alert.acknowledged && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAcknowledge(alert.id)}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Acknowledge
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDismiss(alert.id)}
              className="text-xs hover:bg-red-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </Alert>
  );
};

/**
 * Main DiscrepancyAlert component
 */
const DiscrepancyAlert = ({ 
  alerts = [], 
  showAll = false, 
  maxVisible = 5,
  showActions = true,
  className = ""
}) => {
  const dispatch = useDispatch();
  
  const handleAcknowledge = (alertId) => {
    dispatch(acknowledgeAlert(alertId));
  };
  
  const handleDismiss = (alertId) => {
    dispatch(dismissAlert(alertId));
  };
  
  const handleAcknowledgeAll = () => {
    alerts.forEach(alert => {
      if (!alert.acknowledged) {
        dispatch(acknowledgeAlert(alert.id));
      }
    });
  };
  
  if (!alerts || alerts.length === 0) {
    return null;
  }
  
  // Sort alerts by severity and creation date
  const sortedAlerts = [...alerts].sort((a, b) => {
    // First sort by severity (critical > high > medium > low)
    const severityOrder = {
      [SEVERITY_LEVELS.CRITICAL]: 4,
      [SEVERITY_LEVELS.HIGH]: 3,
      [SEVERITY_LEVELS.MEDIUM]: 2,
      [SEVERITY_LEVELS.LOW]: 1
    };
    
    const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    if (severityDiff !== 0) return severityDiff;
    
    // Then sort by creation date (newest first)
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  const visibleAlerts = showAll ? sortedAlerts : sortedAlerts.slice(0, maxVisible);
  const hiddenCount = sortedAlerts.length - visibleAlerts.length;
  const unacknowledgedCount = alerts.filter(alert => !alert.acknowledged).length;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with summary and bulk actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            Validation Alerts
          </h3>
          <div className="flex items-center space-x-2">
            <Badge variant="destructive" className="text-xs">
              {alerts.length} Total
            </Badge>
            {unacknowledgedCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {unacknowledgedCount} Unacknowledged
              </Badge>
            )}
          </div>
        </div>
        
        {showActions && unacknowledgedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAcknowledgeAll}
            className="text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Acknowledge All
          </Button>
        )}
      </div>
      
      {/* Alert list */}
      <div className="space-y-3">
        {visibleAlerts.map(alert => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onAcknowledge={handleAcknowledge}
            onDismiss={handleDismiss}
            showActions={showActions}
          />
        ))}
      </div>
      
      {/* Show more indicator */}
      {hiddenCount > 0 && (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            +{hiddenCount} more alerts
          </Badge>
        </div>
      )}
    </div>
  );
};

export default DiscrepancyAlert;