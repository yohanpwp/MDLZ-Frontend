import { describe, it, expect, vi } from 'vitest';
import { TxtParser } from '../TxtParser';

// Mock FileReader
global.FileReader = class {
  constructor() {
    this.onload = null;
    this.onerror = null;
  }
  
  readAsText(file) {
    setTimeout(() => {
      if (this.onload) {
        this.onload({ target: { result: file.content || 'test content' } });
      }
    }, 0);
  }
};

describe('TxtParser', () => {
  let parser;

  beforeEach(() => {
    parser = new TxtParser();
  });

  describe('detectFormat', () => {
    it('should detect key-value format', () => {
      const content = 'Invoice: INV-001\nCustomer: Test Customer\nAmount: 100.00';
      expect(parser.detectFormat(content)).toBe('key-value');
    });

    it('should detect delimited format', () => {
      const content = 'Invoice\tCustomer\tAmount\nINV-001\tTest Customer\t100.00';
      expect(parser.detectFormat(content)).toBe('delimited');
    });

    it('should detect pipe-delimited format', () => {
      const content = 'Invoice|Customer|Amount\nINV-001|Test Customer|100.00';
      expect(parser.detectFormat(content)).toBe('delimited');
    });

    it('should detect fixed-width format', () => {
      const content = 'INV-001      Test Customer           100.00\nINV-002      Another Customer        200.00';
      expect(parser.detectFormat(content)).toBe('fixed-width');
    });

    it('should default to generic format', () => {
      const content = 'Some random text without clear structure';
      expect(parser.detectFormat(content)).toBe('generic');
    });
  });

  describe('parseFile', () => {
    it('should parse key-value format successfully', async () => {
      const mockFile = {
        name: 'test.txt',
        size: 100,
        content: 'Invoice: INV-001\nCustomer: Test Customer\nAmount: 100.00\nTotal: 110.00\n\nInvoice: INV-002\nCustomer: Another Customer\nAmount: 200.00\nTotal: 220.00'
      };

      const result = await parser.parseFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.records).toHaveLength(2);
      expect(result.records[0].invoiceNumber).toBe('INV-001');
      expect(result.records[0].customerName).toBe('Test Customer');
      expect(result.records[0].amount).toBe(100);
      expect(result.records[0].totalAmount).toBe(110);
    });

    it('should parse delimited format successfully', async () => {
      const mockFile = {
        name: 'test.txt',
        size: 100,
        content: 'Invoice\tCustomer\tAmount\tTotal\nINV-001\tTest Customer\t100.00\t110.00\nINV-002\tAnother Customer\t200.00\t220.00'
      };

      const result = await parser.parseFile(mockFile);

      expect(result.success).toBe(true);
      expect(result.records).toHaveLength(2);
      expect(result.records[0].invoiceNumber).toBe('INV-001');
      expect(result.records[1].invoiceNumber).toBe('INV-002');
    });

    it('should handle parsing errors gracefully', async () => {
      const mockFile = {
        name: 'test.txt',
        size: 100,
        content: null // This will cause an error
      };

      // Mock FileReader to simulate error
      global.FileReader = class {
        readAsText() {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error('Read error'));
            }
          }, 0);
        }
      };

      const result = await parser.parseFile(mockFile);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Failed to parse TXT file');
    });
  });

  describe('parseNumber', () => {
    it('should parse various number formats', () => {
      expect(parser.parseNumber('123.45')).toBe(123.45);
      expect(parser.parseNumber('$1,234.56')).toBe(1234.56);
      expect(parser.parseNumber('€100.00')).toBe(100.00);
      expect(parser.parseNumber('')).toBe(0);
      expect(parser.parseNumber('invalid')).toBe(0);
    });
  });

  describe('parseDate', () => {
    it('should parse various date formats', () => {
      expect(parser.parseDate('2024-01-01')).toBe('2024-01-01');
      expect(parser.parseDate('01/01/2024')).toBe('2024-01-01');
      expect(parser.parseDate('')).toBe('');
      expect(parser.parseDate('invalid')).toBe('');
    });
  });

  describe('extractDataFromLine', () => {
    it('should extract invoice data from generic lines', () => {
      const line = 'Invoice INV-001 for $150.00 dated 01/01/2024';
      const record = parser.extractDataFromLine(line, 1);

      expect(record).toBeTruthy();
      expect(record.invoiceNumber).toBe('INV-001');
      expect(record.totalAmount).toBe(150);
    });

    it('should return null for lines without recognizable data', () => {
      const line = 'This is just random text';
      const record = parser.extractDataFromLine(line, 1);

      expect(record).toBeNull();
    });
  });

  describe('createHeaderMapping', () => {
    it('should map headers to field names', () => {
      const headers = ['invoice', 'customer', 'amount', 'tax', 'total'];
      const mapping = parser.createHeaderMapping(headers);

      expect(mapping[0]).toBe('invoiceNumber');
      expect(mapping[1]).toBe('customerName');
      expect(mapping[2]).toBe('amount');
      expect(mapping[3]).toBe('taxAmount');
      expect(mapping[4]).toBe('totalAmount');
    });
  });

  describe('mapKeyToField', () => {
    it('should map keys to record fields correctly', () => {
      const record = {
        invoiceNumber: '',
        customerName: '',
        amount: 0,
        taxAmount: 0,
        totalAmount: 0,
        date: ''
      };

      parser.mapKeyToField(record, 'Invoice Number', 'INV-001');
      parser.mapKeyToField(record, 'Customer Name', 'Test Customer');
      parser.mapKeyToField(record, 'Amount', '100.00');
      parser.mapKeyToField(record, 'Tax Amount', '10.00');
      parser.mapKeyToField(record, 'Total Amount', '110.00');
      parser.mapKeyToField(record, 'Date', '2024-01-01');

      expect(record.invoiceNumber).toBe('INV-001');
      expect(record.customerName).toBe('Test Customer');
      expect(record.amount).toBe(100);
      expect(record.taxAmount).toBe(10);
      expect(record.totalAmount).toBe(110);
      expect(record.date).toBe('2024-01-01');
    });
  });
});