/**
 * Validation Engine Type Definitions
 * 
 * This file contains all type definitions related to invoice validation,
 * discrepancy detection, and validation results for the Invoice Validation System.
 */

/**
 * Validation result for a specific field comparison
 * @typedef {Object} ValidationResult
 * @property {string} recordId - ID of the invoice record being validated
 * @property {string} field - Field name that was validated
 * @property {number|string} originalValue - Original value from the file
 * @property {number|string} calculatedValue - System-calculated value
 * @property {number} discrepancy - Absolute difference between values
 * @property {number} discrepancyPercentage - Percentage difference
 * @property {'low' | 'medium' | 'high' | 'critical'} severity - Severity level of the discrepancy
 * @property {string} message - Human-readable description of the discrepancy
 * @property {Date} validatedAt - When the validation was performed
 * @property {string} validatedBy - User or system that performed validation
 */

/**
 * Comprehensive validation summary for a batch of records
 * @typedef {Object} ValidationSummary
 * @property {number} totalRecords - Total number of records processed
 * @property {number} validRecords - Number of records with no discrepancies
 * @property {number} invalidRecords - Number of records with discrepancies
 * @property {number} totalDiscrepancies - Total number of discrepancies found
 * @property {number} criticalCount - Number of critical severity discrepancies
 * @property {number} highSeverityCount - Number of high severity discrepancies
 * @property {number} mediumSeverityCount - Number of medium severity discrepancies
 * @property {number} lowSeverityCount - Number of low severity discrepancies
 * @property {number} totalDiscrepancyAmount - Sum of all discrepancy amounts
 * @property {number} averageDiscrepancyAmount - Average discrepancy amount
 * @property {number} maxDiscrepancyAmount - Largest single discrepancy amount
 * @property {Date} validationStartTime - When validation process started
 * @property {Date} validationEndTime - When validation process completed
 * @property {number} processingTimeMs - Total processing time in milliseconds
 * @property {string} batchId - Unique identifier for this validation batch
 */

/**
 * Configuration for validation thresholds and rules
 * @typedef {Object} ValidationConfig
 * @property {Object} thresholds - Severity thresholds
 * @property {number} thresholds.low - Low severity threshold (percentage)
 * @property {number} thresholds.medium - Medium severity threshold (percentage)
 * @property {number} thresholds.high - High severity threshold (percentage)
 * @property {number} thresholds.critical - Critical severity threshold (percentage)
 * @property {Object} tolerances - Acceptable tolerance levels
 * @property {number} tolerances.taxCalculation - Tax calculation tolerance (percentage)
 * @property {number} tolerances.totalCalculation - Total calculation tolerance (percentage)
 * @property {number} tolerances.discountCalculation - Discount calculation tolerance (percentage)
 * @property {Object} rules - Validation rule configuration
 * @property {boolean} rules.validateTaxCalculation - Whether to validate tax calculations
 * @property {boolean} rules.validateTotalCalculation - Whether to validate total calculations
 * @property {boolean} rules.validateDiscountCalculation - Whether to validate discount calculations
 * @property {boolean} rules.validateLineItemTotals - Whether to validate line item totals
 * @property {boolean} rules.strictMode - Whether to use strict validation mode
 */

/**
 * Financial calculation utilities result
 * @typedef {Object} CalculationResult
 * @property {number} value - Calculated value
 * @property {boolean} isValid - Whether the calculation is valid
 * @property {string} formula - Formula used for calculation
 * @property {Object} inputs - Input values used in calculation
 * @property {string[]} warnings - Any warnings generated during calculation
 */

/**
 * Tax calculation specific result
 * @typedef {Object} TaxCalculationResult
 * @property {number} taxAmount - Calculated tax amount
 * @property {number} taxRate - Tax rate used
 * @property {number} taxableAmount - Amount subject to tax
 * @property {boolean} isValid - Whether tax calculation is valid
 * @property {string} method - Tax calculation method used
 * @property {Object} breakdown - Detailed breakdown of tax calculation
 */

/**
 * Discount calculation result
 * @typedef {Object} DiscountCalculationResult
 * @property {number} discountAmount - Calculated discount amount
 * @property {number} discountRate - Discount rate applied
 * @property {number} originalAmount - Original amount before discount
 * @property {number} finalAmount - Final amount after discount
 * @property {'percentage' | 'fixed'} discountType - Type of discount applied
 * @property {boolean} isValid - Whether discount calculation is valid
 */

/**
 * Line item validation result
 * @typedef {Object} LineItemValidationResult
 * @property {string} lineItemId - ID of the line item
 * @property {ValidationResult[]} fieldValidations - Validation results for each field
 * @property {CalculationResult} totalCalculation - Line total calculation result
 * @property {TaxCalculationResult} taxCalculation - Tax calculation result
 * @property {boolean} isValid - Whether the entire line item is valid
 * @property {string[]} errors - Any errors found in the line item
 */

/**
 * Batch validation progress tracking
 * @typedef {Object} ValidationProgress
 * @property {string} batchId - Unique batch identifier
 * @property {number} totalRecords - Total records to validate
 * @property {number} processedRecords - Records processed so far
 * @property {number} validRecords - Valid records found so far
 * @property {number} invalidRecords - Invalid records found so far
 * @property {number} currentRecord - Currently processing record number
 * @property {'pending' | 'processing' | 'completed' | 'failed'} status - Current status
 * @property {Date} startTime - When validation started
 * @property {Date} estimatedEndTime - Estimated completion time
 * @property {string} currentOperation - Description of current operation
 * @property {number} progressPercentage - Progress as percentage (0-100)
 */

/**
 * Validation engine configuration and state
 * @typedef {Object} ValidationEngineState
 * @property {ValidationConfig} config - Current validation configuration
 * @property {ValidationProgress} progress - Current validation progress
 * @property {ValidationResult[]} results - All validation results
 * @property {ValidationSummary} summary - Current validation summary
 * @property {boolean} isValidating - Whether validation is currently running
 * @property {string|null} error - Current error message if any
 * @property {Date} lastValidationTime - When last validation was performed
 */

// Default validation configuration
export const DEFAULT_VALIDATION_CONFIG = {
  thresholds: {
    low: 1.0,      // 1% difference
    medium: 5.0,   // 5% difference
    high: 10.0,    // 10% difference
    critical: 20.0 // 20% difference
  },
  tolerances: {
    taxCalculation: 0.01,      // 1 cent tolerance for tax calculations
    totalCalculation: 0.01,    // 1 cent tolerance for total calculations
    discountCalculation: 0.01  // 1 cent tolerance for discount calculations
  },
  rules: {
    validateTaxCalculation: true,
    validateTotalCalculation: true,
    validateDiscountCalculation: true,
    validateLineItemTotals: true,
    strictMode: false
  }
};

// Severity level mappings
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Validation field types
export const VALIDATION_FIELDS = {
  TAX_AMOUNT: 'taxAmount',
  TOTAL_AMOUNT: 'totalAmount',
  DISCOUNT_AMOUNT: 'discountAmount',
  LINE_ITEM_TOTAL: 'lineItemTotal',
  SUBTOTAL: 'subtotal'
};

// Validation error types
export const VALIDATION_ERROR_TYPES = {
  CALCULATION_MISMATCH: 'calculation_mismatch',
  MISSING_REQUIRED_FIELD: 'missing_required_field',
  INVALID_DATA_TYPE: 'invalid_data_type',
  OUT_OF_RANGE: 'out_of_range',
  FORMULA_ERROR: 'formula_error',
  ROUNDING_DISCREPANCY: 'rounding_discrepancy'
};

/**
 * Create an empty validation result
 * @param {string} recordId - Record ID
 * @param {string} field - Field name
 * @returns {ValidationResult}
 */
export const createEmptyValidationResult = (recordId, field) => ({
  recordId,
  field,
  originalValue: 0,
  calculatedValue: 0,
  discrepancy: 0,
  discrepancyPercentage: 0,
  severity: SEVERITY_LEVELS.LOW,
  message: '',
  validatedAt: new Date().toISOString(),
  validatedBy: 'system'
});

/**
 * Create an empty validation summary
 * @returns {ValidationSummary}
 */
export const createEmptyValidationSummary = () => ({
  totalRecords: 0,
  validRecords: 0,
  invalidRecords: 0,
  totalDiscrepancies: 0,
  criticalCount: 0,
  highSeverityCount: 0,
  mediumSeverityCount: 0,
  lowSeverityCount: 0,
  totalDiscrepancyAmount: 0,
  averageDiscrepancyAmount: 0,
  maxDiscrepancyAmount: 0,
  validationStartTime: new Date().toISOString(),
  validationEndTime: new Date().toISOString(),
  processingTimeMs: 0,
  batchId: ''
});