/**
 * AlertService
 * 
 * Service for managing validation alerts, notifications, and alert-related operations.
 * Handles alert generation, severity calculation, prioritization, and acknowledgment logic.
 */

import { SEVERITY_LEVELS } from '../types/validation.js';

/**
 * Alert severity thresholds configuration
 */
const SEVERITY_THRESHOLDS = {
  // Percentage thresholds for discrepancy amounts
  CRITICAL_PERCENTAGE: 0.10, // 10% or more
  HIGH_PERCENTAGE: 0.05,     // 5% or more
  MEDIUM_PERCENTAGE: 0.02,   // 2% or more
  
  // Absolute amount thresholds
  CRITICAL_AMOUNT: 1000,     // $1000 or more
  HIGH_AMOUNT: 500,          // $500 or more
  MEDIUM_AMOUNT: 100,        // $100 or more
  
  // Field-specific thresholds
  FIELD_THRESHOLDS: {
    totalAmount: {
      critical: 1000,
      high: 500,
      medium: 100
    },
    taxAmount: {
      critical: 200,
      high: 100,
      medium: 25
    },
    subtotal: {
      critical: 800,
      high: 400,
      medium: 80
    },
    discount: {
      critical: 300,
      high: 150,
      medium: 50
    }
  }
};

/**
 * Alert priority weights for sorting
 */
const PRIORITY_WEIGHTS = {
  [SEVERITY_LEVELS.CRITICAL]: 1000,
  [SEVERITY_LEVELS.HIGH]: 100,
  [SEVERITY_LEVELS.MEDIUM]: 10,
  [SEVERITY_LEVELS.LOW]: 1
};

/**
 * Alert message templates
 */
const ALERT_MESSAGES = {
  [SEVERITY_LEVELS.CRITICAL]: {
    calculation: 'Critical calculation discrepancy detected. Immediate review required.',
    validation: 'Critical validation failure. Data integrity compromised.',
    threshold: 'Discrepancy exceeds critical threshold. Urgent attention needed.'
  },
  [SEVERITY_LEVELS.HIGH]: {
    calculation: 'Significant calculation discrepancy found. Review recommended.',
    validation: 'High-priority validation issue detected.',
    threshold: 'Discrepancy exceeds high-priority threshold.'
  },
  [SEVERITY_LEVELS.MEDIUM]: {
    calculation: 'Moderate calculation discrepancy identified.',
    validation: 'Validation discrepancy requires attention.',
    threshold: 'Discrepancy exceeds medium-priority threshold.'
  },
  [SEVERITY_LEVELS.LOW]: {
    calculation: 'Minor calculation variance detected.',
    validation: 'Low-priority validation issue found.',
    threshold: 'Small discrepancy identified for review.'
  }
};

class AlertService {
  constructor() {
    this.alertQueue = [];
    this.acknowledgedAlerts = new Set();
    this.dismissedAlerts = new Set();
    this.notificationCallbacks = [];
  }

  /**
   * Calculate alert severity based on discrepancy amount and context
   */
  calculateSeverity(discrepancy, originalValue, field = 'amount') {
    const absDiscrepancy = Math.abs(discrepancy);
    const absOriginalValue = Math.abs(originalValue);
    
    // Calculate percentage discrepancy
    const percentageDiscrepancy = absOriginalValue > 0 
      ? absDiscrepancy / absOriginalValue 
      : 0;
    
    // Get field-specific thresholds
    const fieldThresholds = SEVERITY_THRESHOLDS.FIELD_THRESHOLDS[field] || 
                           SEVERITY_THRESHOLDS.FIELD_THRESHOLDS.totalAmount;
    
    // Check critical conditions
    if (percentageDiscrepancy >= SEVERITY_THRESHOLDS.CRITICAL_PERCENTAGE ||
        absDiscrepancy >= fieldThresholds.critical) {
      return SEVERITY_LEVELS.CRITICAL;
    }
    
    // Check high severity conditions
    if (percentageDiscrepancy >= SEVERITY_THRESHOLDS.HIGH_PERCENTAGE ||
        absDiscrepancy >= fieldThresholds.high) {
      return SEVERITY_LEVELS.HIGH;
    }
    
    // Check medium severity conditions
    if (percentageDiscrepancy >= SEVERITY_THRESHOLDS.MEDIUM_PERCENTAGE ||
        absDiscrepancy >= fieldThresholds.medium) {
      return SEVERITY_LEVELS.MEDIUM;
    }
    
    // Default to low severity
    return SEVERITY_LEVELS.LOW;
  }

  /**
   * Generate alert from validation result
   */
  generateAlert(validationResult, alertType = 'calculation') {
    const severity = this.calculateSeverity(
      validationResult.discrepancy,
      validationResult.originalValue,
      validationResult.field
    );
    
    const messageTemplate = ALERT_MESSAGES[severity][alertType] || 
                           ALERT_MESSAGES[severity].calculation;
    
    const alert = {
      id: `alert_${validationResult.recordId}_${validationResult.field}_${Date.now()}`,
      recordId: validationResult.recordId,
      field: validationResult.field,
      severity,
      message: this.generateDetailedMessage(validationResult, messageTemplate),
      discrepancy: validationResult.discrepancy,
      originalValue: validationResult.originalValue,
      calculatedValue: validationResult.calculatedValue,
      percentageDiscrepancy: this.calculatePercentageDiscrepancy(
        validationResult.discrepancy,
        validationResult.originalValue
      ),
      acknowledged: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      dismissedAt: null,
      priority: this.calculatePriority(severity, validationResult.discrepancy),
      metadata: {
        alertType,
        validationId: validationResult.id,
        batchId: validationResult.batchId
      }
    };
    
    return alert;
  }

  /**
   * Generate detailed alert message with context
   */
  generateDetailedMessage(validationResult, template) {
    const { field, discrepancy, originalValue, calculatedValue } = validationResult;
    
    const formatCurrency = (amount) => 
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    
    const percentageDiscrepancy = this.calculatePercentageDiscrepancy(discrepancy, originalValue);
    
    return `${template} Field "${field}" shows a discrepancy of ${formatCurrency(discrepancy)} ` +
           `(${percentageDiscrepancy.toFixed(2)}%). Original: ${formatCurrency(originalValue)}, ` +
           `Calculated: ${formatCurrency(calculatedValue)}.`;
  }

  /**
   * Calculate percentage discrepancy
   */
  calculatePercentageDiscrepancy(discrepancy, originalValue) {
    if (Math.abs(originalValue) === 0) return 0;
    return (Math.abs(discrepancy) / Math.abs(originalValue)) * 100;
  }

  /**
   * Calculate alert priority for sorting
   */
  calculatePriority(severity, discrepancy) {
    const basePriority = PRIORITY_WEIGHTS[severity] || 1;
    const discrepancyWeight = Math.min(Math.abs(discrepancy) / 100, 100); // Cap at 100
    return basePriority + discrepancyWeight;
  }

  /**
   * Generate multiple alerts from validation results
   */
  generateAlertsFromResults(validationResults, alertType = 'calculation') {
    const alerts = [];
    
    for (const result of validationResults) {
      // Only generate alerts for results with discrepancies
      if (result.discrepancy && Math.abs(result.discrepancy) > 0) {
        const alert = this.generateAlert(result, alertType);
        alerts.push(alert);
      }
    }
    
    return this.prioritizeAlerts(alerts);
  }

  /**
   * Prioritize and sort alerts by severity and priority
   */
  prioritizeAlerts(alerts) {
    return alerts.sort((a, b) => {
      // First sort by priority (higher priority first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      
      // Then sort by creation date (newer first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  /**
   * Filter alerts by severity level
   */
  filterAlertsBySeverity(alerts, severityLevels) {
    if (!Array.isArray(severityLevels)) {
      severityLevels = [severityLevels];
    }
    
    return alerts.filter(alert => severityLevels.includes(alert.severity));
  }

  /**
   * Get high-priority alerts (critical and high severity)
   */
  getHighPriorityAlerts(alerts) {
    return this.filterAlertsBySeverity(alerts, [
      SEVERITY_LEVELS.CRITICAL,
      SEVERITY_LEVELS.HIGH
    ]);
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(alerts) {
    return alerts.filter(alert => !alert.acknowledged && !alert.dismissed);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alert) {
    const acknowledgedAlert = {
      ...alert,
      acknowledged: true,
      acknowledgedAt: new Date().toISOString()
    };
    
    this.acknowledgedAlerts.add(alert.id);
    return acknowledgedAlert;
  }

  /**
   * Dismiss alert
   */
  dismissAlert(alert) {
    const dismissedAlert = {
      ...alert,
      dismissed: true,
      dismissedAt: new Date().toISOString()
    };
    
    this.dismissedAlerts.add(alert.id);
    return dismissedAlert;
  }

  /**
   * Bulk acknowledge alerts
   */
  acknowledgeAlerts(alerts) {
    const timestamp = new Date().toISOString();
    
    return alerts.map(alert => {
      if (!alert.acknowledged) {
        this.acknowledgedAlerts.add(alert.id);
        return {
          ...alert,
          acknowledged: true,
          acknowledgedAt: timestamp
        };
      }
      return alert;
    });
  }

  /**
   * Check if alert should trigger notification
   */
  shouldNotify(alert, notificationConfig = {}) {
    const {
      minSeverity = SEVERITY_LEVELS.HIGH,
      minDiscrepancy = 100,
      enableNotifications = true
    } = notificationConfig;
    
    if (!enableNotifications) return false;
    
    // Check severity threshold
    const severityOrder = {
      [SEVERITY_LEVELS.LOW]: 1,
      [SEVERITY_LEVELS.MEDIUM]: 2,
      [SEVERITY_LEVELS.HIGH]: 3,
      [SEVERITY_LEVELS.CRITICAL]: 4
    };
    
    if (severityOrder[alert.severity] < severityOrder[minSeverity]) {
      return false;
    }
    
    // Check discrepancy threshold
    if (Math.abs(alert.discrepancy) < minDiscrepancy) {
      return false;
    }
    
    return true;
  }

  /**
   * Register notification callback
   */
  onNotification(callback) {
    this.notificationCallbacks.push(callback);
  }

  /**
   * Trigger notifications for alerts
   */
  triggerNotifications(alerts, notificationConfig = {}) {
    const alertsToNotify = alerts.filter(alert => 
      this.shouldNotify(alert, notificationConfig)
    );
    
    if (alertsToNotify.length > 0) {
      this.notificationCallbacks.forEach(callback => {
        try {
          callback(alertsToNotify);
        } catch (error) {
          console.error('Notification callback error:', error);
        }
      });
    }
    
    return alertsToNotify;
  }

  /**
   * Get alert statistics
   */
  getAlertStatistics(alerts) {
    const stats = {
      total: alerts.length,
      acknowledged: 0,
      dismissed: 0,
      unacknowledged: 0,
      bySeverity: {
        [SEVERITY_LEVELS.CRITICAL]: 0,
        [SEVERITY_LEVELS.HIGH]: 0,
        [SEVERITY_LEVELS.MEDIUM]: 0,
        [SEVERITY_LEVELS.LOW]: 0
      },
      totalDiscrepancyAmount: 0,
      averageDiscrepancyAmount: 0,
      maxDiscrepancyAmount: 0,
      oldestAlert: null,
      newestAlert: null
    };
    
    if (alerts.length === 0) return stats;
    
    let totalDiscrepancy = 0;
    let maxDiscrepancy = 0;
    let oldestDate = new Date();
    let newestDate = new Date(0);
    
    alerts.forEach(alert => {
      // Count by status
      if (alert.acknowledged) stats.acknowledged++;
      if (alert.dismissed) stats.dismissed++;
      if (!alert.acknowledged && !alert.dismissed) stats.unacknowledged++;
      
      // Count by severity
      stats.bySeverity[alert.severity]++;
      
      // Calculate discrepancy statistics
      const absDiscrepancy = Math.abs(alert.discrepancy);
      totalDiscrepancy += absDiscrepancy;
      maxDiscrepancy = Math.max(maxDiscrepancy, absDiscrepancy);
      
      // Track date range
      const alertDate = new Date(alert.createdAt);
      if (alertDate < oldestDate) {
        oldestDate = alertDate;
        stats.oldestAlert = alert;
      }
      if (alertDate > newestDate) {
        newestDate = alertDate;
        stats.newestAlert = alert;
      }
    });
    
    stats.totalDiscrepancyAmount = totalDiscrepancy;
    stats.averageDiscrepancyAmount = totalDiscrepancy / alerts.length;
    stats.maxDiscrepancyAmount = maxDiscrepancy;
    
    return stats;
  }

  /**
   * Update severity thresholds
   */
  updateSeverityThresholds(newThresholds) {
    Object.assign(SEVERITY_THRESHOLDS, newThresholds);
  }

  /**
   * Get current severity thresholds
   */
  getSeverityThresholds() {
    return { ...SEVERITY_THRESHOLDS };
  }
}

// Export singleton instance
export const alertService = new AlertService();
export default AlertService;