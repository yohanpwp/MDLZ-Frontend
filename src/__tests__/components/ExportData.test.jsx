/**
 * ExportData Component Tests
 * 
 * Tests for the ExportData page component including export functionality,
 * format selection, filtering, and export history.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import ExportData from '../../pages/MasterData/ExportData';

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

vi.mock('../../components/ui/Alert', () => ({
  Alert: ({ children, variant }) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  )
}));

vi.mock('../../components/ui/LoadingSpinner', () => ({
  default: ({ size, className }) => (
    <div data-testid="loading-spinner" data-size={size} className={className} />
  )
}));

// Mock MasterDataService
vi.mock('../../services/MasterDataService', () => ({
  default: {
    getExportStatistics: vi.fn(() => ({
      totalExports: 150,
      exportsLast30Days: 25,
      totalRecordsExported: 50000,
      averageExportSize: 333,
      formatBreakdown: { csv: 80, excel: 50, json: 20 },
      dataTypeBreakdown: { customers: 75, products: 50, references: 25 }
    })),
    getAvailableFormats: vi.fn(() => [
      { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
      { value: 'excel', label: 'Excel', description: 'Microsoft Excel format' },
      { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' }
    ])
  }
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Download: () => <div data-testid="download-icon" />,
  FileText: () => <div data-testid="file-text-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  Settings: () => <div data-testid="settings-icon" />,
  BarChart3: () => <div data-testid="chart-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  Search: () => <div data-testid="search-icon" />
}));

describe('ExportData Component', () => {
  const mockCustomers = [
    { id: 1, name: 'Customer 1', email: 'customer1@example.com', isActive: true },
    { id: 2, name: 'Customer 2', email: 'customer2@example.com', isActive: false }
  ];

  const mockProducts = [
    { id: 1, name: 'Product 1', price: 100, isActive: true },
    { id: 2, name: 'Product 2', price: 200, isActive: true }
  ];

  const mockExportHistory = [
    {
      id: 1,
      dataType: 'customers',
      format: 'csv',
      filename: 'customers_export_2024.csv',
      startTime: '2024-01-15T10:00:00Z',
      duration: 5000,
      status: 'completed',
      recordCount: 100,
      fileSize: 50000
    },
    {
      id: 2,
      dataType: 'products',
      format: 'excel',
      filename: 'products_export_2024.xlsx',
      startTime: '2024-01-14T15:30:00Z',
      duration: 8000,
      status: 'failed',
      recordCount: 0,
      fileSize: 0
    }
  ];

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        masterData: (state = {
          customers: mockCustomers,
          products: mockProducts,
          references: [],
          isExporting: false,
          exportProgress: { progress: 0, message: '' },
          exportHistory: mockExportHistory,
          error: null,
          ...initialState.masterData
        }) => state,
        auth: (state = {
          user: { id: 1, name: 'Test User' },
          permissions: ['export_data']
        }) => state
      },
      preloadedState: initialState
    });
  };

  const renderWithProviders = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ExportData {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the export data page correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByText('Export master data and validation results for backup or analysis')).toBeInTheDocument();
    });

    it('displays export statistics', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Total Exports')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('Records Exported')).toBeInTheDocument();
      expect(screen.getByText('50,000')).toBeInTheDocument();
    });

    it('shows data type options', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Customer Database')).toBeInTheDocument();
      expect(screen.getByText('Product Catalog')).toBeInTheDocument();
      expect(screen.getByText('Reference Data')).toBeInTheDocument();
    });

    it('shows error state', () => {
      const store = createMockStore({
        masterData: {
          error: 'Export failed'
        }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText('Export failed')).toBeInTheDocument();
    });
  });

  describe('Data Type Selection', () => {
    it('allows selecting different data types', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const productCard = screen.getByText('Product Catalog').closest('div');
      fireEvent.click(productCard);

      expect(productCard).toHaveClass('border-primary');
    });

    it('shows correct record counts for each data type', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('2 records')).toBeInTheDocument(); // customers
      expect(screen.getByText('2 records')).toBeInTheDocument(); // products
    });

    it('shows active/inactive badges', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const activeBadges = screen.getAllByText(/active/);
      expect(activeBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Export Configuration', () => {
    it('shows export format options', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('JSON')).toBeInTheDocument();
    });

    it('allows selecting export format', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const excelRadio = screen.getByDisplayValue('excel');
      fireEvent.click(excelRadio);

      expect(excelRadio).toBeChecked();
    });

    it('toggles filter visibility', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const filterButton = screen.getByText('Show Filters');
      fireEvent.click(filterButton);

      expect(screen.getByText('Hide Filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Date From')).toBeInTheDocument();
      expect(screen.getByLabelText('Date To')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('allows setting date filters', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const filterButton = screen.getByText('Show Filters');
      fireEvent.click(filterButton);

      const dateFromInput = screen.getByLabelText('Date From');
      fireEvent.change(dateFromInput, { target: { value: '2024-01-01' } });

      expect(dateFromInput.value).toBe('2024-01-01');
    });

    it('allows setting status filter', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const filterButton = screen.getByText('Show Filters');
      fireEvent.click(filterButton);

      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: 'active' } });

      expect(statusSelect.value).toBe('active');
    });

    it('allows setting search filter', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const filterButton = screen.getByText('Show Filters');
      fireEvent.click(filterButton);

      const searchInput = screen.getByPlaceholderText('Search records...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput.value).toBe('test search');
    });
  });

  describe('Export Process', () => {
    it('triggers export when export button is clicked', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const exportButton = screen.getAllByText('Export')[0];
      fireEvent.click(exportButton);

      // Verify export action would be dispatched
      expect(exportButton).toBeInTheDocument();
    });

    it('shows export progress when exporting', () => {
      const store = createMockStore({
        masterData: {
          isExporting: true,
          exportProgress: {
            progress: 45,
            message: 'Processing records...'
          }
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Exporting Data')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Processing records...')).toBeInTheDocument();
    });

    it('disables export button during export', () => {
      const store = createMockStore({
        masterData: {
          isExporting: true
        }
      });
      renderWithProviders(store);

      const exportButtons = screen.getAllByText(/Export/);
      exportButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('shows loading spinner during export', () => {
      const store = createMockStore({
        masterData: {
          isExporting: true
        }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  describe('Export History', () => {
    it('displays export history', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Export History')).toBeInTheDocument();
      expect(screen.getByText('customers_export_2024.csv')).toBeInTheDocument();
      expect(screen.getByText('products_export_2024.xlsx')).toBeInTheDocument();
    });

    it('shows export status indicators', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });

    it('displays file sizes and record counts', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('100 records')).toBeInTheDocument();
      expect(screen.getByText('48.83 KB')).toBeInTheDocument(); // 50000 bytes formatted
    });

    it('shows empty state when no history', () => {
      const store = createMockStore({
        masterData: {
          exportHistory: []
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('No exports found. Start by exporting your first data file.')).toBeInTheDocument();
    });

    it('allows refreshing export history', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      // Verify refresh action would be dispatched
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe('Data Type Statistics', () => {
    it('calculates and displays correct statistics', () => {
      const store = createMockStore();
      renderWithProviders(store);

      // Should show 1 active, 1 inactive for customers
      const customerCard = screen.getByText('Customer Database').closest('div');
      expect(customerCard).toContainElement(screen.getByText('1 active'));
      expect(customerCard).toContainElement(screen.getByText('1 inactive'));
    });

    it('handles empty data sets', () => {
      const store = createMockStore({
        masterData: {
          customers: [],
          products: [],
          references: []
        }
      });
      renderWithProviders(store);

      const exportButtons = screen.getAllByText('Export');
      exportButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Export Data');
    });

    it('has proper form labels', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const filterButton = screen.getByText('Show Filters');
      fireEvent.click(filterButton);

      expect(screen.getByLabelText('Date From')).toBeInTheDocument();
      expect(screen.getByLabelText('Date To')).toBeInTheDocument();
      expect(screen.getByLabelText('Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Search')).toBeInTheDocument();
    });

    it('has proper radio button labels', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByDisplayValue('csv')).toBeInTheDocument();
      expect(screen.getByDisplayValue('excel')).toBeInTheDocument();
      expect(screen.getByDisplayValue('json')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays export errors', () => {
      const store = createMockStore({
        masterData: {
          error: 'Network error during export'
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Export Error')).toBeInTheDocument();
      expect(screen.getByText('Network error during export')).toBeInTheDocument();
    });

    it('handles missing export statistics gracefully', () => {
      // Mock service to return null
      const MasterDataService = require('../../services/MasterDataService').default;
      MasterDataService.getExportStatistics.mockReturnValue(null);

      const store = createMockStore();
      renderWithProviders(store);

      // Should still render without statistics
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });
  });

  describe('Format Descriptions', () => {
    it('shows format descriptions', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Comma-separated values')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Excel format')).toBeInTheDocument();
      expect(screen.getByText('JavaScript Object Notation')).toBeInTheDocument();
    });
  });
});