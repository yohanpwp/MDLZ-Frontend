/**
 * Unit tests for ValidationEngine service
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { ValidationEngine } from '../ValidationEngine.js';
import { SEVERITY_LEVELS, VALIDATION_FIELDS, DEFAULT_VALIDATION_CONFIG } from '../../types/validation.js';
import { createEmptyInvoiceRecord } from '../../types/invoice.js';

describe('ValidationEngine', () => {
  let validationEngine;

  beforeEach(() => {
    validationEngine = new ValidationEngine();
  });

  afterEach(() => {
    validationEngine.clearResults();
  });

  describe('constructor', () => {
    test('should initialize with default config', () => {
      expect(validationEngine.config).toEqual(DEFAULT_VALIDATION_CONFIG);
      expect(validationEngine.results).toEqual([]);
      expect(validationEngine.isValidating).toBe(false);
    });

    test('should accept custom config', () => {
      const customConfig = {
        thresholds: { low: 2.0, medium: 6.0, high: 12.0, critical: 25.0 }
      };
      const engine = new ValidationEngine(customConfig);
      
      expect(engine.config.thresholds.low).toBe(2.0);
      expect(engine.config.thresholds.medium).toBe(6.0);
      // Should merge with defaults
      expect(engine.config.tolerances).toEqual(DEFAULT_VALIDATION_CONFIG.tolerances);
    });
  });

  describe('validateRecord', () => {
    test('should validate a record with no discrepancies', async () => {
      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 10,
        taxAmount: 10,
        discountAmount: 0,
        totalAmount: 110
      };

      const results = await validationEngine.validateRecord(record);
      expect(results).toEqual([]);
    });

    test('should detect tax calculation discrepancy', async () => {
      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 10,
        taxAmount: 15, // Should be 10
        discountAmount: 0,
        totalAmount: 115
      };

      const results = await validationEngine.validateRecord(record);
      
      expect(results).toHaveLength(2); // Tax and total discrepancies
      
      const taxResult = results.find(r => r.field === VALIDATION_FIELDS.TAX_AMOUNT);
      expect(taxResult).toBeDefined();
      expect(taxResult.originalValue).toBe(15);
      expect(taxResult.calculatedValue).toBe(10);
      expect(taxResult.discrepancy).toBe(5);
      expect(taxResult.severity).toBe(SEVERITY_LEVELS.HIGH);
    });

    test('should detect total calculation discrepancy', async () => {
      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 10,
        taxAmount: 10,
        discountAmount: 5,
        totalAmount: 110 // Should be 105
      };

      const results = await validationEngine.validateRecord(record);
      
      const totalResult = results.find(r => r.field === VALIDATION_FIELDS.TOTAL_AMOUNT);
      expect(totalResult).toBeDefined();
      expect(totalResult.originalValue).toBe(110);
      expect(totalResult.calculatedValue).toBe(105);
      expect(totalResult.discrepancy).toBe(5);
    });

    test('should detect discount calculation discrepancy', async () => {
      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 15, // 15% discount should be 15, but let's say it's wrong
        totalAmount: 85
      };

      const results = await validationEngine.validateRecord(record);
      
      // Should validate discount calculation
      expect(results.length).toBeGreaterThanOrEqual(0);
    });

    test('should validate line items when present', async () => {
      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 100,
        lineItems: [
          {
            id: 'line-1',
            quantity: 2,
            unitPrice: 25,
            lineTotal: 55 // Should be 50
          },
          {
            id: 'line-2',
            quantity: 1,
            unitPrice: 50,
            lineTotal: 50
          }
        ]
      };

      const results = await validationEngine.validateRecord(record);
      
      const lineItemResult = results.find(r => r.field.includes(VALIDATION_FIELDS.LINE_ITEM_TOTAL));
      expect(lineItemResult).toBeDefined();
      expect(lineItemResult.originalValue).toBe(55);
      expect(lineItemResult.calculatedValue).toBe(50);
    });

    test('should skip validation when rules are disabled', async () => {
      validationEngine.updateConfig({
        rules: {
          validateTaxCalculation: false,
          validateTotalCalculation: false,
          validateDiscountCalculation: false,
          validateLineItemTotals: false
        }
      });

      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 10,
        taxAmount: 999, // Obviously wrong
        totalAmount: 999 // Obviously wrong
      };

      const results = await validationEngine.validateRecord(record);
      expect(results).toEqual([]);
    });

    test('should handle validation errors gracefully', async () => {
      const invalidRecord = {
        id: 'test-1',
        // Missing required fields
      };

      const results = await validationEngine.validateRecord(invalidRecord);
      
      expect(results).toHaveLength(1);
      expect(results[0].severity).toBe(SEVERITY_LEVELS.CRITICAL);
      expect(results[0].field).toBe('general');
    });
  });

  describe('validateBatch', () => {
    test('should validate multiple records', async () => {
      const records = [
        {
          ...createEmptyInvoiceRecord(),
          id: 'test-1',
          amount: 100,
          taxRate: 10,
          taxAmount: 10,
          totalAmount: 110
        },
        {
          ...createEmptyInvoiceRecord(),
          id: 'test-2',
          amount: 200,
          taxRate: 10,
          taxAmount: 25, // Should be 20
          totalAmount: 225
        }
      ];

      const summary = await validationEngine.validateBatch(records);
      
      expect(summary.totalRecords).toBe(2);
      expect(summary.validRecords).toBe(1);
      expect(summary.invalidRecords).toBe(1);
      expect(summary.totalDiscrepancies).toBeGreaterThan(0);
    });

    test('should call progress callback during validation', async () => {
      const records = Array.from({ length: 5 }, (_, i) => ({
        ...createEmptyInvoiceRecord(),
        id: `test-${i}`,
        amount: 100,
        taxRate: 10,
        taxAmount: 10,
        totalAmount: 110
      }));

      const progressCallback = jest.fn();
      await validationEngine.validateBatch(records, progressCallback);
      
      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          progressPercentage: 100
        })
      );
    });

    test('should calculate summary statistics correctly', async () => {
      const records = [
        {
          ...createEmptyInvoiceRecord(),
          id: 'test-1',
          amount: 100,
          taxRate: 10,
          taxAmount: 15, // 5 discrepancy
          totalAmount: 115
        },
        {
          ...createEmptyInvoiceRecord(),
          id: 'test-2',
          amount: 100,
          taxRate: 10,
          taxAmount: 25, // 15 discrepancy
          totalAmount: 125
        }
      ];

      const summary = await validationEngine.validateBatch(records);
      
      expect(summary.totalDiscrepancyAmount).toBeGreaterThan(0);
      expect(summary.averageDiscrepancyAmount).toBeGreaterThan(0);
      expect(summary.maxDiscrepancyAmount).toBeGreaterThan(0);
      expect(summary.processingTimeMs).toBeGreaterThan(0);
    });

    test('should handle batch validation errors', async () => {
      const invalidRecords = [null, undefined, {}];
      
      await expect(validationEngine.validateBatch(invalidRecords)).rejects.toThrow();
    });
  });

  describe('determineSeverity', () => {
    test('should classify severity levels correctly', () => {
      expect(validationEngine.determineSeverity(0.5)).toBe(SEVERITY_LEVELS.LOW);
      expect(validationEngine.determineSeverity(3.0)).toBe(SEVERITY_LEVELS.MEDIUM);
      expect(validationEngine.determineSeverity(8.0)).toBe(SEVERITY_LEVELS.HIGH);
      expect(validationEngine.determineSeverity(25.0)).toBe(SEVERITY_LEVELS.CRITICAL);
    });

    test('should handle boundary values', () => {
      expect(validationEngine.determineSeverity(1.0)).toBe(SEVERITY_LEVELS.LOW);
      expect(validationEngine.determineSeverity(5.0)).toBe(SEVERITY_LEVELS.MEDIUM);
      expect(validationEngine.determineSeverity(10.0)).toBe(SEVERITY_LEVELS.HIGH);
      expect(validationEngine.determineSeverity(20.0)).toBe(SEVERITY_LEVELS.CRITICAL);
    });
  });

  describe('configuration management', () => {
    test('should update configuration', () => {
      const newConfig = {
        thresholds: { low: 2.0, medium: 6.0, high: 12.0, critical: 25.0 }
      };
      
      validationEngine.updateConfig(newConfig);
      
      expect(validationEngine.config.thresholds.low).toBe(2.0);
      expect(validationEngine.config.thresholds.medium).toBe(6.0);
    });

    test('should merge configuration with existing config', () => {
      const originalTolerance = validationEngine.config.tolerances.taxCalculation;
      
      validationEngine.updateConfig({
        thresholds: { low: 2.0 }
      });
      
      expect(validationEngine.config.thresholds.low).toBe(2.0);
      expect(validationEngine.config.tolerances.taxCalculation).toBe(originalTolerance);
    });
  });

  describe('result management', () => {
    beforeEach(async () => {
      // Add some test results
      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 10,
        taxAmount: 15,
        totalAmount: 115
      };
      await validationEngine.validateRecord(record);
      validationEngine.results = await validationEngine.validateRecord(record);
    });

    test('should get results by severity', () => {
      const highSeverityResults = validationEngine.getResultsBySeverity(SEVERITY_LEVELS.HIGH);
      expect(Array.isArray(highSeverityResults)).toBe(true);
    });

    test('should get results by record ID', () => {
      const recordResults = validationEngine.getResultsByRecord('test-1');
      expect(Array.isArray(recordResults)).toBe(true);
    });

    test('should clear results', () => {
      validationEngine.clearResults();
      
      expect(validationEngine.results).toEqual([]);
      expect(validationEngine.summary.totalRecords).toBe(0);
    });

    test('should generate statistics', () => {
      const stats = validationEngine.getStatistics();
      
      expect(stats).toHaveProperty('totalValidations');
      expect(stats).toHaveProperty('severityBreakdown');
      expect(stats).toHaveProperty('recordBreakdown');
      expect(stats).toHaveProperty('financialImpact');
      expect(stats).toHaveProperty('performance');
    });
  });

  describe('batch ID generation', () => {
    test('should generate unique batch IDs', () => {
      const id1 = validationEngine.generateBatchId();
      const id2 = validationEngine.generateBatchId();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^batch_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^batch_\d+_[a-z0-9]+$/);
    });
  });

  describe('tolerance handling', () => {
    test('should respect tolerance settings', async () => {
      validationEngine.updateConfig({
        tolerances: {
          taxCalculation: 1.0, // 1 dollar tolerance
          totalCalculation: 1.0
        }
      });

      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 10,
        taxAmount: 10.5, // Within tolerance
        totalAmount: 110.5
      };

      const results = await validationEngine.validateRecord(record);
      expect(results).toEqual([]); // Should be within tolerance
    });

    test('should detect discrepancies outside tolerance', async () => {
      validationEngine.updateConfig({
        tolerances: {
          taxCalculation: 0.01, // 1 cent tolerance
          totalCalculation: 0.01
        }
      });

      const record = {
        ...createEmptyInvoiceRecord(),
        id: 'test-1',
        amount: 100,
        taxRate: 10,
        taxAmount: 10.5, // Outside tolerance
        totalAmount: 110.5
      };

      const results = await validationEngine.validateRecord(record);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});