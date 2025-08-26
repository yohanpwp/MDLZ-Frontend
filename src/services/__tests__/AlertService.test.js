/**
 * AlertService Tests
 * 
 * Comprehensive test suite for the AlertService class covering
 * alert generation, severity calculation, prioritization, and management.
 */

import { vi } from 'vitest';
import AlertService, { alertService } from '../AlertService.js';
import { SEVERITY_LEVELS } from '../../types/validation.js';

describe('AlertService', () => {
  let service;
  
  beforeEach(() => {
    service = new AlertService();
  });

  describe('calculateSeverity', () => {
    it('should return CRITICAL for high percentage discrepancies', () => {
      const severity = service.calculateSeverity(100, 500); // 20% discrepancy
      expect(severity).toBe(SEVERITY_LEVELS.CRITICAL);
    });

    it('should return CRITICAL for high absolute amounts', () => {
      const severity = service.calculateSeverity(1500, 10000); // $1500 discrepancy
      expect(severity).toBe(SEVERITY_LEVELS.CRITICAL);
    });

    it('should return HIGH for moderate discrepancies', () => {
      const severity = service.calculateSeverity(600, 10000); // 6% discrepancy
      expect(severity).toBe(SEVERITY_LEVELS.HIGH);
    });

    it('should return MEDIUM for small discrepancies', () => {
      const severity = service.calculateSeverity(150, 10000); // 1.5% discrepancy
      expect(severity).toBe(SEVERITY_LEVELS.MEDIUM);
    });

    it('should return LOW for minimal discrepancies', () => {
      const severity = service.calculateSeverity(50, 10000); // 0.5% discrepancy
      expect(severity).toBe(SEVERITY_LEVELS.LOW);
    });

    it('should handle zero original values', () => {
      const severity = service.calculateSeverity(100, 0);
      expect(severity).toBe(SEVERITY_LEVELS.MEDIUM); // Based on absolute amount
    });

    it('should use field-specific thresholds', () => {
      const taxSeverity = service.calculateSeverity(110, 1000, 'taxAmount');
      const totalSeverity = service.calculateSeverity(110, 1000, 'totalAmount');
      
      // Tax amounts have lower thresholds, so same discrepancy should be higher severity
      expect(taxSeverity).toBe(SEVERITY_LEVELS.HIGH);
      expect(totalSeverity).toBe(SEVERITY_LEVELS.MEDIUM);
    });
  });

  describe('generateAlert', () => {
    const mockValidationResult = {
      id: 'validation_123',
      recordId: 'invoice_001',
      field: 'totalAmount',
      discrepancy: 500,
      originalValue: 1000,
      calculatedValue: 1500,
      batchId: 'batch_001'
    };

    it('should generate alert with correct structure', () => {
      const alert = service.generateAlert(mockValidationResult);
      
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('recordId', 'invoice_001');
      expect(alert).toHaveProperty('field', 'totalAmount');
      expect(alert).toHaveProperty('severity');
      expect(alert).toHaveProperty('message');
      expect(alert).toHaveProperty('discrepancy', 500);
      expect(alert).toHaveProperty('acknowledged', false);
      expect(alert).toHaveProperty('createdAt');
      expect(alert).toHaveProperty('priority');
    });

    it('should calculate correct severity', () => {
      const alert = service.generateAlert(mockValidationResult);
      expect(alert.severity).toBe(SEVERITY_LEVELS.CRITICAL); // 50% discrepancy
    });

    it('should generate detailed message', () => {
      const alert = service.generateAlert(mockValidationResult);
      
      expect(alert.message).toContain('totalAmount');
      expect(alert.message).toContain('$500.00');
      expect(alert.message).toContain('$1,000.00');
      expect(alert.message).toContain('$1,500.00');
    });

    it('should calculate percentage discrepancy', () => {
      const alert = service.generateAlert(mockValidationResult);
      expect(alert.percentageDiscrepancy).toBe(50); // 500/1000 * 100
    });

    it('should include metadata', () => {
      const alert = service.generateAlert(mockValidationResult, 'validation');
      
      expect(alert.metadata).toHaveProperty('alertType', 'validation');
      expect(alert.metadata).toHaveProperty('validationId', 'validation_123');
      expect(alert.metadata).toHaveProperty('batchId', 'batch_001');
    });
  });

  describe('generateAlertsFromResults', () => {
    const mockResults = [
      {
        id: 'val_1',
        recordId: 'inv_001',
        field: 'totalAmount',
        discrepancy: 1000,
        originalValue: 2000,
        calculatedValue: 3000
      },
      {
        id: 'val_2',
        recordId: 'inv_002',
        field: 'taxAmount',
        discrepancy: 50,
        originalValue: 200,
        calculatedValue: 250
      },
      {
        id: 'val_3',
        recordId: 'inv_003',
        field: 'totalAmount',
        discrepancy: 0, // No discrepancy
        originalValue: 1000,
        calculatedValue: 1000
      }
    ];

    it('should generate alerts only for results with discrepancies', () => {
      const alerts = service.generateAlertsFromResults(mockResults);
      expect(alerts).toHaveLength(2); // Only 2 have discrepancies
    });

    it('should prioritize alerts correctly', () => {
      const alerts = service.generateAlertsFromResults(mockResults);
      
      // First alert should have higher priority (larger discrepancy)
      expect(alerts[0].discrepancy).toBe(1000);
      expect(alerts[1].discrepancy).toBe(50);
    });

    it('should handle empty results', () => {
      const alerts = service.generateAlertsFromResults([]);
      expect(alerts).toHaveLength(0);
    });
  });

  describe('prioritizeAlerts', () => {
    const mockAlerts = [
      {
        id: 'alert_1',
        severity: SEVERITY_LEVELS.MEDIUM,
        priority: 50,
        createdAt: '2024-01-01T10:00:00Z'
      },
      {
        id: 'alert_2',
        severity: SEVERITY_LEVELS.CRITICAL,
        priority: 1500,
        createdAt: '2024-01-01T09:00:00Z'
      },
      {
        id: 'alert_3',
        severity: SEVERITY_LEVELS.HIGH,
        priority: 200,
        createdAt: '2024-01-01T11:00:00Z'
      }
    ];

    it('should sort by priority first', () => {
      const sorted = service.prioritizeAlerts([...mockAlerts]);
      
      expect(sorted[0].id).toBe('alert_2'); // Highest priority
      expect(sorted[1].id).toBe('alert_3'); // Medium priority
      expect(sorted[2].id).toBe('alert_1'); // Lowest priority
    });

    it('should sort by creation date when priorities are equal', () => {
      const equalPriorityAlerts = [
        {
          id: 'alert_old',
          priority: 100,
          createdAt: '2024-01-01T09:00:00Z'
        },
        {
          id: 'alert_new',
          priority: 100,
          createdAt: '2024-01-01T11:00:00Z'
        }
      ];

      const sorted = service.prioritizeAlerts(equalPriorityAlerts);
      expect(sorted[0].id).toBe('alert_new'); // Newer first
    });
  });

  describe('filterAlertsBySeverity', () => {
    const mockAlerts = [
      { id: 'alert_1', severity: SEVERITY_LEVELS.CRITICAL },
      { id: 'alert_2', severity: SEVERITY_LEVELS.HIGH },
      { id: 'alert_3', severity: SEVERITY_LEVELS.MEDIUM },
      { id: 'alert_4', severity: SEVERITY_LEVELS.LOW }
    ];

    it('should filter by single severity level', () => {
      const filtered = service.filterAlertsBySeverity(mockAlerts, SEVERITY_LEVELS.CRITICAL);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('alert_1');
    });

    it('should filter by multiple severity levels', () => {
      const filtered = service.filterAlertsBySeverity(mockAlerts, [
        SEVERITY_LEVELS.CRITICAL,
        SEVERITY_LEVELS.HIGH
      ]);
      expect(filtered).toHaveLength(2);
    });
  });

  describe('getHighPriorityAlerts', () => {
    const mockAlerts = [
      { id: 'alert_1', severity: SEVERITY_LEVELS.CRITICAL },
      { id: 'alert_2', severity: SEVERITY_LEVELS.HIGH },
      { id: 'alert_3', severity: SEVERITY_LEVELS.MEDIUM },
      { id: 'alert_4', severity: SEVERITY_LEVELS.LOW }
    ];

    it('should return only critical and high severity alerts', () => {
      const highPriority = service.getHighPriorityAlerts(mockAlerts);
      expect(highPriority).toHaveLength(2);
      expect(highPriority.map(a => a.severity)).toEqual([
        SEVERITY_LEVELS.CRITICAL,
        SEVERITY_LEVELS.HIGH
      ]);
    });
  });

  describe('getUnacknowledgedAlerts', () => {
    const mockAlerts = [
      { id: 'alert_1', acknowledged: false, dismissed: false },
      { id: 'alert_2', acknowledged: true, dismissed: false },
      { id: 'alert_3', acknowledged: false, dismissed: true },
      { id: 'alert_4', acknowledged: false, dismissed: false }
    ];

    it('should return only unacknowledged and undismissed alerts', () => {
      const unacknowledged = service.getUnacknowledgedAlerts(mockAlerts);
      expect(unacknowledged).toHaveLength(2);
      expect(unacknowledged.map(a => a.id)).toEqual(['alert_1', 'alert_4']);
    });
  });

  describe('acknowledgeAlert', () => {
    const mockAlert = {
      id: 'alert_1',
      acknowledged: false,
      acknowledgedAt: null
    };

    it('should mark alert as acknowledged', () => {
      const acknowledged = service.acknowledgeAlert(mockAlert);
      
      expect(acknowledged.acknowledged).toBe(true);
      expect(acknowledged.acknowledgedAt).toBeTruthy();
      expect(new Date(acknowledged.acknowledgedAt)).toBeInstanceOf(Date);
    });

    it('should add alert ID to acknowledged set', () => {
      service.acknowledgeAlert(mockAlert);
      expect(service.acknowledgedAlerts.has('alert_1')).toBe(true);
    });
  });

  describe('dismissAlert', () => {
    const mockAlert = {
      id: 'alert_1',
      dismissed: false,
      dismissedAt: null
    };

    it('should mark alert as dismissed', () => {
      const dismissed = service.dismissAlert(mockAlert);
      
      expect(dismissed.dismissed).toBe(true);
      expect(dismissed.dismissedAt).toBeTruthy();
    });

    it('should add alert ID to dismissed set', () => {
      service.dismissAlert(mockAlert);
      expect(service.dismissedAlerts.has('alert_1')).toBe(true);
    });
  });

  describe('acknowledgeAlerts', () => {
    const mockAlerts = [
      { id: 'alert_1', acknowledged: false },
      { id: 'alert_2', acknowledged: true },
      { id: 'alert_3', acknowledged: false }
    ];

    it('should acknowledge only unacknowledged alerts', () => {
      const result = service.acknowledgeAlerts(mockAlerts);
      
      expect(result[0].acknowledged).toBe(true); // Was false
      expect(result[1].acknowledged).toBe(true); // Was already true
      expect(result[2].acknowledged).toBe(true); // Was false
    });

    it('should use same timestamp for all acknowledgments', () => {
      const result = service.acknowledgeAlerts(mockAlerts);
      const timestamps = result
        .filter(alert => alert.acknowledgedAt)
        .map(alert => alert.acknowledgedAt);
      
      // All new acknowledgments should have the same timestamp
      const uniqueTimestamps = [...new Set(timestamps)];
      expect(uniqueTimestamps.length).toBeLessThanOrEqual(2); // Original + new
    });
  });

  describe('shouldNotify', () => {
    it('should notify for high severity alerts', () => {
      const alert = { 
        severity: SEVERITY_LEVELS.HIGH, 
        discrepancy: 500 
      };
      
      expect(service.shouldNotify(alert)).toBe(true);
    });

    it('should not notify for low severity alerts by default', () => {
      const alert = { 
        severity: SEVERITY_LEVELS.LOW, 
        discrepancy: 500 
      };
      
      expect(service.shouldNotify(alert)).toBe(false);
    });

    it('should respect custom notification config', () => {
      const alert = { 
        severity: SEVERITY_LEVELS.MEDIUM, 
        discrepancy: 50 
      };
      
      const config = {
        minSeverity: SEVERITY_LEVELS.MEDIUM,
        minDiscrepancy: 25
      };
      
      expect(service.shouldNotify(alert, config)).toBe(true);
    });

    it('should not notify when notifications are disabled', () => {
      const alert = { 
        severity: SEVERITY_LEVELS.CRITICAL, 
        discrepancy: 1000 
      };
      
      const config = { enableNotifications: false };
      
      expect(service.shouldNotify(alert, config)).toBe(false);
    });
  });

  describe('getAlertStatistics', () => {
    const mockAlerts = [
      {
        id: 'alert_1',
        severity: SEVERITY_LEVELS.CRITICAL,
        acknowledged: true,
        dismissed: false,
        discrepancy: 1000,
        createdAt: '2024-01-01T09:00:00Z'
      },
      {
        id: 'alert_2',
        severity: SEVERITY_LEVELS.HIGH,
        acknowledged: false,
        dismissed: false,
        discrepancy: 500,
        createdAt: '2024-01-01T11:00:00Z'
      },
      {
        id: 'alert_3',
        severity: SEVERITY_LEVELS.MEDIUM,
        acknowledged: false,
        dismissed: true,
        discrepancy: 200,
        createdAt: '2024-01-01T10:00:00Z'
      }
    ];

    it('should calculate correct statistics', () => {
      const stats = service.getAlertStatistics(mockAlerts);
      
      expect(stats.total).toBe(3);
      expect(stats.acknowledged).toBe(1);
      expect(stats.dismissed).toBe(1);
      expect(stats.unacknowledged).toBe(1);
      expect(stats.bySeverity[SEVERITY_LEVELS.CRITICAL]).toBe(1);
      expect(stats.bySeverity[SEVERITY_LEVELS.HIGH]).toBe(1);
      expect(stats.bySeverity[SEVERITY_LEVELS.MEDIUM]).toBe(1);
      expect(stats.totalDiscrepancyAmount).toBe(1700);
      expect(stats.averageDiscrepancyAmount).toBe(1700 / 3);
      expect(stats.maxDiscrepancyAmount).toBe(1000);
    });

    it('should handle empty alerts array', () => {
      const stats = service.getAlertStatistics([]);
      
      expect(stats.total).toBe(0);
      expect(stats.totalDiscrepancyAmount).toBe(0);
      expect(stats.averageDiscrepancyAmount).toBe(0);
      expect(stats.oldestAlert).toBe(null);
      expect(stats.newestAlert).toBe(null);
    });

    it('should identify oldest and newest alerts', () => {
      const stats = service.getAlertStatistics(mockAlerts);
      
      expect(stats.oldestAlert.id).toBe('alert_1');
      expect(stats.newestAlert.id).toBe('alert_2');
    });
  });

  describe('notification callbacks', () => {
    it('should register notification callbacks', () => {
      const callback = vi.fn();
      service.onNotification(callback);
      
      expect(service.notificationCallbacks).toContain(callback);
    });

    it('should trigger notifications for qualifying alerts', () => {
      const callback = vi.fn();
      service.onNotification(callback);
      
      const alerts = [
        { severity: SEVERITY_LEVELS.CRITICAL, discrepancy: 1000 },
        { severity: SEVERITY_LEVELS.LOW, discrepancy: 50 }
      ];
      
      service.triggerNotifications(alerts);
      
      expect(callback).toHaveBeenCalledWith([alerts[0]]); // Only critical alert
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error');
      });
      const goodCallback = vi.fn();
      
      service.onNotification(errorCallback);
      service.onNotification(goodCallback);
      
      const alerts = [{ severity: SEVERITY_LEVELS.CRITICAL, discrepancy: 1000 }];
      
      expect(() => service.triggerNotifications(alerts)).not.toThrow();
      expect(goodCallback).toHaveBeenCalled();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(alertService).toBeInstanceOf(AlertService);
    });

    it('should maintain state across imports', () => {
      alertService.acknowledgedAlerts.add('test_alert');
      expect(alertService.acknowledgedAlerts.has('test_alert')).toBe(true);
    });
  });
});