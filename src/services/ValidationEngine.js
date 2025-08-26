/**
 * ValidationEngine Service
 * 
 * Core service for validating invoice data, detecting discrepancies,
 * and generating validation results with comprehensive financial calculations.
 */

import { FinancialCalculations } from '../utils/FinancialCalculations.js';
import {
  DEFAULT_VALIDATION_CONFIG,
  SEVERITY_LEVELS,
  VALIDATION_FIELDS,
  VALIDATION_ERROR_TYPES,
  createEmptyValidationResult,
  createEmptyValidationSummary
} from '../types/validation.js';

/**
 * ValidationEngine class for comprehensive invoice validation
 */
export class ValidationEngine {
  constructor(config = DEFAULT_VALIDATION_CONFIG) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
    this.results = [];
    this.summary = createEmptyValidationSummary();
    this.isValidating = false;
  }

  /**
   * Validate a single invoice record
   * @param {import('../types/invoice.js').InvoiceRecord} record - Invoice record to validate
   * @returns {Promise<import('../types/validation.js').ValidationResult[]>}
   */
  async validateRecord(record) {
    const validationResults = [];

    try {
      // Validate tax calculation
      if (this.config.rules.validateTaxCalculation) {
        const taxValidation = this.validateTaxCalculation(record);
        if (taxValidation) {
          validationResults.push(taxValidation);
        }
      }

      // Validate total calculation
      if (this.config.rules.validateTotalCalculation) {
        const totalValidation = this.validateTotalCalculation(record);
        if (totalValidation) {
          validationResults.push(totalValidation);
        }
      }

      // Validate discount calculation
      if (this.config.rules.validateDiscountCalculation && record.discountAmount > 0) {
        const discountValidation = this.validateDiscountCalculation(record);
        if (discountValidation) {
          validationResults.push(discountValidation);
        }
      }

      // Validate line item totals
      if (this.config.rules.validateLineItemTotals && record.lineItems?.length > 0) {
        const lineItemValidations = this.validateLineItems(record);
        validationResults.push(...lineItemValidations);
      }

      return validationResults;
    } catch (error) {
      console.error('Error validating record:', error);
      return [{
        ...createEmptyValidationResult(record.id, 'general'),
        severity: SEVERITY_LEVELS.CRITICAL,
        message: `Validation error: ${error.message}`,
        originalValue: 'error',
        calculatedValue: 'error'
      }];
    }
  }

  /**
   * Validate multiple invoice records in batch
   * @param {import('../types/invoice.js').InvoiceRecord[]} records - Array of invoice records
   * @param {Function} progressCallback - Optional progress callback
   * @returns {Promise<import('../types/validation.js').ValidationSummary>}
   */
  async validateBatch(records, progressCallback = null) {
    this.isValidating = true;
    const batchId = this.generateBatchId();
    const startTime = new Date();

    try {
      this.results = [];
      this.summary = {
        ...createEmptyValidationSummary(),
        batchId,
        validationStartTime: startTime,
        totalRecords: records.length
      };

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        
        // Report progress
        if (progressCallback) {
          progressCallback({
            batchId,
            totalRecords: records.length,
            processedRecords: i,
            currentRecord: i + 1,
            status: 'processing',
            progressPercentage: Math.round((i / records.length) * 100),
            currentOperation: `Validating record ${record.invoiceNumber || record.id}`
          });
        }

        // Validate individual record
        const recordValidations = await this.validateRecord(record);
        this.results.push(...recordValidations);

        // Update summary counts
        if (recordValidations.length === 0) {
          this.summary.validRecords++;
        } else {
          this.summary.invalidRecords++;
          this.summary.totalDiscrepancies += recordValidations.length;

          // Count by severity
          recordValidations.forEach(validation => {
            switch (validation.severity) {
              case SEVERITY_LEVELS.CRITICAL:
                this.summary.criticalCount++;
                break;
              case SEVERITY_LEVELS.HIGH:
                this.summary.highSeverityCount++;
                break;
              case SEVERITY_LEVELS.MEDIUM:
                this.summary.mediumSeverityCount++;
                break;
              case SEVERITY_LEVELS.LOW:
                this.summary.lowSeverityCount++;
                break;
            }

            // Add to total discrepancy amount
            if (typeof validation.discrepancy === 'number') {
              this.summary.totalDiscrepancyAmount += validation.discrepancy;
            }
          });
        }

        // Small delay to prevent blocking UI
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }

      // Finalize summary
      const endTime = new Date();
      this.summary.validationEndTime = endTime;
      this.summary.processingTimeMs = endTime.getTime() - startTime.getTime();
      
      if (this.summary.totalDiscrepancies > 0) {
        this.summary.averageDiscrepancyAmount = this.summary.totalDiscrepancyAmount / this.summary.totalDiscrepancies;
        this.summary.maxDiscrepancyAmount = Math.max(...this.results.map(r => r.discrepancy || 0));
      }

      // Final progress report
      if (progressCallback) {
        progressCallback({
          batchId,
          totalRecords: records.length,
          processedRecords: records.length,
          currentRecord: records.length,
          status: 'completed',
          progressPercentage: 100,
          currentOperation: 'Validation completed'
        });
      }

      return this.summary;
    } catch (error) {
      console.error('Batch validation error:', error);
      
      if (progressCallback) {
        progressCallback({
          batchId,
          status: 'failed',
          currentOperation: `Validation failed: ${error.message}`
        });
      }

      throw error;
    } finally {
      this.isValidating = false;
    }
  }

  /**
   * Validate tax calculation for a record
   * @param {import('../types/invoice.js').InvoiceRecord} record 
   * @returns {import('../types/validation.js').ValidationResult|null}
   */
  validateTaxCalculation(record) {
    if (!record.taxRate || record.taxRate === 0) {
      return null; // No tax to validate
    }

    const taxCalculation = FinancialCalculations.calculateTax(
      record.amount,
      record.taxRate,
      { precision: 2, roundingMethod: 'round' }
    );

    if (!taxCalculation.isValid) {
      return {
        ...createEmptyValidationResult(record.id, VALIDATION_FIELDS.TAX_AMOUNT),
        severity: SEVERITY_LEVELS.CRITICAL,
        message: 'Tax calculation failed',
        originalValue: record.taxAmount,
        calculatedValue: 'error'
      };
    }

    const discrepancy = Math.abs(record.taxAmount - taxCalculation.taxAmount);
    
    if (discrepancy <= this.config.tolerances.taxCalculation) {
      return null; // Within tolerance
    }

    const discrepancyPercentage = FinancialCalculations.calculatePercentageDifference(
      record.taxAmount,
      taxCalculation.taxAmount
    );

    return {
      ...createEmptyValidationResult(record.id, VALIDATION_FIELDS.TAX_AMOUNT),
      originalValue: record.taxAmount,
      calculatedValue: taxCalculation.taxAmount,
      discrepancy,
      discrepancyPercentage,
      severity: this.determineSeverity(discrepancyPercentage),
      message: `Tax calculation discrepancy: Expected ${taxCalculation.taxAmount}, found ${record.taxAmount}`
    };
  }

  /**
   * Validate total calculation for a record
   * @param {import('../types/invoice.js').InvoiceRecord} record 
   * @returns {import('../types/validation.js').ValidationResult|null}
   */
  validateTotalCalculation(record) {
    const totalCalculation = FinancialCalculations.calculateTotal(
      record.amount,
      record.taxAmount,
      record.discountAmount,
      { precision: 2, roundingMethod: 'round' }
    );

    if (!totalCalculation.isValid) {
      return {
        ...createEmptyValidationResult(record.id, VALIDATION_FIELDS.TOTAL_AMOUNT),
        severity: SEVERITY_LEVELS.CRITICAL,
        message: 'Total calculation failed',
        originalValue: record.totalAmount,
        calculatedValue: 'error'
      };
    }

    const discrepancy = Math.abs(record.totalAmount - totalCalculation.value);
    
    if (discrepancy <= this.config.tolerances.totalCalculation) {
      return null; // Within tolerance
    }

    const discrepancyPercentage = FinancialCalculations.calculatePercentageDifference(
      record.totalAmount,
      totalCalculation.value
    );

    return {
      ...createEmptyValidationResult(record.id, VALIDATION_FIELDS.TOTAL_AMOUNT),
      originalValue: record.totalAmount,
      calculatedValue: totalCalculation.value,
      discrepancy,
      discrepancyPercentage,
      severity: this.determineSeverity(discrepancyPercentage),
      message: `Total calculation discrepancy: Expected ${totalCalculation.value}, found ${record.totalAmount}`
    };
  }

  /**
   * Validate discount calculation for a record
   * @param {import('../types/invoice.js').InvoiceRecord} record 
   * @returns {import('../types/validation.js').ValidationResult|null}
   */
  validateDiscountCalculation(record) {
    if (!record.discountAmount || record.discountAmount === 0) {
      return null; // No discount to validate
    }

    // Try to determine discount type and rate from the data
    const discountPercentage = (record.discountAmount / record.amount) * 100;
    
    const discountCalculation = FinancialCalculations.calculateDiscount(
      record.amount,
      discountPercentage,
      'percentage',
      { precision: 2, roundingMethod: 'round' }
    );

    if (!discountCalculation.isValid) {
      return {
        ...createEmptyValidationResult(record.id, VALIDATION_FIELDS.DISCOUNT_AMOUNT),
        severity: SEVERITY_LEVELS.CRITICAL,
        message: 'Discount calculation failed',
        originalValue: record.discountAmount,
        calculatedValue: 'error'
      };
    }

    const discrepancy = Math.abs(record.discountAmount - discountCalculation.discountAmount);
    
    if (discrepancy <= this.config.tolerances.discountCalculation) {
      return null; // Within tolerance
    }

    const discrepancyPercentage = FinancialCalculations.calculatePercentageDifference(
      record.discountAmount,
      discountCalculation.discountAmount
    );

    return {
      ...createEmptyValidationResult(record.id, VALIDATION_FIELDS.DISCOUNT_AMOUNT),
      originalValue: record.discountAmount,
      calculatedValue: discountCalculation.discountAmount,
      discrepancy,
      discrepancyPercentage,
      severity: this.determineSeverity(discrepancyPercentage),
      message: `Discount calculation discrepancy: Expected ${discountCalculation.discountAmount}, found ${record.discountAmount}`
    };
  }

  /**
   * Validate line items for a record
   * @param {import('../types/invoice.js').InvoiceRecord} record 
   * @returns {import('../types/validation.js').ValidationResult[]}
   */
  validateLineItems(record) {
    const validationResults = [];

    if (!record.lineItems || record.lineItems.length === 0) {
      return validationResults;
    }

    record.lineItems.forEach((lineItem, index) => {
      // Validate line item total calculation
      const lineItemCalculation = FinancialCalculations.calculateLineItemTotal(
        lineItem.quantity,
        lineItem.unitPrice,
        { precision: 2, roundingMethod: 'round' }
      );

      if (!lineItemCalculation.isValid) {
        validationResults.push({
          ...createEmptyValidationResult(record.id, `${VALIDATION_FIELDS.LINE_ITEM_TOTAL}_${index}`),
          severity: SEVERITY_LEVELS.HIGH,
          message: `Line item ${index + 1} calculation failed`,
          originalValue: lineItem.lineTotal,
          calculatedValue: 'error'
        });
        return;
      }

      const discrepancy = Math.abs(lineItem.lineTotal - lineItemCalculation.value);
      
      if (discrepancy > this.config.tolerances.totalCalculation) {
        const discrepancyPercentage = FinancialCalculations.calculatePercentageDifference(
          lineItem.lineTotal,
          lineItemCalculation.value
        );

        validationResults.push({
          ...createEmptyValidationResult(record.id, `${VALIDATION_FIELDS.LINE_ITEM_TOTAL}_${index}`),
          originalValue: lineItem.lineTotal,
          calculatedValue: lineItemCalculation.value,
          discrepancy,
          discrepancyPercentage,
          severity: this.determineSeverity(discrepancyPercentage),
          message: `Line item ${index + 1} total discrepancy: Expected ${lineItemCalculation.value}, found ${lineItem.lineTotal}`
        });
      }
    });

    return validationResults;
  }

  /**
   * Determine severity level based on discrepancy percentage
   * @param {number} discrepancyPercentage 
   * @returns {string}
   */
  determineSeverity(discrepancyPercentage) {
    if (discrepancyPercentage >= this.config.thresholds.critical) {
      return SEVERITY_LEVELS.CRITICAL;
    } else if (discrepancyPercentage >= this.config.thresholds.high) {
      return SEVERITY_LEVELS.HIGH;
    } else if (discrepancyPercentage >= this.config.thresholds.medium) {
      return SEVERITY_LEVELS.MEDIUM;
    } else {
      return SEVERITY_LEVELS.LOW;
    }
  }

  /**
   * Generate unique batch ID
   * @returns {string}
   */
  generateBatchId() {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get validation results
   * @returns {import('../types/validation.js').ValidationResult[]}
   */
  getResults() {
    return this.results;
  }

  /**
   * Get validation summary
   * @returns {import('../types/validation.js').ValidationSummary}
   */
  getSummary() {
    return this.summary;
  }

  /**
   * Update validation configuration
   * @param {import('../types/validation.js').ValidationConfig} newConfig 
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Clear validation results
   */
  clearResults() {
    this.results = [];
    this.summary = createEmptyValidationSummary();
  }

  /**
   * Filter results by severity
   * @param {string} severity 
   * @returns {import('../types/validation.js').ValidationResult[]}
   */
  getResultsBySeverity(severity) {
    return this.results.filter(result => result.severity === severity);
  }

  /**
   * Filter results by record ID
   * @param {string} recordId 
   * @returns {import('../types/validation.js').ValidationResult[]}
   */
  getResultsByRecord(recordId) {
    return this.results.filter(result => result.recordId === recordId);
  }

  /**
   * Get validation statistics
   * @returns {Object}
   */
  getStatistics() {
    return {
      totalValidations: this.results.length,
      severityBreakdown: {
        critical: this.summary.criticalCount,
        high: this.summary.highSeverityCount,
        medium: this.summary.mediumSeverityCount,
        low: this.summary.lowSeverityCount
      },
      recordBreakdown: {
        valid: this.summary.validRecords,
        invalid: this.summary.invalidRecords,
        total: this.summary.totalRecords
      },
      financialImpact: {
        totalDiscrepancyAmount: this.summary.totalDiscrepancyAmount,
        averageDiscrepancyAmount: this.summary.averageDiscrepancyAmount,
        maxDiscrepancyAmount: this.summary.maxDiscrepancyAmount
      },
      performance: {
        processingTimeMs: this.summary.processingTimeMs,
        recordsPerSecond: this.summary.processingTimeMs > 0 
          ? Math.round((this.summary.totalRecords / this.summary.processingTimeMs) * 1000)
          : 0
      }
    };
  }
}

// Export singleton instance
export default new ValidationEngine();