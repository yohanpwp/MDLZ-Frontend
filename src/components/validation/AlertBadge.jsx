/**
 * AlertBadge Component
 * 
 * Visual indicator badge for displaying alert counts in navigation and headers.
 * Shows different colors based on alert severity and provides hover details.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { Badge } from '../ui/Badge';
import { 
  selectUnacknowledgedAlerts,
  selectValidationAlerts 
} from '../../redux/slices/validationSlice';
import { SEVERITY_LEVELS } from '../../types/validation';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Bell,
  BellRing
} from 'lucide-react';

/**
 * Get the highest severity level from a list of alerts
 */
const getHighestSeverity = (alerts) => {
  if (!alerts || alerts.length === 0) return null;
  
  const severityOrder = {
    [SEVERITY_LEVELS.CRITICAL]: 4,
    [SEVERITY_LEVELS.HIGH]: 3,
    [SEVERITY_LEVELS.MEDIUM]: 2,
    [SEVERITY_LEVELS.LOW]: 1
  };
  
  return alerts.reduce((highest, alert) => {
    const currentLevel = severityOrder[alert.severity] || 0;
    const highestLevel = severityOrder[highest] || 0;
    return currentLevel > highestLevel ? alert.severity : highest;
  }, SEVERITY_LEVELS.LOW);
};

/**
 * Get badge variant based on severity
 */
const getSeverityVariant = (severity) => {
  const variants = {
    [SEVERITY_LEVELS.CRITICAL]: 'critical',
    [SEVERITY_LEVELS.HIGH]: 'high',
    [SEVERITY_LEVELS.MEDIUM]: 'medium',
    [SEVERITY_LEVELS.LOW]: 'low'
  };
  
  return variants[severity] || 'secondary';
};

/**
 * Get icon based on severity
 */
const getSeverityIcon = (severity, hasUnacknowledged = false) => {
  const iconProps = { className: "h-3 w-3" };
  
  if (hasUnacknowledged) {
    return <BellRing {...iconProps} />;
  }
  
  const icons = {
    [SEVERITY_LEVELS.CRITICAL]: <AlertTriangle {...iconProps} />,
    [SEVERITY_LEVELS.HIGH]: <AlertCircle {...iconProps} />,
    [SEVERITY_LEVELS.MEDIUM]: <AlertCircle {...iconProps} />,
    [SEVERITY_LEVELS.LOW]: <Info {...iconProps} />
  };
  
  return icons[severity] || <Bell {...iconProps} />;
};

/**
 * Simple alert count badge
 */
export const SimpleAlertBadge = ({ 
  count = 0, 
  severity = SEVERITY_LEVELS.LOW,
  showIcon = true,
  className = ""
}) => {
  if (count === 0) return null;
  
  const variant = getSeverityVariant(severity);
  const icon = showIcon ? getSeverityIcon(severity) : null;
  
  return (
    <Badge variant={variant} className={className}>
      {icon && <span className="mr-1">{icon}</span>}
      {count}
    </Badge>
  );
};

/**
 * Alert badge with tooltip showing breakdown
 */
export const DetailedAlertBadge = ({ 
  showUnacknowledgedOnly = true,
  showIcon = true,
  className = "",
  size = "sm"
}) => {
  const allAlerts = useSelector(selectValidationAlerts);
  const unacknowledgedAlerts = useSelector(selectUnacknowledgedAlerts);
  
  const alerts = showUnacknowledgedOnly ? unacknowledgedAlerts : allAlerts;
  
  if (!alerts || alerts.length === 0) return null;
  
  const highestSeverity = getHighestSeverity(alerts);
  const variant = getSeverityVariant(highestSeverity);
  const icon = showIcon ? getSeverityIcon(highestSeverity, showUnacknowledgedOnly) : null;
  
  // Calculate severity breakdown
  const severityBreakdown = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {});
  
  const tooltipContent = (
    <div className="text-xs space-y-1">
      <div className="font-semibold">
        {showUnacknowledgedOnly ? 'Unacknowledged' : 'Total'} Alerts: {alerts.length}
      </div>
      {Object.entries(severityBreakdown).map(([severity, count]) => (
        <div key={severity} className="flex justify-between">
          <span className="capitalize">{severity}:</span>
          <span>{count}</span>
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="relative group">
      <Badge 
        variant={variant} 
        className={`${className} ${size === 'lg' ? 'px-3 py-1 text-sm' : ''}`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {alerts.length}
      </Badge>
      
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
        {tooltipContent}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
};

/**
 * Animated alert badge with pulse effect for new alerts
 */
export const AnimatedAlertBadge = ({ 
  showUnacknowledgedOnly = true,
  showIcon = true,
  className = "",
  pulseOnNew = true
}) => {
  const allAlerts = useSelector(selectValidationAlerts);
  const unacknowledgedAlerts = useSelector(selectUnacknowledgedAlerts);
  
  const alerts = showUnacknowledgedOnly ? unacknowledgedAlerts : allAlerts;
  
  if (!alerts || alerts.length === 0) return null;
  
  const highestSeverity = getHighestSeverity(alerts);
  const variant = getSeverityVariant(highestSeverity);
  const icon = showIcon ? getSeverityIcon(highestSeverity, showUnacknowledgedOnly) : null;
  
  // Check if there are recent alerts (within last 30 seconds)
  const hasRecentAlerts = pulseOnNew && alerts.some(alert => {
    const alertTime = new Date(alert.createdAt);
    const now = new Date();
    return (now - alertTime) < 30000; // 30 seconds
  });
  
  return (
    <Badge 
      variant={variant} 
      className={`${className} ${hasRecentAlerts ? 'animate-pulse' : ''}`}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {alerts.length}
    </Badge>
  );
};

/**
 * Main AlertBadge component with multiple display options
 */
const AlertBadge = ({ 
  type = 'detailed', // 'simple', 'detailed', 'animated'
  showUnacknowledgedOnly = true,
  showIcon = true,
  className = "",
  size = "sm",
  ...props
}) => {
  const BadgeComponent = {
    simple: SimpleAlertBadge,
    detailed: DetailedAlertBadge,
    animated: AnimatedAlertBadge
  }[type] || DetailedAlertBadge;
  
  return (
    <BadgeComponent
      showUnacknowledgedOnly={showUnacknowledgedOnly}
      showIcon={showIcon}
      className={className}
      size={size}
      {...props}
    />
  );
};

export default AlertBadge;