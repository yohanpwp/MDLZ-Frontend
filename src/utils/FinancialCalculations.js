/**
 * Financial Calculations Utility
 * 
 * This utility provides comprehensive financial calculation functions
 * for tax calculations, totals, discounts, and other invoice-related computations.
 */

import { VALIDATION_ERROR_TYPES } from '../types/validation.js';

/**
 * Utility class for financial calculations
 */
export class FinancialCalculations {
  /**
   * Calculate tax amount based on taxable amount and tax rate
   * @param {number} taxableAmount - Amount subject to tax
   * @param {number} taxRate - Tax rate as percentage (e.g., 10 for 10%)
   * @param {Object} options - Calculation options
   * @param {number} options.precision - Decimal precision (default: 2)
   * @param {'round' | 'floor' | 'ceil'} options.roundingMethod - Rounding method
   * @returns {import('../types/validation.js').TaxCalculationResult}
   */
  static calculateTax(taxableAmount, taxRate, options = {}) {
    const { precision = 2, roundingMethod = 'round' } = options;

    try {
      // Validate inputs
      if (typeof taxableAmount !== 'number' || taxableAmount < 0) {
        throw new Error('Taxable amount must be a non-negative number');
      }
      if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 100) {
        throw new Error('Tax rate must be between 0 and 100');
      }

      // Calculate tax amount
      const taxDecimal = taxRate / 100;
      let taxAmount = taxableAmount * taxDecimal;

      // Apply rounding
      taxAmount = this.applyRounding(taxAmount, precision, roundingMethod);

      return {
        taxAmount,
        taxRate,
        taxableAmount,
        isValid: true,
        method: 'standard',
        breakdown: {
          taxDecimal,
          calculationFormula: `${taxableAmount} × ${taxDecimal} = ${taxAmount}`,
          roundingApplied: roundingMethod,
          precision
        }
      };
    } catch (error) {
      return {
        taxAmount: 0,
        taxRate,
        taxableAmount,
        isValid: false,
        method: 'error',
        breakdown: {
          error: error.message,
          errorType: VALIDATION_ERROR_TYPES.FORMULA_ERROR
        }
      };
    }
  }

  /**
   * Calculate total amount including tax and discounts
   * @param {number} baseAmount - Base amount before tax and discounts
   * @param {number} taxAmount - Tax amount to add
   * @param {number} discountAmount - Discount amount to subtract
   * @param {Object} options - Calculation options
   * @returns {import('../types/validation.js').CalculationResult}
   */
  static calculateTotal(baseAmount, taxAmount = 0, discountAmount = 0, options = {}) {
    const { precision = 2, roundingMethod = 'round' } = options;

    try {
      // Validate inputs
      if (typeof baseAmount !== 'number' || baseAmount < 0) {
        throw new Error('Base amount must be a non-negative number');
      }
      if (typeof taxAmount !== 'number' || taxAmount < 0) {
        throw new Error('Tax amount must be a non-negative number');
      }
      if (typeof discountAmount !== 'number' || discountAmount < 0) {
        throw new Error('Discount amount must be a non-negative number');
      }

      // Calculate total: base + tax - discount
      let totalAmount = baseAmount + taxAmount - discountAmount;

      // Ensure total is not negative
      if (totalAmount < 0) {
        throw new Error('Total amount cannot be negative');
      }

      // Apply rounding
      totalAmount = this.applyRounding(totalAmount, precision, roundingMethod);

      return {
        value: totalAmount,
        isValid: true,
        formula: `${baseAmount} + ${taxAmount} - ${discountAmount} = ${totalAmount}`,
        inputs: {
          baseAmount,
          taxAmount,
          discountAmount
        },
        warnings: []
      };
    } catch (error) {
      return {
        value: 0,
        isValid: false,
        formula: 'Error in calculation',
        inputs: {
          baseAmount,
          taxAmount,
          discountAmount
        },
        warnings: [error.message]
      };
    }
  }

  /**
   * Calculate discount amount based on original amount and discount rate/value
   * @param {number} originalAmount - Original amount before discount
   * @param {number} discountValue - Discount rate (percentage) or fixed amount
   * @param {'percentage' | 'fixed'} discountType - Type of discount
   * @param {Object} options - Calculation options
   * @returns {import('../types/validation.js').DiscountCalculationResult}
   */
  static calculateDiscount(originalAmount, discountValue, discountType = 'percentage', options = {}) {
    const { precision = 2, roundingMethod = 'round' } = options;

    try {
      // Validate inputs
      if (typeof originalAmount !== 'number' || originalAmount < 0) {
        throw new Error('Original amount must be a non-negative number');
      }
      if (typeof discountValue !== 'number' || discountValue < 0) {
        throw new Error('Discount value must be a non-negative number');
      }

      let discountAmount;
      let discountRate;

      if (discountType === 'percentage') {
        if (discountValue > 100) {
          throw new Error('Percentage discount cannot exceed 100%');
        }
        discountRate = discountValue;
        discountAmount = (originalAmount * discountValue) / 100;
      } else if (discountType === 'fixed') {
        if (discountValue > originalAmount) {
          throw new Error('Fixed discount cannot exceed original amount');
        }
        discountAmount = discountValue;
        discountRate = (discountValue / originalAmount) * 100;
      } else {
        throw new Error('Invalid discount type. Must be "percentage" or "fixed"');
      }

      // Apply rounding
      discountAmount = this.applyRounding(discountAmount, precision, roundingMethod);
      const finalAmount = this.applyRounding(originalAmount - discountAmount, precision, roundingMethod);

      return {
        discountAmount,
        discountRate: this.applyRounding(discountRate, 2, roundingMethod),
        originalAmount,
        finalAmount,
        discountType,
        isValid: true
      };
    } catch (error) {
      return {
        discountAmount: 0,
        discountRate: 0,
        originalAmount,
        finalAmount: originalAmount,
        discountType,
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Calculate line item total (quantity × unit price)
   * @param {number} quantity - Item quantity
   * @param {number} unitPrice - Price per unit
   * @param {Object} options - Calculation options
   * @returns {import('../types/validation.js').CalculationResult}
   */
  static calculateLineItemTotal(quantity, unitPrice, options = {}) {
    const { precision = 2, roundingMethod = 'round' } = options;

    try {
      // Validate inputs
      if (typeof quantity !== 'number' || quantity < 0) {
        throw new Error('Quantity must be a non-negative number');
      }
      if (typeof unitPrice !== 'number' || unitPrice < 0) {
        throw new Error('Unit price must be a non-negative number');
      }

      // Calculate line total
      let lineTotal = quantity * unitPrice;

      // Apply rounding
      lineTotal = this.applyRounding(lineTotal, precision, roundingMethod);

      return {
        value: lineTotal,
        isValid: true,
        formula: `${quantity} × ${unitPrice} = ${lineTotal}`,
        inputs: {
          quantity,
          unitPrice
        },
        warnings: []
      };
    } catch (error) {
      return {
        value: 0,
        isValid: false,
        formula: 'Error in calculation',
        inputs: {
          quantity,
          unitPrice
        },
        warnings: [error.message]
      };
    }
  }

  /**
   * Calculate subtotal from line items
   * @param {Array} lineItems - Array of line items with totals
   * @param {Object} options - Calculation options
   * @returns {import('../types/validation.js').CalculationResult}
   */
  static calculateSubtotal(lineItems, options = {}) {
    const { precision = 2, roundingMethod = 'round' } = options;

    try {
      if (!Array.isArray(lineItems)) {
        throw new Error('Line items must be an array');
      }

      let subtotal = 0;
      const warnings = [];

      for (const item of lineItems) {
        if (typeof item.lineTotal !== 'number') {
          warnings.push(`Invalid line total for item ${item.id || 'unknown'}`);
          continue;
        }
        subtotal += item.lineTotal;
      }

      // Apply rounding
      subtotal = this.applyRounding(subtotal, precision, roundingMethod);

      return {
        value: subtotal,
        isValid: true,
        formula: `Sum of ${lineItems.length} line items = ${subtotal}`,
        inputs: {
          lineItemCount: lineItems.length,
          lineItems: lineItems.map(item => ({
            id: item.id,
            lineTotal: item.lineTotal
          }))
        },
        warnings
      };
    } catch (error) {
      return {
        value: 0,
        isValid: false,
        formula: 'Error in calculation',
        inputs: {
          lineItemCount: lineItems?.length || 0
        },
        warnings: [error.message]
      };
    }
  }

  /**
   * Apply rounding to a number with specified precision and method
   * @param {number} value - Value to round
   * @param {number} precision - Decimal places
   * @param {'round' | 'floor' | 'ceil'} method - Rounding method
   * @returns {number}
   */
  static applyRounding(value, precision = 2, method = 'round') {
    const multiplier = Math.pow(10, precision);
    
    switch (method) {
      case 'floor':
        return Math.floor(value * multiplier) / multiplier;
      case 'ceil':
        return Math.ceil(value * multiplier) / multiplier;
      case 'round':
      default:
        return Math.round(value * multiplier) / multiplier;
    }
  }

  /**
   * Compare two financial values with tolerance
   * @param {number} value1 - First value
   * @param {number} value2 - Second value
   * @param {number} tolerance - Acceptable difference (default: 0.01)
   * @returns {boolean}
   */
  static isWithinTolerance(value1, value2, tolerance = 0.01) {
    return Math.abs(value1 - value2) <= tolerance;
  }

  /**
   * Calculate percentage difference between two values
   * @param {number} originalValue - Original value
   * @param {number} comparedValue - Value to compare against
   * @returns {number} Percentage difference
   */
  static calculatePercentageDifference(originalValue, comparedValue) {
    if (originalValue === 0 && comparedValue === 0) {
      return 0;
    }
    if (originalValue === 0) {
      return 100; // 100% difference when original is 0 but compared is not
    }
    return Math.abs((comparedValue - originalValue) / originalValue) * 100;
  }

  /**
   * Validate currency format and convert to number
   * @param {string|number} value - Currency value to validate
   * @param {string} currencyCode - Currency code (e.g., 'USD')
   * @returns {number|null} Parsed number or null if invalid
   */
  static parseCurrencyValue(value, currencyCode = 'USD') {
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    // Remove currency symbols and formatting
    const cleanValue = value
      .replace(/[$€£¥₹]/g, '') // Remove common currency symbols
      .replace(/[,\s]/g, '')   // Remove commas and spaces
      .trim();

    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Format number as currency string
   * @param {number} value - Numeric value
   * @param {string} currencyCode - Currency code
   * @param {string} locale - Locale for formatting
   * @returns {string} Formatted currency string
   */
  static formatCurrency(value, currencyCode = 'USD', locale = 'en-US') {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value);
    } catch (error) {
      // Fallback formatting
      return `${currencyCode} ${value.toFixed(2)}`;
    }
  }
}

export default FinancialCalculations;