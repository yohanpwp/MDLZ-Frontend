/**
 * Unit tests for FinancialCalculations utility
 */

import { describe, test, expect } from 'vitest';
import { FinancialCalculations } from '../FinancialCalculations.js';
import { VALIDATION_ERROR_TYPES } from '../../types/validation.js';

describe('FinancialCalculations', () => {
  describe('calculateTax', () => {
    test('should calculate tax correctly with standard inputs', () => {
      const result = FinancialCalculations.calculateTax(100, 10);
      
      expect(result.isValid).toBe(true);
      expect(result.taxAmount).toBe(10);
      expect(result.taxRate).toBe(10);
      expect(result.taxableAmount).toBe(100);
      expect(result.method).toBe('standard');
    });

    test('should handle zero tax rate', () => {
      const result = FinancialCalculations.calculateTax(100, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.taxAmount).toBe(0);
      expect(result.taxRate).toBe(0);
    });

    test('should apply rounding correctly', () => {
      const result = FinancialCalculations.calculateTax(33.33, 15, { precision: 2, roundingMethod: 'round' });
      
      expect(result.isValid).toBe(true);
      expect(result.taxAmount).toBe(5.00); // 33.33 * 0.15 = 4.9995, rounded to 5.00
    });

    test('should handle floor rounding', () => {
      const result = FinancialCalculations.calculateTax(33.33, 15, { precision: 2, roundingMethod: 'floor' });
      
      expect(result.isValid).toBe(true);
      expect(result.taxAmount).toBe(4.99); // 33.33 * 0.15 = 4.9995, floored to 4.99
    });

    test('should handle ceil rounding', () => {
      const result = FinancialCalculations.calculateTax(33.33, 15, { precision: 2, roundingMethod: 'ceil' });
      
      expect(result.isValid).toBe(true);
      expect(result.taxAmount).toBe(5.00); // 33.33 * 0.15 = 4.9995, ceiled to 5.00
    });

    test('should reject negative taxable amount', () => {
      const result = FinancialCalculations.calculateTax(-100, 10);
      
      expect(result.isValid).toBe(false);
      expect(result.taxAmount).toBe(0);
      expect(result.breakdown.errorType).toBe(VALIDATION_ERROR_TYPES.FORMULA_ERROR);
    });

    test('should reject invalid tax rate', () => {
      const result = FinancialCalculations.calculateTax(100, -5);
      
      expect(result.isValid).toBe(false);
      expect(result.taxAmount).toBe(0);
    });

    test('should reject tax rate over 100%', () => {
      const result = FinancialCalculations.calculateTax(100, 150);
      
      expect(result.isValid).toBe(false);
      expect(result.taxAmount).toBe(0);
    });

    test('should handle non-numeric inputs', () => {
      const result = FinancialCalculations.calculateTax('invalid', 10);
      
      expect(result.isValid).toBe(false);
      expect(result.taxAmount).toBe(0);
    });
  });

  describe('calculateTotal', () => {
    test('should calculate total correctly with all components', () => {
      const result = FinancialCalculations.calculateTotal(100, 10, 5);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(105); // 100 + 10 - 5
      expect(result.formula).toBe('100 + 10 - 5 = 105');
    });

    test('should handle zero tax and discount', () => {
      const result = FinancialCalculations.calculateTotal(100, 0, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(100);
    });

    test('should handle missing tax and discount (defaults to 0)', () => {
      const result = FinancialCalculations.calculateTotal(100);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(100);
    });

    test('should reject negative base amount', () => {
      const result = FinancialCalculations.calculateTotal(-100, 10, 5);
      
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    test('should reject negative tax amount', () => {
      const result = FinancialCalculations.calculateTotal(100, -10, 5);
      
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(0);
    });

    test('should reject negative discount amount', () => {
      const result = FinancialCalculations.calculateTotal(100, 10, -5);
      
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(0);
    });

    test('should reject when total would be negative', () => {
      const result = FinancialCalculations.calculateTotal(100, 10, 150);
      
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(0);
    });

    test('should apply rounding to final total', () => {
      const result = FinancialCalculations.calculateTotal(33.333, 5.555, 1.111, { precision: 2 });
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(37.78); // 33.333 + 5.555 - 1.111 = 37.777, rounded to 37.78
    });
  });

  describe('calculateDiscount', () => {
    test('should calculate percentage discount correctly', () => {
      const result = FinancialCalculations.calculateDiscount(100, 10, 'percentage');
      
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(10);
      expect(result.discountRate).toBe(10);
      expect(result.finalAmount).toBe(90);
      expect(result.discountType).toBe('percentage');
    });

    test('should calculate fixed discount correctly', () => {
      const result = FinancialCalculations.calculateDiscount(100, 15, 'fixed');
      
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(15);
      expect(result.discountRate).toBe(15); // 15% of 100
      expect(result.finalAmount).toBe(85);
      expect(result.discountType).toBe('fixed');
    });

    test('should handle zero discount', () => {
      const result = FinancialCalculations.calculateDiscount(100, 0, 'percentage');
      
      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(100);
    });

    test('should reject percentage discount over 100%', () => {
      const result = FinancialCalculations.calculateDiscount(100, 150, 'percentage');
      
      expect(result.isValid).toBe(false);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(100);
    });

    test('should reject fixed discount exceeding original amount', () => {
      const result = FinancialCalculations.calculateDiscount(100, 150, 'fixed');
      
      expect(result.isValid).toBe(false);
      expect(result.discountAmount).toBe(0);
      expect(result.finalAmount).toBe(100);
    });

    test('should reject invalid discount type', () => {
      const result = FinancialCalculations.calculateDiscount(100, 10, 'invalid');
      
      expect(result.isValid).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    test('should reject negative original amount', () => {
      const result = FinancialCalculations.calculateDiscount(-100, 10, 'percentage');
      
      expect(result.isValid).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    test('should reject negative discount value', () => {
      const result = FinancialCalculations.calculateDiscount(100, -10, 'percentage');
      
      expect(result.isValid).toBe(false);
      expect(result.discountAmount).toBe(0);
    });
  });

  describe('calculateLineItemTotal', () => {
    test('should calculate line item total correctly', () => {
      const result = FinancialCalculations.calculateLineItemTotal(5, 20);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(100);
      expect(result.formula).toBe('5 × 20 = 100');
    });

    test('should handle zero quantity', () => {
      const result = FinancialCalculations.calculateLineItemTotal(0, 20);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    test('should handle zero unit price', () => {
      const result = FinancialCalculations.calculateLineItemTotal(5, 0);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    test('should apply rounding correctly', () => {
      const result = FinancialCalculations.calculateLineItemTotal(3, 33.333, { precision: 2 });
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(100.00); // 3 * 33.333 = 99.999, rounded to 100.00
    });

    test('should reject negative quantity', () => {
      const result = FinancialCalculations.calculateLineItemTotal(-5, 20);
      
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(0);
    });

    test('should reject negative unit price', () => {
      const result = FinancialCalculations.calculateLineItemTotal(5, -20);
      
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(0);
    });
  });

  describe('calculateSubtotal', () => {
    test('should calculate subtotal from line items', () => {
      const lineItems = [
        { id: '1', lineTotal: 100 },
        { id: '2', lineTotal: 50 },
        { id: '3', lineTotal: 25 }
      ];
      
      const result = FinancialCalculations.calculateSubtotal(lineItems);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(175);
      expect(result.formula).toBe('Sum of 3 line items = 175');
    });

    test('should handle empty line items array', () => {
      const result = FinancialCalculations.calculateSubtotal([]);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(0);
    });

    test('should handle line items with invalid totals', () => {
      const lineItems = [
        { id: '1', lineTotal: 100 },
        { id: '2', lineTotal: 'invalid' },
        { id: '3', lineTotal: 25 }
      ];
      
      const result = FinancialCalculations.calculateSubtotal(lineItems);
      
      expect(result.isValid).toBe(true);
      expect(result.value).toBe(125); // Only valid items summed
      expect(result.warnings.length).toBe(1);
    });

    test('should reject non-array input', () => {
      const result = FinancialCalculations.calculateSubtotal('invalid');
      
      expect(result.isValid).toBe(false);
      expect(result.value).toBe(0);
    });
  });

  describe('applyRounding', () => {
    test('should round to specified precision', () => {
      expect(FinancialCalculations.applyRounding(3.14159, 2)).toBe(3.14);
      expect(FinancialCalculations.applyRounding(3.14159, 3)).toBe(3.142);
      expect(FinancialCalculations.applyRounding(3.14159, 0)).toBe(3);
    });

    test('should floor correctly', () => {
      expect(FinancialCalculations.applyRounding(3.99, 0, 'floor')).toBe(3);
      expect(FinancialCalculations.applyRounding(3.99, 1, 'floor')).toBe(3.9);
    });

    test('should ceil correctly', () => {
      expect(FinancialCalculations.applyRounding(3.01, 0, 'ceil')).toBe(4);
      expect(FinancialCalculations.applyRounding(3.01, 1, 'ceil')).toBe(3.1);
    });
  });

  describe('isWithinTolerance', () => {
    test('should return true for values within tolerance', () => {
      expect(FinancialCalculations.isWithinTolerance(100, 100.005, 0.01)).toBe(true);
      expect(FinancialCalculations.isWithinTolerance(100, 99.995, 0.01)).toBe(true);
    });

    test('should return false for values outside tolerance', () => {
      expect(FinancialCalculations.isWithinTolerance(100, 100.02, 0.01)).toBe(false);
      expect(FinancialCalculations.isWithinTolerance(100, 99.98, 0.01)).toBe(false);
    });

    test('should handle exact matches', () => {
      expect(FinancialCalculations.isWithinTolerance(100, 100, 0.01)).toBe(true);
    });
  });

  describe('calculatePercentageDifference', () => {
    test('should calculate percentage difference correctly', () => {
      expect(FinancialCalculations.calculatePercentageDifference(100, 110)).toBe(10);
      expect(FinancialCalculations.calculatePercentageDifference(100, 90)).toBe(10);
    });

    test('should handle zero original value', () => {
      expect(FinancialCalculations.calculatePercentageDifference(0, 100)).toBe(100);
    });

    test('should handle both values being zero', () => {
      expect(FinancialCalculations.calculatePercentageDifference(0, 0)).toBe(0);
    });
  });

  describe('parseCurrencyValue', () => {
    test('should parse numeric values', () => {
      expect(FinancialCalculations.parseCurrencyValue(123.45)).toBe(123.45);
      expect(FinancialCalculations.parseCurrencyValue(0)).toBe(0);
    });

    test('should parse currency strings', () => {
      expect(FinancialCalculations.parseCurrencyValue('$123.45')).toBe(123.45);
      expect(FinancialCalculations.parseCurrencyValue('€1,234.56')).toBe(1234.56);
      expect(FinancialCalculations.parseCurrencyValue('£1 234.56')).toBe(1234.56);
    });

    test('should handle invalid inputs', () => {
      expect(FinancialCalculations.parseCurrencyValue('invalid')).toBeNull();
      expect(FinancialCalculations.parseCurrencyValue(null)).toBeNull();
      expect(FinancialCalculations.parseCurrencyValue(undefined)).toBeNull();
      expect(FinancialCalculations.parseCurrencyValue(NaN)).toBeNull();
    });
  });

  describe('formatCurrency', () => {
    test('should format currency correctly', () => {
      const formatted = FinancialCalculations.formatCurrency(123.45, 'USD', 'en-US');
      expect(formatted).toMatch(/\$123\.45/);
    });

    test('should handle different currencies', () => {
      const formatted = FinancialCalculations.formatCurrency(123.45, 'EUR', 'en-US');
      expect(formatted).toMatch(/€123\.45/);
    });

    test('should fallback on formatting errors', () => {
      const formatted = FinancialCalculations.formatCurrency(123.45, 'INVALID');
      expect(formatted).toBe('INVALID 123.45');
    });
  });
});