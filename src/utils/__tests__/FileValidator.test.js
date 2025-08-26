import { describe, it, expect } from 'vitest';
import { FileValidator, FileValidationError } from '../FileValidator';

// Mock File constructor for testing
class MockFile {
  constructor(name, size, type = '') {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

describe('FileValidator', () => {
  describe('validateFileType', () => {
    it('should accept CSV files with correct extension', () => {
      const file = new MockFile('test.csv', 1000, 'text/csv');
      expect(() => FileValidator.validateFileType(file)).not.toThrow();
    });

    it('should accept TXT files with correct extension', () => {
      const file = new MockFile('test.txt', 1000, 'text/plain');
      expect(() => FileValidator.validateFileType(file)).not.toThrow();
    });

    it('should accept files with empty MIME type but valid extension', () => {
      const file = new MockFile('test.csv', 1000, '');
      expect(() => FileValidator.validateFileType(file)).not.toThrow();
    });

    it('should reject files with invalid extensions', () => {
      const file = new MockFile('test.pdf', 1000, 'application/pdf');
      expect(() => FileValidator.validateFileType(file))
        .toThrow(FileValidationError);
    });

    it('should reject files with invalid MIME types', () => {
      const file = new MockFile('test.csv', 1000, 'application/pdf');
      expect(() => FileValidator.validateFileType(file))
        .toThrow(FileValidationError);
    });

    it('should throw error when no file is provided', () => {
      expect(() => FileValidator.validateFileType(null))
        .toThrow(FileValidationError);
    });

    it('should handle case-insensitive extensions', () => {
      const file = new MockFile('TEST.CSV', 1000, 'text/csv');
      expect(() => FileValidator.validateFileType(file)).not.toThrow();
    });
  });

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const file = new MockFile('test.csv', 5 * 1024 * 1024); // 5MB
      expect(() => FileValidator.validateFileSize(file)).not.toThrow();
    });

    it('should reject files exceeding size limit', () => {
      const file = new MockFile('test.csv', 15 * 1024 * 1024); // 15MB
      expect(() => FileValidator.validateFileSize(file))
        .toThrow(FileValidationError);
    });

    it('should reject empty files', () => {
      const file = new MockFile('test.csv', 0);
      expect(() => FileValidator.validateFileSize(file))
        .toThrow(FileValidationError);
    });

    it('should throw error when no file is provided', () => {
      expect(() => FileValidator.validateFileSize(null))
        .toThrow(FileValidationError);
    });
  });

  describe('validateFile', () => {
    it('should return validation result for valid file', () => {
      const file = new MockFile('invoice.csv', 1000, 'text/csv');
      const result = FileValidator.validateFile(file);
      
      expect(result).toEqual({
        isValid: true,
        fileName: 'invoice.csv',
        fileSize: 1000,
        fileType: 'csv',
        formattedSize: '1000 Bytes'
      });
    });

    it('should throw error for invalid file type', () => {
      const file = new MockFile('test.pdf', 1000, 'application/pdf');
      expect(() => FileValidator.validateFile(file))
        .toThrow(FileValidationError);
    });

    it('should throw error for invalid file size', () => {
      const file = new MockFile('test.csv', 15 * 1024 * 1024);
      expect(() => FileValidator.validateFile(file))
        .toThrow(FileValidationError);
    });
  });

  describe('getFileType', () => {
    it('should return "csv" for CSV files', () => {
      expect(FileValidator.getFileType('test.csv')).toBe('csv');
      expect(FileValidator.getFileType('TEST.CSV')).toBe('csv');
    });

    it('should return "txt" for TXT files', () => {
      expect(FileValidator.getFileType('test.txt')).toBe('txt');
      expect(FileValidator.getFileType('TEST.TXT')).toBe('txt');
    });

    it('should return "txt" for unknown extensions', () => {
      expect(FileValidator.getFileType('test.unknown')).toBe('txt');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(FileValidator.formatFileSize(0)).toBe('0 Bytes');
      expect(FileValidator.formatFileSize(1024)).toBe('1 KB');
      expect(FileValidator.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(FileValidator.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should handle decimal values', () => {
      expect(FileValidator.formatFileSize(1536)).toBe('1.5 KB');
      expect(FileValidator.formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
    });
  });

  describe('utility methods', () => {
    it('should return correct max file size', () => {
      expect(FileValidator.getMaxFileSize()).toBe(10 * 1024 * 1024);
    });

    it('should return allowed extensions', () => {
      const extensions = FileValidator.getAllowedExtensions();
      expect(extensions).toEqual(['.csv', '.txt']);
    });
  });
});

describe('FileValidationError', () => {
  it('should create error with message and code', () => {
    const error = new FileValidationError('Test message', 'TEST_CODE');
    expect(error.message).toBe('Test message');
    expect(error.code).toBe('TEST_CODE');
    expect(error.name).toBe('FileValidationError');
  });
});