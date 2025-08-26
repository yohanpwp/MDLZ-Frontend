import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileUploader from '../FileUploader';

// Mock the FileValidator
vi.mock('../../../utils/FileValidator', () => ({
  FileValidator: {
    validateFile: vi.fn(() => ({
      isValid: true,
      fileName: 'test.csv',
      fileSize: 1000,
      fileType: 'csv',
      formattedSize: '1000 Bytes'
    })),
    getAllowedExtensions: vi.fn(() => ['.csv', '.txt']),
    formatFileSize: vi.fn(() => '10 MB'),
    getMaxFileSize: vi.fn(() => 10485760)
  },
  FileValidationError: class extends Error {
    constructor(message, code) {
      super(message);
      this.code = code;
    }
  }
}));

describe('FileUploader', () => {
  it('should render upload area with correct text', () => {
    render(<FileUploader />);
    
    expect(screen.getByText('Upload invoice files')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your files here, or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: .csv, .txt')).toBeInTheDocument();
  });

  it('should call onFileSelect when file is selected', () => {
    const mockOnFileSelect = vi.fn();
    render(<FileUploader onFileSelect={mockOnFileSelect} />);
    
    const fileInput = screen.getByRole('button', { hidden: true });
    const file = new File(['test content'], 'test.csv', { type: 'text/csv' });
    
    // Find the hidden input and trigger change
    const hiddenInput = document.querySelector('input[type="file"]');
    fireEvent.change(hiddenInput, { target: { files: [file] } });
    
    // Note: Due to mocking, we can't fully test the file validation flow
    // but we can verify the component renders correctly
    expect(mockOnFileSelect).toHaveBeenCalled();
  });

  it('should show disabled state when disabled prop is true', () => {
    render(<FileUploader disabled={true} />);
    
    const uploadArea = screen.getByText('Upload invoice files').closest('div');
    expect(uploadArea).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('should accept multiple files when multiple prop is true', () => {
    render(<FileUploader multiple={true} />);
    
    const hiddenInput = document.querySelector('input[type="file"]');
    expect(hiddenInput).toHaveAttribute('multiple');
  });
});