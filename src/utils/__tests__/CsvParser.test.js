import { describe, it, expect, vi } from 'vitest';
import { CsvParser } from '../CsvParser';

// Mock Papa Parse
vi.mock('papaparse', () => ({
  default: {
    parse: vi.fn()
  }
}));

import Papa from 'papaparse';

describe('CsvParser', () => {
  let parser;

  beforeEach(() => {
    parser = new CsvParser();
    vi.clearAllMocks();
  });

  describe('parseFile', () => {
    it('should parse CSV file successfully', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      // Mock Papa.parse to call step and complete callbacks
      Papa.parse.mockImplementation((file, options) => {
        // Simulate header transformation
        const transformedHeader = options.transformHeader('Invoice Number');
        expect(transformedHeader).toBe('invoiceNumber');
        
        // Simulate successful parsing
        setTimeout(() => {
          // Call step for each row
          options.step({
            data: {
              invoiceNumber: 'INV-001',
              customerName: 'Test Customer',
              amount: '100.00',
              taxAmount: '10.00',
              totalAmount: '110.00',
              date: '2024-01-01'
            },
            errors: []
          });
          
          // Call complete
          options.complete();
        }, 0);
      });

      const result = await parser.parseFile(mockFile);
      
      expect(result.success).toBe(true);
      expect(result.records).toHaveLength(1);
      expect(result.records[0].invoiceNumber).toBe('INV-001');
      expect(result.records[0].status).toBe('valid');
    });

    it('should handle parsing errors', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      Papa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          options.error(new Error('Parse error'));
        }, 0);
      });

      const result = await parser.parseFile(mockFile);
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Failed to parse CSV');
    });

    it('should handle row-level errors', async () => {
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      Papa.parse.mockImplementation((file, options) => {
        setTimeout(() => {
          // Simulate row with parsing error
          options.step({
            data: {},
            errors: [{ message: 'Row parsing error' }]
          });
          
          options.complete();
        }, 0);
      });

      const result = await parser.parseFile(mockFile);
      
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('parsing');
    });
  });

  describe('normalizeHeader', () => {
    it('should normalize common header variations', () => {
      expect(parser.normalizeHeader('Invoice Number')).toBe('invoiceNumber');
      expect(parser.normalizeHeader('Customer Name')).toBe('customerName');
      expect(parser.normalizeHeader('Total Amount')).toBe('totalAmount');
      expect(parser.normalizeHeader('Tax Rate')).toBe('taxRate');
    });

    it('should handle case insensitive headers', () => {
      expect(parser.normalizeHeader('INVOICE_NUMBER')).toBe('invoiceNumber');
      expect(parser.normalizeHeader('customer_name')).toBe('customerName');
    });

    it('should return normalized version for unknown headers', () => {
      expect(parser.normalizeHeader('Unknown Header')).toBe('unknown_header');
    });
  });

  describe('getStringValue', () => {
    it('should handle various input types', () => {
      expect(parser.getStringValue('test')).toBe('test');
      expect(parser.getStringValue(123)).toBe('123');
      expect(parser.getStringValue(null)).toBe('');
      expect(parser.getStringValue(undefined)).toBe('');
      expect(parser.getStringValue('  spaced  ')).toBe('spaced');
    });
  });

  describe('getNumericValue', () => {
    it('should parse numeric values correctly', () => {
      expect(parser.getNumericValue('123.45')).toBe(123.45);
      expect(parser.getNumericValue('$1,234.56')).toBe(1234.56);
      expect(parser.getNumericValue('€100.00')).toBe(100.00);
      expect(parser.getNumericValue('')).toBe(0);
      expect(parser.getNumericValue('invalid')).toBe(0);
    });
  });

  describe('getDateValue', () => {
    it('should parse date values correctly', () => {
      expect(parser.getDateValue('2024-01-01')).toBe('2024-01-01');
      expect(parser.getDateValue('01/01/2024')).toBe('2024-01-01');
      expect(parser.getDateValue('')).toBe('');
      expect(parser.getDateValue('invalid')).toBe('');
    });
  });

  describe('calculateMissingValues', () => {
    it('should calculate tax amount from tax rate', () => {
      const record = {
        amount: 100,
        taxRate: 10,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0,
        metadata: {}
      };

      parser.calculateMissingValues(record);

      expect(record.taxAmount).toBe(10);
      expect(record.totalAmount).toBe(110);
    });

    it('should calculate tax rate from tax amount', () => {
      const record = {
        amount: 100,
        taxRate: 0,
        taxAmount: 15,
        discountAmount: 0,
        totalAmount: 0,
        metadata: {}
      };

      parser.calculateMissingValues(record);

      expect(record.taxRate).toBe(15);
      expect(record.totalAmount).toBe(115);
    });

    it('should detect calculation discrepancies', () => {
      const record = {
        amount: 100,
        taxRate: 10,
        taxAmount: 10,
        discountAmount: 0,
        totalAmount: 120, // Should be 110
        metadata: {}
      };

      parser.calculateMissingValues(record);

      expect(record.metadata.calculationDiscrepancy).toBeDefined();
      expect(record.metadata.calculationDiscrepancy.expected).toBe(110);
      expect(record.metadata.calculationDiscrepancy.actual).toBe(120);
    });
  });

  describe('validateRecord', () => {
    it('should validate required fields', () => {
      const record = {
        invoiceNumber: '',
        customerName: 'Test Customer',
        amount: 100,
        totalAmount: 100,
        date: '2024-01-01'
      };

      const errors = parser.validateRecord(record, 1);

      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('invoiceNumber');
      expect(errors[0].message).toContain('required');
    });

    it('should validate numeric fields', () => {
      const record = {
        invoiceNumber: 'INV-001',
        customerName: 'Test Customer',
        amount: 'invalid',
        totalAmount: 100,
        date: '2024-01-01'
      };

      const errors = parser.validateRecord(record, 1);

      expect(errors.some(e => e.field === 'amount')).toBe(true);
    });

    it('should validate date fields', () => {
      const record = {
        invoiceNumber: 'INV-001',
        customerName: 'Test Customer',
        amount: 100,
        totalAmount: 100,
        date: 'invalid-date'
      };

      const errors = parser.validateRecord(record, 1);

      expect(errors.some(e => e.field === 'date')).toBe(true);
    });
  });
});