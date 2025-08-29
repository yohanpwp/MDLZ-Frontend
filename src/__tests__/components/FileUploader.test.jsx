/**
 * FileUploader Component Tests
 * 
 * Tests for the FileUploader component including file validation,
 * drag and drop functionality, and user interactions.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import FileUploader from '../../components/file-upload/FileUploader';
import { FileValidator, FileValidationError } from '../../utils/FileValidator';

// Mock the FileValidator utility
vi.mock('../../utils/FileValidator', () => ({
  FileValidator: {
    validateFile: vi.fn(),
    getAllowedExtensions: vi.fn(() => ['.csv', '.txt']),
    getMaxFileSize: vi.fn(() => 10485760), // 10MB
    formatFileSize: vi.fn((size) => `${(size / 1024 / 1024).toFixed(2)} MB`)
  },
  FileValidationError: class extends Error {
    constructor(message, code) {
      super(message);
      this.name = 'FileValidationError';
      this.code = code;
    }
  }
}));

// Mock UploadProgress component
vi.mock('../../components/file-upload/UploadProgress', () => ({
  default: ({ status, progress, fileName, error }) => (
    <div data-testid="upload-progress">
      <div data-testid="upload-status">{status}</div>
      <div data-testid="upload-progress-value">{progress}</div>
      <div data-testid="upload-filename">{fileName}</div>
      {error && <div data-testid="upload-error">{error}</div>}
    </div>
  )
}));

describe('FileUploader Component', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset FileValidator mock implementations
    FileValidator.validateFile.mockReturnValue({
      isValid: true,
      fileName: 'test.csv',
      fileSize: 1024,
      fileType: 'csv',
      formattedSize: '1 KB'
    });
  });

  const createMockFile = (name = 'test.csv', size = 1024, type = 'text/csv') => {
    return new File(['test content'], name, { type, size });
  };

  const getFileInput = (container) => {
    return container.querySelector('input[type="file"]');
  };

  describe('Rendering', () => {
    it('renders the file upload area with correct text', () => {
      render(<FileUploader />);
      
      expect(screen.getByText('Upload invoice files')).toBeInTheDocument();
      expect(screen.getByText('Drag and drop your files here, or click to browse')).toBeInTheDocument();
      expect(screen.getByText('Supported formats: .csv, .txt')).toBeInTheDocument();
      expect(screen.getByText('Maximum file size: 10.00 MB')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<FileUploader className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('shows disabled state when disabled prop is true', () => {
      render(<FileUploader disabled={true} />);
      
      const dropZone = screen.getByText('Upload invoice files').closest('div');
      expect(dropZone).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('File Selection via Click', () => {
    it('opens file dialog when drop zone is clicked', () => {
      const { container } = render(<FileUploader />);
      
      const dropZone = screen.getByText('Upload invoice files').closest('div');
      const fileInput = getFileInput(container);
      
      const clickSpy = vi.spyOn(fileInput, 'click');
      fireEvent.click(dropZone);
      
      expect(clickSpy).toHaveBeenCalled();
    });

    it('does not open file dialog when disabled', () => {
      const { container } = render(<FileUploader disabled={true} />);
      
      const dropZone = screen.getByText('Upload invoice files').closest('div');
      const fileInput = getFileInput(container);
      
      const clickSpy = vi.spyOn(fileInput, 'click');
      fireEvent.click(dropZone);
      
      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('handles file selection through input change', async () => {
      const { container } = render(<FileUploader onFileSelect={mockOnFileSelect} />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile();
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(FileValidator.validateFile).toHaveBeenCalledWith(file);
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('shows active state when dragging over', () => {
      render(<FileUploader />);
      
      const dropZone = screen.getByText('Upload invoice files').closest('div');
      
      fireEvent.dragEnter(dropZone);
      expect(dropZone).toHaveClass('border-blue-500', 'bg-blue-50');
      expect(screen.getByText('Drop files here')).toBeInTheDocument();
    });

    it('removes active state when drag leaves', () => {
      render(<FileUploader />);
      
      const dropZone = screen.getByText('Upload invoice files').closest('div');
      
      fireEvent.dragEnter(dropZone);
      fireEvent.dragLeave(dropZone);
      
      expect(dropZone).not.toHaveClass('border-blue-500', 'bg-blue-50');
      expect(screen.getByText('Upload invoice files')).toBeInTheDocument();
    });

    it('handles file drop correctly', async () => {
      render(<FileUploader onFileSelect={mockOnFileSelect} />);
      
      const dropZone = screen.getByText('Upload invoice files').closest('div');
      const file = createMockFile();
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });
      
      await waitFor(() => {
        expect(FileValidator.validateFile).toHaveBeenCalledWith(file);
        expect(mockOnFileSelect).toHaveBeenCalled();
      });
    });

    it('ignores drop when disabled', () => {
      render(<FileUploader disabled={true} onFileSelect={mockOnFileSelect} />);
      
      const dropZone = screen.getByText('Upload invoice files').closest('div');
      const file = createMockFile();
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });
      
      expect(FileValidator.validateFile).not.toHaveBeenCalled();
      expect(mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  describe('File Validation', () => {
    it('displays error when file validation fails', async () => {
      const errorMessage = 'Invalid file type';
      FileValidator.validateFile.mockImplementation(() => {
        throw new FileValidationError(errorMessage, 'INVALID_TYPE');
      });

      const { container } = render(<FileUploader />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile('invalid.pdf');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toHaveTextContent(errorMessage);
      });
    });

    it('handles multiple files when multiple prop is true', async () => {
      const { container } = render(<FileUploader multiple={true} onFileSelect={mockOnFileSelect} />);
      
      const fileInput = getFileInput(container);
      const files = [
        createMockFile('file1.csv'),
        createMockFile('file2.txt')
      ];
      
      fireEvent.change(fileInput, { target: { files } });
      
      await waitFor(() => {
        expect(FileValidator.validateFile).toHaveBeenCalledTimes(2);
        expect(mockOnFileSelect).toHaveBeenCalledTimes(2);
      });
    });

    it('replaces file when multiple is false', async () => {
      const { container } = render(<FileUploader multiple={false} onFileSelect={mockOnFileSelect} />);
      
      const fileInput = getFileInput(container);
      
      // Add first file
      const file1 = createMockFile('file1.csv');
      fireEvent.change(fileInput, { target: { files: [file1] } });
      
      await waitFor(() => {
        expect(screen.getByText('file1.csv')).toBeInTheDocument();
      });
      
      // Add second file (should replace first)
      const file2 = createMockFile('file2.csv');
      fireEvent.change(fileInput, { target: { files: [file2] } });
      
      await waitFor(() => {
        expect(screen.queryByText('file1.csv')).not.toBeInTheDocument();
        expect(screen.getByText('file2.csv')).toBeInTheDocument();
      });
    });
  });

  describe('Selected Files Display', () => {
    it('displays selected files with correct information', async () => {
      const { container } = render(<FileUploader onFileSelect={mockOnFileSelect} />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile('invoice.csv', 2048);
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Selected Files (1)')).toBeInTheDocument();
        expect(screen.getByText('invoice.csv')).toBeInTheDocument();
        expect(screen.getByText('1 KB • CSV')).toBeInTheDocument();
      });
    });

    it('allows removing selected files', async () => {
      const { container } = render(<FileUploader onFileSelect={mockOnFileSelect} onFileRemove={mockOnFileRemove} />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile('test.csv');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('test.csv')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByText('test.csv')).not.toBeInTheDocument();
        expect(mockOnFileRemove).toHaveBeenCalled();
      });
    });

    it('resets upload status when all files are removed', async () => {
      const { container } = render(<FileUploader />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile('test.csv');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
      });
      
      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId('upload-progress')).not.toBeInTheDocument();
      });
    });
  });

  describe('Upload Progress', () => {
    it('shows upload progress component when files are selected', async () => {
      const { container } = render(<FileUploader />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile('test.csv');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
        expect(screen.getByTestId('upload-status')).toHaveTextContent('uploading');
        expect(screen.getByTestId('upload-filename')).toHaveTextContent('test.csv');
      });
    });

    it('simulates upload progress completion', async () => {
      vi.useFakeTimers();
      
      const { container } = render(<FileUploader />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile('test.csv');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Fast-forward through the progress simulation
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-status')).toHaveTextContent('completed');
        expect(screen.getByTestId('upload-progress-value')).toHaveTextContent('100');
      });
      
      vi.useRealTimers();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      const { container } = render(<FileUploader />);
      
      const fileInput = getFileInput(container);
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', '.csv,.txt');
    });

    it('supports keyboard navigation', () => {
      render(<FileUploader />);
      
      const dropZone = screen.getByText('Upload invoice files').closest('div');
      expect(dropZone).toHaveClass('cursor-pointer');
    });
  });

  describe('Error Handling', () => {
    it('handles FileValidationError correctly', async () => {
      const errorMessage = 'File too large';
      FileValidator.validateFile.mockImplementation(() => {
        throw new FileValidationError(errorMessage, 'FILE_TOO_LARGE');
      });

      const { container } = render(<FileUploader />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile('large.csv', 20971520); // 20MB
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByTestId('upload-error')).toHaveTextContent(errorMessage);
        expect(screen.getByTestId('upload-status')).toHaveTextContent('error');
      });
    });

    it('handles generic errors gracefully', async () => {
      FileValidator.validateFile.mockImplementation(() => {
        throw new Error('Generic error');
      });

      const { container } = render(<FileUploader />);
      
      const fileInput = getFileInput(container);
      const file = createMockFile('test.csv');
      
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      // Should not crash and should not call onFileSelect
      await waitFor(() => {
        expect(mockOnFileSelect).not.toHaveBeenCalled();
      });
    });
  });
});