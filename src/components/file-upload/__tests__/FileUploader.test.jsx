/**
 * Unit tests for FileUploader component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import FileUploader from '../FileUploader.jsx';
import { FileValidator, FileValidationError } from '../../../utils/FileValidator.js';

// Mock FileValidator
vi.mock('../../../utils/FileValidator.js', () => ({
  FileValidator: {
    validateFile: vi.fn(),
    getAllowedExtensions: vi.fn(() => ['.csv', '.txt']),
    getMaxFileSize: vi.fn(() => 10 * 1024 * 1024),
    formatFileSize: vi.fn((size) => `${size} Bytes`)
  },
  FileValidationError: class extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'FileValidationError';
      this.code = code;
    }
  }
}));

// Mock File constructor for testing
class MockFile {
  constructor(name, size, type = '') {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

// Mock DataTransfer for drag and drop testing
class MockDataTransfer {
  constructor(files = []) {
    this.files = files;
  }
}

describe('FileUploader', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    FileValidator.validateFile.mockReturnValue({
      isValid: true,
      fileName: 'test.csv',
      fileSize: 1000,
      fileType: 'csv',
      formattedSize: '1000 Bytes'
    });
  });

  test('should render upload zone with correct content', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText('Upload invoice files')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your files here, or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: .csv, .txt')).toBeInTheDocument();
    expect(screen.getByText('Maximum file size: 10485760 Bytes')).toBeInTheDocument();
  });

  test('should handle file selection via input', async () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const file = new MockFile('test.csv', 1000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(FileValidator.validateFile).toHaveBeenCalledWith(file);
      expect(mockOnFileSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          file,
          isValid: true,
          fileName: 'test.csv',
          fileSize: 1000,
          fileType: 'csv',
          formattedSize: '1000 Bytes'
        })
      );
    });
  });

  test('should handle drag and drop', async () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const file = new MockFile('test.csv', 1000, 'text/csv');
    const dropZone = screen.getByText('Upload invoice files').closest('div');
    
    // Simulate drag enter
    fireEvent.dragEnter(dropZone, {
      dataTransfer: new MockDataTransfer([file])
    });
    
    expect(screen.getByText('Drop files here')).toBeInTheDocument();
    
    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: new MockDataTransfer([file])
    });
    
    await waitFor(() => {
      expect(FileValidator.validateFile).toHaveBeenCalledWith(file);
      expect(mockOnFileSelect).toHaveBeenCalled();
    });
  });

  test('should display selected files', async () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const file = new MockFile('invoice.csv', 2048, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
      expect(screen.getByText('test.csv')).toBeInTheDocument();
      expect(screen.getByText('1000 Bytes • CSV')).toBeInTheDocument();
    });
  });

  test('should handle file removal', async () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} onFileRemove={mockOnFileRemove} />);
    
    const file = new MockFile('test.csv', 1000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
    });
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(mockOnFileRemove).toHaveBeenCalled();
      expect(screen.queryByText('Selected Files (1)')).not.toBeInTheDocument();
    });
  });

  test('should handle validation errors', async () => {
    const validationError = new FileValidationError('Invalid file type', 'INVALID_TYPE');
    FileValidator.validateFile.mockImplementation(() => {
      throw validationError;
    });
    
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const file = new MockFile('test.pdf', 1000, 'application/pdf');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(mockOnFileSelect).not.toHaveBeenCalled();
      // Error should be displayed in UploadProgress component
    });
  });

  test('should handle multiple files when enabled', async () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} multiple={true} />);
    
    const files = [
      new MockFile('file1.csv', 1000, 'text/csv'),
      new MockFile('file2.txt', 2000, 'text/plain')
    ];
    
    FileValidator.validateFile
      .mockReturnValueOnce({
        isValid: true,
        fileName: 'file1.csv',
        fileSize: 1000,
        fileType: 'csv',
        formattedSize: '1000 Bytes'
      })
      .mockReturnValueOnce({
        isValid: true,
        fileName: 'file2.txt',
        fileSize: 2000,
        fileType: 'txt',
        formattedSize: '2000 Bytes'
      });
    
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files } });
    
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledTimes(2);
      expect(screen.getByText('Selected Files (2)')).toBeInTheDocument();
    });
  });

  test('should be disabled when disabled prop is true', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} disabled={true} />);
    
    const dropZone = screen.getByText('Upload invoice files').closest('div');
    expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed');
    
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    expect(input).toBeDisabled();
  });

  test('should show upload progress', async () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const file = new MockFile('test.csv', 1000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      // UploadProgress component should be rendered
      expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
    });
  });

  test('should handle drag leave', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const dropZone = screen.getByText('Upload invoice files').closest('div');
    
    // Simulate drag enter
    fireEvent.dragEnter(dropZone);
    expect(screen.getByText('Drop files here')).toBeInTheDocument();
    
    // Simulate drag leave
    fireEvent.dragLeave(dropZone);
    expect(screen.getByText('Upload invoice files')).toBeInTheDocument();
  });

  test('should prevent default on drag events', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const dropZone = screen.getByText('Upload invoice files').closest('div');
    
    const dragOverEvent = new Event('dragover', { bubbles: true });
    const preventDefaultSpy = vi.spyOn(dragOverEvent, 'preventDefault');
    
    fireEvent(dropZone, dragOverEvent);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  test('should reset input value after file selection', async () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const file = new MockFile('test.csv', 1000, 'text/csv');
    const input = screen.getByRole('button').querySelector('input[type="file"]');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  test('should apply custom className', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} className="custom-class" />);
    
    const container = screen.getByText('Upload invoice files').closest('.custom-class');
    expect(container).toBeInTheDocument();
  });

  test('should not handle drop when disabled', () => {
    render(<FileUploader onFileSelect={mockOnFileSelect} disabled={true} />);
    
    const file = new MockFile('test.csv', 1000, 'text/csv');
    const dropZone = screen.getByText('Upload invoice files').closest('div');
    
    fireEvent.drop(dropZone, {
      dataTransfer: new MockDataTransfer([file])
    });
    
    expect(FileValidator.validateFile).not.toHaveBeenCalled();
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });
});