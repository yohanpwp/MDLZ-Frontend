/**
 * ImportData Component Tests
 * 
 * Tests for the ImportData page component including file upload,
 * validation, preview, and import functionality.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import ImportData from '../../pages/MasterData/ImportData';

// Mock UI components
vi.mock('../../components/ui/Button', () => ({
  default: ({ children, onClick, variant, disabled, className, ...props }) => (
    <button 
      onClick={onClick} 
      data-variant={variant} 
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('../../components/ui/Badge', () => ({
  Badge: ({ children, variant, className }) => (
    <span data-testid="badge" data-variant={variant} className={className}>
      {children}
    </span>
  )
}));

// Mock FileUploader component
vi.mock('../../components/file-upload/FileUploader', () => ({
  default: ({ onFileSelect, onFileRemove, disabled }) => (
    <div data-testid="file-uploader">
      <button 
        onClick={() => onFileSelect && onFileSelect({ 
          id: 'test-file', 
          fileName: 'test.csv', 
          fileType: 'csv' 
        })}
        disabled={disabled}
      >
        Upload File
      </button>
      <button onClick={() => onFileRemove && onFileRemove({ id: 'test-file' })}>
        Remove File
      </button>
    </div>
  )
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Upload: () => <div data-testid="upload-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Eye: () => <div data-testid="eye-icon" />
}));

describe('ImportData Component', () => {
  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        masterData: (state = {
          importStatus: 'idle',
          importProgress: 0,
          importResults: null,
          importErrors: [],
          isImporting: false,
          ...initialState.masterData
        }) => state,
        auth: (state = {
          user: { id: 1, name: 'Test User' },
          permissions: ['import_data']
        }) => state
      },
      preloadedState: initialState
    });
  };

  const renderWithProviders = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ImportData {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the import data page correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Import Master Data')).toBeInTheDocument();
      expect(screen.getByText(/Upload CSV or Excel files/)).toBeInTheDocument();
      expect(screen.getByTestId('file-uploader')).toBeInTheDocument();
    });

    it('shows import type selection options', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Import Type')).toBeInTheDocument();
      expect(screen.getByText('Customers')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Suppliers')).toBeInTheDocument();
    });

    it('displays import options and settings', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Import Options')).toBeInTheDocument();
      expect(screen.getByText('Validate data before import')).toBeInTheDocument();
      expect(screen.getByText('Skip duplicate records')).toBeInTheDocument();
      expect(screen.getByText('Create backup before import')).toBeInTheDocument();
    });
  });

  describe('File Upload', () => {
    it('handles file selection', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      expect(screen.getByText('Selected Files')).toBeInTheDocument();
      expect(screen.getByText('test.csv')).toBeInTheDocument();
    });

    it('enables import button when file is selected', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      const importButton = screen.getByText('Start Import');
      expect(importButton).not.toBeDisabled();
    });

    it('handles file removal', () => {
      const store = createMockStore();
      renderWithProviders(store);

      // Upload file first
      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      // Remove file
      const removeButton = screen.getByText('Remove File');
      fireEvent.click(removeButton);

      const importButton = screen.getByText('Start Import');
      expect(importButton).toBeDisabled();
    });
  });

  describe('Import Type Selection', () => {
    it('allows selecting import type', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const customersOption = screen.getByLabelText('Customers');
      fireEvent.click(customersOption);

      expect(customersOption).toBeChecked();
    });

    it('shows different field mappings for different types', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const customersOption = screen.getByLabelText('Customers');
      fireEvent.click(customersOption);

      expect(screen.getByText('Customer Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();

      const productsOption = screen.getByLabelText('Products');
      fireEvent.click(productsOption);

      expect(screen.getByText('Product Name')).toBeInTheDocument();
      expect(screen.getByText('SKU')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });
  });

  describe('Import Options', () => {
    it('allows toggling validation option', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const validateCheckbox = screen.getByLabelText('Validate data before import');
      fireEvent.click(validateCheckbox);

      expect(validateCheckbox).toBeChecked();
    });

    it('allows toggling skip duplicates option', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const skipDuplicatesCheckbox = screen.getByLabelText('Skip duplicate records');
      fireEvent.click(skipDuplicatesCheckbox);

      expect(skipDuplicatesCheckbox).toBeChecked();
    });

    it('allows toggling backup option', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const backupCheckbox = screen.getByLabelText('Create backup before import');
      fireEvent.click(backupCheckbox);

      expect(backupCheckbox).toBeChecked();
    });
  });

  describe('Import Process', () => {
    it('shows import progress when importing', () => {
      const store = createMockStore({
        masterData: {
          isImporting: true,
          importProgress: 45,
          importStatus: 'processing'
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Import in Progress')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('disables form during import', () => {
      const store = createMockStore({
        masterData: {
          isImporting: true,
          importProgress: 45
        }
      });
      renderWithProviders(store);

      const importButton = screen.getByText('Cancel Import');
      expect(importButton).toBeInTheDocument();
      
      const fileUploader = screen.getByTestId('file-uploader');
      expect(fileUploader.querySelector('button')).toBeDisabled();
    });

    it('shows import results when completed', () => {
      const store = createMockStore({
        masterData: {
          importStatus: 'completed',
          importResults: {
            totalRecords: 100,
            successfulRecords: 95,
            failedRecords: 5,
            duplicateRecords: 3
          }
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Import Completed')).toBeInTheDocument();
      expect(screen.getByText('100 total records')).toBeInTheDocument();
      expect(screen.getByText('95 successful')).toBeInTheDocument();
      expect(screen.getByText('5 failed')).toBeInTheDocument();
    });

    it('shows import errors when failed', () => {
      const store = createMockStore({
        masterData: {
          importStatus: 'failed',
          importErrors: [
            { row: 5, field: 'email', message: 'Invalid email format' },
            { row: 12, field: 'phone', message: 'Phone number required' }
          ]
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Import Failed')).toBeInTheDocument();
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(screen.getByText('Phone number required')).toBeInTheDocument();
    });
  });

  describe('Data Preview', () => {
    it('shows data preview when file is uploaded', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(screen.getByText('Data Preview')).toBeInTheDocument();
      });
    });

    it('allows previewing data before import', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      const previewButton = screen.getByText('Preview Data');
      fireEvent.click(previewButton);

      expect(screen.getByText('First 10 rows')).toBeInTheDocument();
    });
  });

  describe('Field Mapping', () => {
    it('shows field mapping interface', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const customersOption = screen.getByLabelText('Customers');
      fireEvent.click(customersOption);

      expect(screen.getByText('Field Mapping')).toBeInTheDocument();
      expect(screen.getByText('Map CSV columns to database fields')).toBeInTheDocument();
    });

    it('allows mapping CSV columns to database fields', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const customersOption = screen.getByLabelText('Customers');
      fireEvent.click(customersOption);

      const nameMapping = screen.getByLabelText('Customer Name');
      fireEvent.change(nameMapping, { target: { value: 'Column A' } });

      expect(nameMapping.value).toBe('Column A');
    });
  });

  describe('Validation', () => {
    it('validates required fields before import', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const importButton = screen.getByText('Start Import');
      fireEvent.click(importButton);

      expect(screen.getByText('Please select a file to import')).toBeInTheDocument();
    });

    it('validates import type selection', () => {
      const store = createMockStore();
      renderWithProviders(store);

      // Upload file but don't select import type
      const uploadButton = screen.getByText('Upload File');
      fireEvent.click(uploadButton);

      const importButton = screen.getByText('Start Import');
      fireEvent.click(importButton);

      expect(screen.getByText('Please select an import type')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByLabelText('Customers')).toBeInTheDocument();
      expect(screen.getByLabelText('Products')).toBeInTheDocument();
      expect(screen.getByLabelText('Validate data before import')).toBeInTheDocument();
    });

    it('has proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Import Master Data');
    });

    it('has proper button roles', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      buttons.forEach(button => {
        expect(button).toBeInTheDocument();
      });
    });
  });
});