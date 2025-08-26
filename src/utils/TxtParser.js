import { createEmptyInvoiceRecord, VALIDATION_RULES } from '../types/invoice';

/**
 * TXT Parser utility for processing structured text invoice files
 * Supports various text formats including fixed-width and delimited formats
 */
export class TxtParser {
  constructor() {
    this.supportedFormats = ['delimited', 'fixed-width', 'key-value'];
  }

  /**
   * Parses TXT file and converts to invoice records
   * @param {File} file - TXT file to parse
   * @returns {Promise<FileProcessingResult>} - Processing result
   */
  async parseFile(file) {
    try {
      const content = await this.readFileContent(file);
      const format = this.detectFormat(content);
      
      let result;
      switch (format) {
        case 'delimited':
          result = this.parseDelimitedFormat(content, file);
          break;
        case 'fixed-width':
          result = this.parseFixedWidthFormat(content, file);
          break;
        case 'key-value':
          result = this.parseKeyValueFormat(content, file);
          break;
        default:
          result = this.parseGenericFormat(content, file);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        records: [],
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        errors: [{
          row: 0,
          field: 'file',
          message: `Failed to parse TXT file: ${error.message}`,
          value: '',
          type: 'parsing'
        }],
        metadata: {
          parser: 'txt',
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Reads file content as text
   * @param {File} file - File to read
   * @returns {Promise<string>} - File content
   */
  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Detects the format of the text file
   * @param {string} content - File content
   * @returns {string} - Detected format
   */
  detectFormat(content) {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) return 'generic';

    const firstLine = lines[0];
    
    // Check for key-value format (key: value or key=value)
    if (firstLine.includes(':') || firstLine.includes('=')) {
      return 'key-value';
    }

    // Check for delimited format (tab, pipe, semicolon)
    if (firstLine.includes('\t') || firstLine.includes('|') || firstLine.includes(';')) {
      return 'delimited';
    }

    // Check for fixed-width format (consistent spacing)
    const hasConsistentSpacing = lines.slice(0, 5).every(line => {
      const spaces = line.match(/\s{2,}/g);
      return spaces && spaces.length > 2;
    });

    if (hasConsistentSpacing) {
      return 'fixed-width';
    }

    return 'generic';
  }

  /**
   * Parses delimited text format (tab, pipe, semicolon separated)
   * @param {string} content - File content
   * @param {File} file - Original file
   * @returns {FileProcessingResult} - Processing result
   */
  parseDelimitedFormat(content, file) {
    const lines = content.split('\n').filter(line => line.trim());
    const records = [];
    const errors = [];

    // Detect delimiter
    const firstLine = lines[0];
    let delimiter = '\t';
    if (firstLine.includes('|')) delimiter = '|';
    else if (firstLine.includes(';')) delimiter = ';';

    // Assume first line is header
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
    const headerMapping = this.createHeaderMapping(headers);

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(delimiter).map(v => v.trim());
        const record = this.createRecordFromValues(values, headerMapping, i + 1);
        
        const validationErrors = this.validateRecord(record, i + 1);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          record.status = 'invalid';
        } else {
          record.status = 'valid';
        }

        records.push(record);
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'parsing',
          message: error.message,
          value: line,
          type: 'parsing'
        });
      }
    }

    return this.createProcessingResult(records, errors, file, 'delimited');
  }

  /**
   * Parses fixed-width text format
   * @param {string} content - File content
   * @param {File} file - Original file
   * @returns {FileProcessingResult} - Processing result
   */
  parseFixedWidthFormat(content, file) {
    const lines = content.split('\n').filter(line => line.trim());
    const records = [];
    const errors = [];

    // Define common fixed-width field positions for invoice data
    const fieldPositions = this.detectFieldPositions(lines);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      try {
        const record = this.createRecordFromFixedWidth(line, fieldPositions, i + 1);
        
        const validationErrors = this.validateRecord(record, i + 1);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          record.status = 'invalid';
        } else {
          record.status = 'valid';
        }

        records.push(record);
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'parsing',
          message: error.message,
          value: line,
          type: 'parsing'
        });
      }
    }

    return this.createProcessingResult(records, errors, file, 'fixed-width');
  }

  /**
   * Parses key-value text format
   * @param {string} content - File content
   * @param {File} file - Original file
   * @returns {FileProcessingResult} - Processing result
   */
  parseKeyValueFormat(content, file) {
    const records = [];
    const errors = [];
    
    // Split content into record blocks (separated by empty lines)
    const recordBlocks = content.split(/\n\s*\n/).filter(block => block.trim());

    for (let i = 0; i < recordBlocks.length; i++) {
      try {
        const record = this.createRecordFromKeyValue(recordBlocks[i], i + 1);
        
        const validationErrors = this.validateRecord(record, i + 1);
        if (validationErrors.length > 0) {
          errors.push(...validationErrors);
          record.status = 'invalid';
        } else {
          record.status = 'valid';
        }

        records.push(record);
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'parsing',
          message: error.message,
          value: recordBlocks[i].substring(0, 100),
          type: 'parsing'
        });
      }
    }

    return this.createProcessingResult(records, errors, file, 'key-value');
  }

  /**
   * Parses generic text format (fallback)
   * @param {string} content - File content
   * @param {File} file - Original file
   * @returns {FileProcessingResult} - Processing result
   */
  parseGenericFormat(content, file) {
    // For generic format, try to extract any numeric and text patterns
    // This is a best-effort approach for unstructured data
    const lines = content.split('\n').filter(line => line.trim());
    const records = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const record = this.extractDataFromLine(line, i + 1);
        if (record) {
          record.status = 'valid';
          records.push(record);
        }
      } catch (error) {
        errors.push({
          row: i + 1,
          field: 'parsing',
          message: 'Could not extract invoice data from line',
          value: line,
          type: 'parsing'
        });
      }
    }

    return this.createProcessingResult(records, errors, file, 'generic');
  }

  /**
   * Creates header mapping for delimited format
   * @param {string[]} headers - Array of header strings
   * @returns {Object} - Header to field mapping
   */
  createHeaderMapping(headers) {
    const mapping = {};
    const fieldMappings = {
      'invoice': 'invoiceNumber',
      'customer': 'customerName',
      'amount': 'amount',
      'tax': 'taxAmount',
      'total': 'totalAmount',
      'date': 'date'
    };

    headers.forEach((header, index) => {
      for (const [key, field] of Object.entries(fieldMappings)) {
        if (header.includes(key)) {
          mapping[index] = field;
          break;
        }
      }
    });

    return mapping;
  }

  /**
   * Creates record from delimited values
   * @param {string[]} values - Array of values
   * @param {Object} headerMapping - Header mapping
   * @param {number} rowIndex - Row index
   * @returns {InvoiceRecord} - Created record
   */
  createRecordFromValues(values, headerMapping, rowIndex) {
    const record = createEmptyInvoiceRecord();
    record.id = `txt-${Date.now()}-${rowIndex}`;

    Object.entries(headerMapping).forEach(([index, field]) => {
      const value = values[parseInt(index)];
      if (value !== undefined) {
        this.setRecordField(record, field, value);
      }
    });

    record.metadata = { rowIndex, format: 'delimited' };
    return record;
  }

  /**
   * Detects field positions for fixed-width format
   * @param {string[]} lines - Array of lines
   * @returns {Object} - Field positions
   */
  detectFieldPositions(lines) {
    // This is a simplified implementation
    // In practice, you might need more sophisticated position detection
    return {
      invoiceNumber: { start: 0, length: 15 },
      customerName: { start: 15, length: 30 },
      amount: { start: 45, length: 12 },
      taxAmount: { start: 57, length: 10 },
      totalAmount: { start: 67, length: 12 },
      date: { start: 79, length: 10 }
    };
  }

  /**
   * Creates record from fixed-width line
   * @param {string} line - Fixed-width line
   * @param {Object} fieldPositions - Field positions
   * @param {number} rowIndex - Row index
   * @returns {InvoiceRecord} - Created record
   */
  createRecordFromFixedWidth(line, fieldPositions, rowIndex) {
    const record = createEmptyInvoiceRecord();
    record.id = `txt-${Date.now()}-${rowIndex}`;

    Object.entries(fieldPositions).forEach(([field, position]) => {
      const value = line.substring(position.start, position.start + position.length).trim();
      this.setRecordField(record, field, value);
    });

    record.metadata = { rowIndex, format: 'fixed-width' };
    return record;
  }

  /**
   * Creates record from key-value block
   * @param {string} block - Key-value block
   * @param {number} recordIndex - Record index
   * @returns {InvoiceRecord} - Created record
   */
  createRecordFromKeyValue(block, recordIndex) {
    const record = createEmptyInvoiceRecord();
    record.id = `txt-${Date.now()}-${recordIndex}`;

    const lines = block.split('\n');
    lines.forEach(line => {
      const colonMatch = line.match(/^([^:]+):\s*(.+)$/);
      const equalsMatch = line.match(/^([^=]+)=\s*(.+)$/);
      
      if (colonMatch) {
        const [, key, value] = colonMatch;
        this.mapKeyToField(record, key.trim(), value.trim());
      } else if (equalsMatch) {
        const [, key, value] = equalsMatch;
        this.mapKeyToField(record, key.trim(), value.trim());
      }
    });

    record.metadata = { recordIndex, format: 'key-value' };
    return record;
  }

  /**
   * Maps key to record field
   * @param {InvoiceRecord} record - Record to update
   * @param {string} key - Key name
   * @param {string} value - Value
   */
  mapKeyToField(record, key, value) {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('invoice')) record.invoiceNumber = value;
    else if (keyLower.includes('customer')) record.customerName = value;
    else if (keyLower.includes('amount') && !keyLower.includes('tax') && !keyLower.includes('total')) record.amount = this.parseNumber(value);
    else if (keyLower.includes('tax')) record.taxAmount = this.parseNumber(value);
    else if (keyLower.includes('total')) record.totalAmount = this.parseNumber(value);
    else if (keyLower.includes('date')) record.date = this.parseDate(value);
  }

  /**
   * Extracts data from a generic line
   * @param {string} line - Line to parse
   * @param {number} rowIndex - Row index
   * @returns {InvoiceRecord|null} - Extracted record or null
   */
  extractDataFromLine(line, rowIndex) {
    // Look for patterns like invoice numbers, amounts, dates
    const invoiceMatch = line.match(/(?:INV|INVOICE)[#\s]*([A-Z0-9\-]+)/i);
    const amountMatch = line.match(/\$?(\d+(?:\.\d{2})?)/);
    const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);

    if (invoiceMatch || amountMatch) {
      const record = createEmptyInvoiceRecord();
      record.id = `txt-${Date.now()}-${rowIndex}`;
      
      if (invoiceMatch) record.invoiceNumber = invoiceMatch[1];
      if (amountMatch) record.totalAmount = parseFloat(amountMatch[1]);
      if (dateMatch) record.date = this.parseDate(dateMatch[1]);
      
      record.metadata = { rowIndex, format: 'generic', originalLine: line };
      return record;
    }

    return null;
  }

  /**
   * Sets record field with appropriate type conversion
   * @param {InvoiceRecord} record - Record to update
   * @param {string} field - Field name
   * @param {string} value - Value to set
   */
  setRecordField(record, field, value) {
    if (!value) return;

    switch (field) {
      case 'amount':
      case 'taxAmount':
      case 'discountAmount':
      case 'totalAmount':
      case 'taxRate':
        record[field] = this.parseNumber(value);
        break;
      case 'date':
      case 'dueDate':
        record[field] = this.parseDate(value);
        break;
      default:
        record[field] = value;
    }
  }

  /**
   * Parses numeric value
   * @param {string} value - Value to parse
   * @returns {number} - Parsed number
   */
  parseNumber(value) {
    if (!value) return 0;
    const cleaned = String(value).replace(/[$,€£¥]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Parses date value
   * @param {string} value - Value to parse
   * @returns {string} - ISO date string
   */
  parseDate(value) {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  /**
   * Validates record using the same validation as CSV parser
   * @param {InvoiceRecord} record - Record to validate
   * @param {number} rowIndex - Row index
   * @returns {ProcessingError[]} - Validation errors
   */
  validateRecord(record, rowIndex) {
    const errors = [];

    for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
      const value = record[field];

      if (rules.required && (!value || value === '')) {
        errors.push({
          row: rowIndex,
          field,
          message: `${field} is required`,
          value: String(value),
          type: 'validation'
        });
      }
    }

    return errors;
  }

  /**
   * Creates processing result object
   * @param {InvoiceRecord[]} records - Processed records
   * @param {ProcessingError[]} errors - Processing errors
   * @param {File} file - Original file
   * @param {string} format - Detected format
   * @returns {FileProcessingResult} - Processing result
   */
  createProcessingResult(records, errors, file, format) {
    const validRecords = records.filter(r => r.status === 'valid').length;
    const invalidRecords = records.length - validRecords;

    return {
      success: errors.length === 0,
      records,
      totalRecords: records.length,
      validRecords,
      invalidRecords,
      errors,
      metadata: {
        parser: 'txt',
        format,
        fileName: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString()
      }
    };
  }
}