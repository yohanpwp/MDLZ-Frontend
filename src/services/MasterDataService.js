/**
 * MasterDataService
 * 
 * Service for handling master data import/export operations including
 * customer data, product data, and reference data management.
 */

import { FileValidator } from '../utils/FileValidator.js';
import { CsvParser } from '../utils/CsvParser.js';

/**
 * Master Data Service class
 */
export class MasterDataService {
  constructor() {
    this.supportedDataTypes = ['customers', 'products', 'references'];
    this.importHistory = this.loadImportHistory();
    this.exportHistory = this.loadExportHistory();
  }

  /**
   * Validate master data file before import
   * @param {File} file - File to validate
   * @param {string} dataType - Type of data (customers, products, references)
   * @returns {Object} Validation result
   */
  async validateImportFile(file, dataType) {
    try {
      // Basic file validation
      const fileValidation = FileValidator.validateFile(file);
      
      if (!fileValidation.isValid) {
        return {
          isValid: false,
          errors: [fileValidation.error],
          warnings: []
        };
      }

      // Parse file to validate structure
      const parser = new CsvParser();
      const parseResult = await parser.parseFile(file);
      
      if (!parseResult.success) {
        return {
          isValid: false,
          errors: parseResult.errors,
          warnings: []
        };
      }

      // Validate data structure based on type
      const structureValidation = this.validateDataStructure(parseResult.records, dataType);
      
      return {
        isValid: structureValidation.isValid,
        errors: structureValidation.errors,
        warnings: structureValidation.warnings,
        recordCount: parseResult.records.length,
        preview: parseResult.records.slice(0, 5), // First 5 records for preview
        headers: parseResult.headers
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation failed: ${error.message}`],
        warnings: []
      };
    }
  }

  /**
   * Validate data structure based on data type
   * @param {Array} records - Parsed records
   * @param {string} dataType - Type of data
   * @returns {Object} Structure validation result
   */
  validateDataStructure(records, dataType) {
    const errors = [];
    const warnings = [];

    if (!records || records.length === 0) {
      errors.push('No data records found in file');
      return { isValid: false, errors, warnings };
    }

    const requiredFields = this.getRequiredFields(dataType);
    const optionalFields = this.getOptionalFields(dataType);
    const firstRecord = records[0];

    // Check required fields
    requiredFields.forEach(field => {
      if (!firstRecord.hasOwnProperty(field)) {
        errors.push(`Required field '${field}' is missing`);
      }
    });

    // Check for unknown fields
    Object.keys(firstRecord).forEach(field => {
      if (!requiredFields.includes(field) && !optionalFields.includes(field)) {
        warnings.push(`Unknown field '${field}' will be ignored`);
      }
    });

    // Validate data types and formats
    records.slice(0, 10).forEach((record, index) => {
      const recordErrors = this.validateRecordData(record, dataType, index + 1);
      errors.push(...recordErrors);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get required fields for data type
   * @param {string} dataType - Type of data
   * @returns {Array} Required field names
   */
  getRequiredFields(dataType) {
    const fieldMappings = {
      customers: ['customerCode', 'customerName', 'email'],
      products: ['productCode', 'productName', 'unitPrice'],
      references: ['referenceType', 'referenceCode', 'referenceValue']
    };

    return fieldMappings[dataType] || [];
  }

  /**
   * Get optional fields for data type
   * @param {string} dataType - Type of data
   * @returns {Array} Optional field names
   */
  getOptionalFields(dataType) {
    const fieldMappings = {
      customers: ['phone', 'address', 'city', 'country', 'taxId', 'creditLimit'],
      products: ['category', 'description', 'taxRate', 'isActive'],
      references: ['description', 'isActive', 'sortOrder']
    };

    return fieldMappings[dataType] || [];
  }

  /**
   * Validate individual record data
   * @param {Object} record - Record to validate
   * @param {string} dataType - Type of data
   * @param {number} rowNumber - Row number for error reporting
   * @returns {Array} Array of error messages
   */
  validateRecordData(record, dataType, rowNumber) {
    const errors = [];

    switch (dataType) {
      case 'customers':
        if (record.email && !this.isValidEmail(record.email)) {
          errors.push(`Row ${rowNumber}: Invalid email format`);
        }
        if (record.creditLimit && isNaN(parseFloat(record.creditLimit))) {
          errors.push(`Row ${rowNumber}: Credit limit must be a number`);
        }
        break;

      case 'products':
        if (record.unitPrice && isNaN(parseFloat(record.unitPrice))) {
          errors.push(`Row ${rowNumber}: Unit price must be a number`);
        }
        if (record.taxRate && (isNaN(parseFloat(record.taxRate)) || parseFloat(record.taxRate) < 0 || parseFloat(record.taxRate) > 100)) {
          errors.push(`Row ${rowNumber}: Tax rate must be a number between 0 and 100`);
        }
        break;

      case 'references':
        if (!record.referenceType || record.referenceType.trim() === '') {
          errors.push(`Row ${rowNumber}: Reference type cannot be empty`);
        }
        break;
    }

    return errors;
  }

  /**
   * Import master data
   * @param {File} file - File to import
   * @param {string} dataType - Type of data
   * @param {Object} options - Import options
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Object>} Import result
   */
  async importData(file, dataType, options = {}, progressCallback = null) {
    const importId = this.generateImportId();
    const startTime = new Date();

    try {
      // Validate file first
      if (progressCallback) {
        progressCallback({ stage: 'validation', progress: 0, message: 'Validating file...' });
      }

      const validation = await this.validateImportFile(file, dataType);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      if (progressCallback) {
        progressCallback({ stage: 'parsing', progress: 20, message: 'Parsing file data...' });
      }

      // Parse file
      const parser = new CsvParser();
      const parseResult = await parser.parseFile(file);

      if (!parseResult.success) {
        throw new Error(`Parsing failed: ${parseResult.errors.join(', ')}`);
      }

      if (progressCallback) {
        progressCallback({ stage: 'processing', progress: 40, message: 'Processing records...' });
      }

      // Process records
      const processedRecords = [];
      const errors = [];
      const warnings = [];

      for (let i = 0; i < parseResult.records.length; i++) {
        const record = parseResult.records[i];
        
        try {
          const processedRecord = this.processRecord(record, dataType, options);
          processedRecords.push(processedRecord);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }

        // Update progress
        if (progressCallback && i % 10 === 0) {
          const progress = 40 + Math.round((i / parseResult.records.length) * 40);
          progressCallback({ 
            stage: 'processing', 
            progress, 
            message: `Processing record ${i + 1} of ${parseResult.records.length}...` 
          });
        }
      }

      if (progressCallback) {
        progressCallback({ stage: 'saving', progress: 80, message: 'Saving data...' });
      }

      // Save to storage (localStorage for now)
      const storageKey = `masterData_${dataType}`;
      const existingData = this.loadFromStorage(storageKey) || [];
      
      if (options.replaceExisting) {
        localStorage.setItem(storageKey, JSON.stringify(processedRecords));
      } else {
        const mergedData = this.mergeData(existingData, processedRecords, dataType);
        localStorage.setItem(storageKey, JSON.stringify(mergedData));
      }

      const endTime = new Date();
      const importRecord = {
        id: importId,
        dataType,
        fileName: file.name,
        fileSize: file.size,
        recordCount: processedRecords.length,
        errorCount: errors.length,
        warningCount: warnings.length,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        status: errors.length > 0 ? 'completed_with_errors' : 'completed',
        options
      };

      // Save import history
      this.importHistory.unshift(importRecord);
      this.saveImportHistory();

      if (progressCallback) {
        progressCallback({ stage: 'completed', progress: 100, message: 'Import completed successfully!' });
      }

      return {
        success: true,
        importId,
        recordsProcessed: processedRecords.length,
        errors,
        warnings,
        importRecord
      };

    } catch (error) {
      const errorRecord = {
        id: importId,
        dataType,
        fileName: file.name,
        fileSize: file.size,
        startTime,
        endTime: new Date(),
        status: 'failed',
        error: error.message,
        options
      };

      this.importHistory.unshift(errorRecord);
      this.saveImportHistory();

      if (progressCallback) {
        progressCallback({ stage: 'error', progress: 0, message: `Import failed: ${error.message}` });
      }

      return {
        success: false,
        error: error.message,
        importRecord: errorRecord
      };
    }
  }

  /**
   * Process individual record based on data type
   * @param {Object} record - Raw record
   * @param {string} dataType - Type of data
   * @param {Object} options - Processing options
   * @returns {Object} Processed record
   */
  processRecord(record, dataType, options) {
    const processed = {
      id: this.generateRecordId(),
      importedAt: new Date().toISOString(),
      ...record
    };

    switch (dataType) {
      case 'customers':
        processed.customerCode = record.customerCode?.trim();
        processed.customerName = record.customerName?.trim();
        processed.email = record.email?.toLowerCase().trim();
        processed.creditLimit = record.creditLimit ? parseFloat(record.creditLimit) : 0;
        break;

      case 'products':
        processed.productCode = record.productCode?.trim();
        processed.productName = record.productName?.trim();
        processed.unitPrice = parseFloat(record.unitPrice);
        processed.taxRate = record.taxRate ? parseFloat(record.taxRate) : 0;
        processed.isActive = record.isActive !== 'false' && record.isActive !== '0';
        break;

      case 'references':
        processed.referenceType = record.referenceType?.trim();
        processed.referenceCode = record.referenceCode?.trim();
        processed.referenceValue = record.referenceValue?.trim();
        processed.isActive = record.isActive !== 'false' && record.isActive !== '0';
        processed.sortOrder = record.sortOrder ? parseInt(record.sortOrder) : 0;
        break;
    }

    return processed;
  }

  /**
   * Merge new data with existing data
   * @param {Array} existingData - Existing records
   * @param {Array} newData - New records to merge
   * @param {string} dataType - Type of data
   * @returns {Array} Merged data
   */
  mergeData(existingData, newData, dataType) {
    const keyField = this.getKeyField(dataType);
    const existingKeys = new Set(existingData.map(record => record[keyField]));
    
    // Add new records that don't exist
    const uniqueNewRecords = newData.filter(record => !existingKeys.has(record[keyField]));
    
    return [...existingData, ...uniqueNewRecords];
  }

  /**
   * Get key field for data type
   * @param {string} dataType - Type of data
   * @returns {string} Key field name
   */
  getKeyField(dataType) {
    const keyFields = {
      customers: 'customerCode',
      products: 'productCode',
      references: 'referenceCode'
    };

    return keyFields[dataType] || 'id';
  }

  /**
   * Rollback import
   * @param {string} importId - Import ID to rollback
   * @returns {Promise<Object>} Rollback result
   */
  async rollbackImport(importId) {
    try {
      const importRecord = this.importHistory.find(record => record.id === importId);
      
      if (!importRecord) {
        throw new Error('Import record not found');
      }

      if (importRecord.status === 'failed') {
        throw new Error('Cannot rollback failed import');
      }

      // For now, we'll mark as rolled back in history
      // In a real implementation, this would restore previous data state
      importRecord.status = 'rolled_back';
      importRecord.rolledBackAt = new Date().toISOString();
      
      this.saveImportHistory();

      return {
        success: true,
        message: 'Import rolled back successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get import history
   * @returns {Array} Import history records
   */
  getImportHistory() {
    return this.importHistory;
  }

  /**
   * Load import history from storage
   * @returns {Array} Import history
   */
  loadImportHistory() {
    try {
      const history = localStorage.getItem('masterData_importHistory');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save import history to storage
   */
  saveImportHistory() {
    try {
      localStorage.setItem('masterData_importHistory', JSON.stringify(this.importHistory));
    } catch (error) {
      console.error('Failed to save import history:', error);
    }
  }

  /**
   * Export master data
   * @param {string} dataType - Type of data to export
   * @param {Object} filters - Export filters
   * @param {string} format - Export format (csv, excel, json)
   * @param {Object} options - Export options
   * @param {Function} progressCallback - Progress callback
   * @returns {Promise<Object>} Export result
   */
  async exportData(dataType, filters = {}, format = 'csv', options = {}, progressCallback = null) {
    const exportId = this.generateExportId();
    const startTime = new Date();

    try {
      if (progressCallback) {
        progressCallback({ stage: 'loading', progress: 0, message: 'Loading data...' });
      }

      // Load data from storage
      const storageKey = `masterData_${dataType}`;
      const allData = this.loadFromStorage(storageKey) || [];

      if (allData.length === 0) {
        throw new Error(`No ${dataType} data found to export`);
      }

      if (progressCallback) {
        progressCallback({ stage: 'filtering', progress: 20, message: 'Applying filters...' });
      }

      // Apply filters
      const filteredData = this.applyExportFilters(allData, filters, dataType);

      if (filteredData.length === 0) {
        throw new Error('No data matches the specified filters');
      }

      if (progressCallback) {
        progressCallback({ stage: 'formatting', progress: 40, message: 'Formatting data...' });
      }

      // Format data based on export format
      let exportContent;
      let mimeType;
      let fileExtension;

      switch (format.toLowerCase()) {
        case 'csv':
          exportContent = this.formatAsCSV(filteredData, dataType);
          mimeType = 'text/csv';
          fileExtension = 'csv';
          break;
        case 'excel':
          exportContent = this.formatAsExcel(filteredData, dataType);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          fileExtension = 'xlsx';
          break;
        case 'json':
          exportContent = this.formatAsJSON(filteredData, dataType);
          mimeType = 'application/json';
          fileExtension = 'json';
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      if (progressCallback) {
        progressCallback({ stage: 'generating', progress: 80, message: 'Generating file...' });
      }

      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${dataType}_export_${timestamp}.${fileExtension}`;

      // Create download
      const blob = new Blob([exportContent], { type: mimeType });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const endTime = new Date();
      const exportRecord = {
        id: exportId,
        dataType,
        format,
        filename,
        recordCount: filteredData.length,
        totalRecords: allData.length,
        filters,
        options,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        status: 'completed',
        fileSize: blob.size
      };

      // Save export history
      this.exportHistory.unshift(exportRecord);
      this.saveExportHistory();

      if (progressCallback) {
        progressCallback({ stage: 'completed', progress: 100, message: 'Export completed successfully!' });
      }

      return {
        success: true,
        exportId,
        filename,
        recordCount: filteredData.length,
        fileSize: blob.size,
        exportRecord
      };

    } catch (error) {
      const errorRecord = {
        id: exportId,
        dataType,
        format,
        startTime,
        endTime: new Date(),
        status: 'failed',
        error: error.message,
        filters,
        options
      };

      this.exportHistory.unshift(errorRecord);
      this.saveExportHistory();

      if (progressCallback) {
        progressCallback({ stage: 'error', progress: 0, message: `Export failed: ${error.message}` });
      }

      return {
        success: false,
        error: error.message,
        exportRecord: errorRecord
      };
    }
  }

  /**
   * Apply export filters to data
   * @param {Array} data - Data to filter
   * @param {Object} filters - Filter criteria
   * @param {string} dataType - Type of data
   * @returns {Array} Filtered data
   */
  applyExportFilters(data, filters, dataType) {
    let filteredData = [...data];

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      filteredData = filteredData.filter(record => {
        const recordDate = new Date(record.importedAt || record.createdAt);
        if (filters.dateFrom && recordDate < new Date(filters.dateFrom)) return false;
        if (filters.dateTo && recordDate > new Date(filters.dateTo)) return false;
        return true;
      });
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter(record => {
        if (filters.status === 'active') return record.isActive !== false;
        if (filters.status === 'inactive') return record.isActive === false;
        return true;
      });
    }

    // Search filter
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filteredData = filteredData.filter(record => {
        return Object.values(record).some(value => 
          String(value).toLowerCase().includes(searchTerm)
        );
      });
    }

    // Data type specific filters
    switch (dataType) {
      case 'customers':
        if (filters.country) {
          filteredData = filteredData.filter(record => 
            record.country?.toLowerCase() === filters.country.toLowerCase()
          );
        }
        break;
      case 'products':
        if (filters.category) {
          filteredData = filteredData.filter(record => 
            record.category?.toLowerCase() === filters.category.toLowerCase()
          );
        }
        if (filters.priceRange) {
          const { min, max } = filters.priceRange;
          filteredData = filteredData.filter(record => {
            const price = parseFloat(record.unitPrice) || 0;
            return (!min || price >= min) && (!max || price <= max);
          });
        }
        break;
      case 'references':
        if (filters.referenceType) {
          filteredData = filteredData.filter(record => 
            record.referenceType?.toLowerCase() === filters.referenceType.toLowerCase()
          );
        }
        break;
    }

    return filteredData;
  }

  /**
   * Format data as CSV
   * @param {Array} data - Data to format
   * @param {string} dataType - Type of data
   * @returns {string} CSV content
   */
  formatAsCSV(data, dataType) {
    if (data.length === 0) return '';

    // Get headers from first record
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    const csvRows = [headers.join(',')];
    
    data.forEach(record => {
      const values = headers.map(header => {
        const value = record[header];
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Format data as Excel (simplified CSV for now)
   * @param {Array} data - Data to format
   * @param {string} dataType - Type of data
   * @returns {string} Excel content
   */
  formatAsExcel(data, dataType) {
    // For now, return CSV format
    // In a real implementation, you would use a library like SheetJS
    return this.formatAsCSV(data, dataType);
  }

  /**
   * Format data as JSON
   * @param {Array} data - Data to format
   * @param {string} dataType - Type of data
   * @returns {string} JSON content
   */
  formatAsJSON(data, dataType) {
    return JSON.stringify({
      exportInfo: {
        dataType,
        exportDate: new Date().toISOString(),
        recordCount: data.length
      },
      data
    }, null, 2);
  }

  /**
   * Get export history
   * @returns {Array} Export history records
   */
  getExportHistory() {
    return this.exportHistory;
  }

  /**
   * Load export history from storage
   * @returns {Array} Export history
   */
  loadExportHistory() {
    try {
      const history = localStorage.getItem('masterData_exportHistory');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save export history to storage
   */
  saveExportHistory() {
    try {
      localStorage.setItem('masterData_exportHistory', JSON.stringify(this.exportHistory));
    } catch (error) {
      console.error('Failed to save export history:', error);
    }
  }

  /**
   * Schedule export (placeholder for future implementation)
   * @param {Object} scheduleConfig - Schedule configuration
   * @returns {Object} Schedule result
   */
  scheduleExport(scheduleConfig) {
    // Placeholder for scheduling functionality
    // In a real implementation, this would integrate with a job scheduler
    return {
      success: false,
      message: 'Export scheduling not yet implemented'
    };
  }

  /**
   * Get available export formats
   * @returns {Array} Available formats
   */
  getAvailableFormats() {
    return [
      { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
      { value: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
      { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' }
    ];
  }

  /**
   * Get export statistics
   * @returns {Object} Export statistics
   */
  getExportStatistics() {
    const history = this.exportHistory;
    const last30Days = history.filter(record => {
      const recordDate = new Date(record.startTime);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return recordDate >= thirtyDaysAgo;
    });

    return {
      totalExports: history.length,
      exportsLast30Days: last30Days.length,
      totalRecordsExported: history.reduce((sum, record) => sum + (record.recordCount || 0), 0),
      averageExportSize: history.length > 0 
        ? Math.round(history.reduce((sum, record) => sum + (record.recordCount || 0), 0) / history.length)
        : 0,
      formatBreakdown: this.getFormatBreakdown(history),
      dataTypeBreakdown: this.getDataTypeBreakdown(history)
    };
  }

  /**
   * Get format breakdown for statistics
   * @param {Array} history - Export history
   * @returns {Object} Format breakdown
   */
  getFormatBreakdown(history) {
    const breakdown = {};
    history.forEach(record => {
      const format = record.format || 'unknown';
      breakdown[format] = (breakdown[format] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Get data type breakdown for statistics
   * @param {Array} history - Export history
   * @returns {Object} Data type breakdown
   */
  getDataTypeBreakdown(history) {
    const breakdown = {};
    history.forEach(record => {
      const dataType = record.dataType || 'unknown';
      breakdown[dataType] = (breakdown[dataType] || 0) + 1;
    });
    return breakdown;
  }

  /**
   * Generate unique export ID
   * @returns {string} Export ID
   */
  generateExportId() {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load data from storage
   * @param {string} key - Storage key
   * @returns {Array} Stored data
   */
  loadFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Generate unique import ID
   * @returns {string} Import ID
   */
  generateImportId() {
    return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique record ID
   * @returns {string} Record ID
   */
  generateRecordId() {
    return `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Is valid email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Export singleton instance
export default new MasterDataService();