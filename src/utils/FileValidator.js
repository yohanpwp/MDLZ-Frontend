/**
 * File validation utility for invoice validation system
 * Handles file type, size, and format validation
 */

const ALLOWED_FILE_TYPES = ['text/csv', 'text/plain', 'application/csv'];
const ALLOWED_EXTENSIONS = ['.csv', '.txt'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export class FileValidationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FileValidationError';
    this.code = code;
  }
}

export const FileValidator = {
  /**
   * Validates file type and extension
   * @param {File} file - The file to validate
   * @returns {boolean} - True if valid
   * @throws {FileValidationError} - If validation fails
   */
  validateFileType(file) {
    if (!file) {
      throw new FileValidationError('No file provided', 'NO_FILE');
    }

    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = ALLOWED_FILE_TYPES.includes(file.type) || file.type === '';

    if (!hasValidExtension) {
      throw new FileValidationError(
        `Invalid file extension. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
        'INVALID_EXTENSION'
      );
    }

    if (!hasValidMimeType && file.type !== '') {
      throw new FileValidationError(
        `Invalid file type. Allowed types: CSV, TXT`,
        'INVALID_MIME_TYPE'
      );
    }

    return true;
  },

  /**
   * Validates file size
   * @param {File} file - The file to validate
   * @returns {boolean} - True if valid
   * @throws {FileValidationError} - If validation fails
   */
  validateFileSize(file) {
    if (!file) {
      throw new FileValidationError('No file provided', 'NO_FILE');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new FileValidationError(
        `File size exceeds maximum limit of ${this.formatFileSize(MAX_FILE_SIZE)}`,
        'FILE_TOO_LARGE'
      );
    }

    if (file.size === 0) {
      throw new FileValidationError('File is empty', 'EMPTY_FILE');
    }

    return true;
  },

  /**
   * Performs complete file validation
   * @param {File} file - The file to validate
   * @returns {Object} - Validation result with file info
   * @throws {FileValidationError} - If validation fails
   */
  validateFile(file) {
    this.validateFileType(file);
    this.validateFileSize(file);

    return {
      isValid: true,
      fileName: file.name,
      fileSize: file.size,
      fileType: this.getFileType(file.name),
      formattedSize: this.formatFileSize(file.size)
    };
  },

  /**
   * Gets file type from filename
   * @param {string} fileName - The filename
   * @returns {string} - File type ('csv' or 'txt')
   */
  getFileType(fileName) {
    const extension = fileName.toLowerCase().split('.').pop();
    return extension === 'csv' ? 'csv' : 'txt';
  },

  /**
   * Formats file size in human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} - Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Gets maximum allowed file size
   * @returns {number} - Max file size in bytes
   */
  getMaxFileSize() {
    return MAX_FILE_SIZE;
  },

  /**
   * Gets allowed file extensions
   * @returns {Array<string>} - Array of allowed extensions
   */
  getAllowedExtensions() {
    return [...ALLOWED_EXTENSIONS];
  }
};