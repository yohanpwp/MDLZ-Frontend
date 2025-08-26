import Papa from 'papaparse';
import { createEmptyInvoiceRecord, CSV_COLUMN_MAPPINGS, VALIDATION_RULES } from '../types/invoice';

/**
 * CSV Parser utility for processing invoice CSV files
 */
export class CsvParser {
  constructor() {
    this.columnMappings = CSV_COLUMN_MAPPINGS.standard;
  }

  /**
   * Parses CSV file and converts to invoice records
   * @param {File} file - CSV file to parse
   * @returns {Promise<FileProcessingResult>} - Processing result
   */
  async parseFile(file) {
    return new Promise((resolve) => {
      const errors = [];
      const records = [];
      let rowIndex = 0;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => this.normalizeHeader(header),
        step: (result, parser) => {
          rowIndex++;
          
          if (result.errors.length > 0) {
            result.errors.forEach(error => {
              errors.push({
                row: rowIndex,
                field: 'parsing',
                message: error.message,
                value: '',
                type: 'parsing'
              });
            });
            return;
          }

          try {
            const record = this.transformRowToRecord(result.data, rowIndex);
            const validationErrors = this.validateRecord(record, rowIndex);
            
            if (validationErrors.length > 0) {
              errors.push(...validationErrors);
              record.status = 'invalid';
            } else {
              record.status = 'valid';
            }
            
            records.push(record);
          } catch (error) {
            errors.push({
              row: rowIndex,
              field: 'transformation',
              message: error.message,
              value: JSON.stringify(result.data),
              type: 'format'
            });
          }
        },
        complete: () => {
          const validRecords = records.filter(r => r.status === 'valid').length;
          const invalidRecords = records.length - validRecords;

          resolve({
            success: errors.length === 0,
            records,
            totalRecords: records.length,
            validRecords,
            invalidRecords,
            errors,
            metadata: {
              parser: 'csv',
              fileName: file.name,
              fileSize: file.size,
              processedAt: new Date().toISOString()
            }
          });
        },
        error: (error) => {
          resolve({
            success: false,
            records: [],
            totalRecords: 0,
            validRecords: 0,
            invalidRecords: 0,
            errors: [{
              row: 0,
              field: 'file',
              message: `Failed to parse CSV: ${error.message}`,
              value: '',
              type: 'parsing'
            }],
            metadata: {
              parser: 'csv',
              fileName: file.name,
              fileSize: file.size,
              processedAt: new Date().toISOString()
            }
          });
        }
      });
    });
  }

  /**
   * Normalizes CSV headers to match expected field names
   * @param {string} header - Original header
   * @returns {string} - Normalized header
   */
  normalizeHeader(header) {
    const normalized = header.toLowerCase().trim().replace(/\s+/g, '_');
    
    // Find matching field name
    for (const [fieldName, variations] of Object.entries(this.columnMappings)) {
      if (variations.includes(normalized)) {
        return fieldName;
      }
    }
    
    return normalized;
  }

  /**
   * Transforms CSV row data to invoice record
   * @param {Object} rowData - Raw CSV row data
   * @param {number} rowIndex - Row index for error reporting
   * @returns {InvoiceRecord} - Transformed invoice record
   */
  transformRowToRecord(rowData, rowIndex) {
    const record = createEmptyInvoiceRecord();
    record.id = `csv-${Date.now()}-${rowIndex}`;

    // Map basic fields
    record.invoiceNumber = this.getStringValue(rowData.invoiceNumber);
    record.customerName = this.getStringValue(rowData.customerName);
    record.customerCode = this.getStringValue(rowData.customerCode);
    record.currency = this.getStringValue(rowData.currency) || 'USD';
    
    // Map numeric fields
    record.amount = this.getNumericValue(rowData.amount);
    record.taxRate = this.getNumericValue(rowData.taxRate);
    record.taxAmount = this.getNumericValue(rowData.taxAmount);
    record.discountAmount = this.getNumericValue(rowData.discountAmount);
    record.totalAmount = this.getNumericValue(rowData.totalAmount);
    
    // Map date fields
    record.date = this.getDateValue(rowData.date);
    record.dueDate = this.getDateValue(rowData.dueDate);

    // Calculate missing values if possible
    this.calculateMissingValues(record);

    // Store original row data in metadata
    record.metadata = {
      originalRow: rowData,
      rowIndex
    };

    return record;
  }

  /**
   * Gets string value from row data
   * @param {any} value - Raw value
   * @returns {string} - Cleaned string value
   */
  getStringValue(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }

  /**
   * Gets numeric value from row data
   * @param {any} value - Raw value
   * @returns {number} - Parsed numeric value
   */
  getNumericValue(value) {
    if (value === null || value === undefined || value === '') return 0;
    
    // Remove currency symbols and commas
    const cleaned = String(value).replace(/[$,€£¥]/g, '').trim();
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Gets date value from row data
   * @param {any} value - Raw value
   * @returns {string} - ISO date string
   */
  getDateValue(value) {
    if (!value) return '';
    
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch {
      return '';
    }
  }

  /**
   * Calculates missing values based on available data
   * @param {InvoiceRecord} record - Invoice record to update
   */
  calculateMissingValues(record) {
    // Calculate tax amount if missing but tax rate is available
    if (record.taxAmount === 0 && record.taxRate > 0 && record.amount > 0) {
      record.taxAmount = (record.amount * record.taxRate) / 100;
    }

    // Calculate tax rate if missing but tax amount is available
    if (record.taxRate === 0 && record.taxAmount > 0 && record.amount > 0) {
      record.taxRate = (record.taxAmount / record.amount) * 100;
    }

    // Calculate total amount if missing
    if (record.totalAmount === 0 && record.amount > 0) {
      record.totalAmount = record.amount + record.taxAmount - record.discountAmount;
    }

    // Validate calculated total
    const expectedTotal = record.amount + record.taxAmount - record.discountAmount;
    if (Math.abs(record.totalAmount - expectedTotal) > 0.01) {
      // Mark as potential discrepancy for validation
      record.metadata.calculationDiscrepancy = {
        expected: expectedTotal,
        actual: record.totalAmount,
        difference: record.totalAmount - expectedTotal
      };
    }
  }

  /**
   * Validates invoice record against business rules
   * @param {InvoiceRecord} record - Record to validate
   * @param {number} rowIndex - Row index for error reporting
   * @returns {ProcessingError[]} - Array of validation errors
   */
  validateRecord(record, rowIndex) {
    const errors = [];

    for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
      const value = record[field];

      // Check required fields
      if (rules.required && (!value || value === '')) {
        errors.push({
          row: rowIndex,
          field,
          message: `${field} is required`,
          value: String(value),
          type: 'validation'
        });
        continue;
      }

      // Skip validation if field is empty and not required
      if (!value && !rules.required) continue;

      // Type validation
      if (rules.type === 'number' && (isNaN(value) || typeof value !== 'number')) {
        errors.push({
          row: rowIndex,
          field,
          message: `${field} must be a valid number`,
          value: String(value),
          type: 'validation'
        });
        continue;
      }

      if (rules.type === 'date' && !this.isValidDate(value)) {
        errors.push({
          row: rowIndex,
          field,
          message: `${field} must be a valid date`,
          value: String(value),
          type: 'validation'
        });
        continue;
      }

      // Range validation for numbers
      if (rules.type === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({
            row: rowIndex,
            field,
            message: `${field} must be at least ${rules.min}`,
            value: String(value),
            type: 'validation'
          });
        }

        if (rules.max !== undefined && value > rules.max) {
          errors.push({
            row: rowIndex,
            field,
            message: `${field} must not exceed ${rules.max}`,
            value: String(value),
            type: 'validation'
          });
        }
      }

      // String length validation
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push({
            row: rowIndex,
            field,
            message: `${field} must be at least ${rules.minLength} characters`,
            value: String(value),
            type: 'validation'
          });
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({
            row: rowIndex,
            field,
            message: `${field} must not exceed ${rules.maxLength} characters`,
            value: String(value),
            type: 'validation'
          });
        }
      }

      // Pattern validation
      if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
        errors.push({
          row: rowIndex,
          field,
          message: `${field} format is invalid`,
          value: String(value),
          type: 'validation'
        });
      }
    }

    return errors;
  }

  /**
   * Checks if a value is a valid date
   * @param {any} value - Value to check
   * @returns {boolean} - True if valid date
   */
  isValidDate(value) {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}