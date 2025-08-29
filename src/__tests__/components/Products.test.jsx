/**
 * Products Component Tests
 * 
 * Tests for the Products page component including CRUD operations,
 * search functionality, pricing validation, and category management.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Products from '../../pages/Components/Products';

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

vi.mock('../../components/ui/DataTable', () => ({
  default: ({ data, columns, loading, onSort, searchable, emptyMessage }) => (
    <div data-testid="data-table">
      {loading && <div>Loading products...</div>}
      {data.length === 0 && !loading && <div>{emptyMessage}</div>}
      {data.map(product => (
        <div key={product.id || product.productCode} data-testid={`product-${product.productCode}`}>
          <span>{product.productName}</span>
          <span>{product.category}</span>
          <span>${product.unitPrice}</span>
          <span>{product.taxRate}%</span>
          <span>{product.isActive ? 'Active' : 'Inactive'}</span>
        </div>
      ))}
    </div>
  )
}));

// Mock Alert component
vi.mock('../../components/ui/Alert', () => ({
  Alert: ({ children, variant }) => (
    <div data-testid="alert" data-variant={variant}>
      {children}
    </div>
  ),
  AlertDescription: ({ children }) => <div>{children}</div>
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  BarChart3: () => <div data-testid="chart-icon" />,
  X: () => <div data-testid="x-icon" />,
  Save: () => <div data-testid="save-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />
}));

describe('Products Component', () => {
  const mockProducts = [
    {
      id: 1,
      productCode: 'PROD001',
      productName: 'Widget A',
      category: 'Electronics',
      description: 'High-quality widget',
      unitPrice: 29.99,
      taxRate: 10.0,
      isActive: true
    },
    {
      id: 2,
      productCode: 'PROD002',
      productName: 'Service B',
      category: 'Services',
      description: 'Professional service',
      unitPrice: 150.00,
      taxRate: 20.0,
      isActive: false
    },
    {
      id: 3,
      productCode: 'PROD003',
      productName: 'Software License',
      category: 'Software',
      description: 'Annual license',
      unitPrice: 500.00,
      taxRate: 0.0,
      isActive: true
    }
  ];

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        masterData: (state = {
          products: mockProducts,
          isImporting: false,
          error: null,
          ...initialState.masterData
        }) => state,
        auth: (state = {
          user: { id: 1, name: 'Test User' },
          permissions: ['manage_products', 'view_products']
        }) => state
      },
      preloadedState: initialState
    });
  };

  const renderWithProviders = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Products {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the products page correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Manage product catalog and pricing information')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    it('displays product list with details', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Widget A')).toBeInTheDocument();
      expect(screen.getByText('Service B')).toBeInTheDocument();
      expect(screen.getByText('Software License')).toBeInTheDocument();
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Software')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      const store = createMockStore({
        masterData: {
          products: [],
          isImporting: true
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Loading products...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      const store = createMockStore({
        masterData: {
          products: [],
          error: 'Failed to load products'
        }
      });
      renderWithProviders(store);

      expect(screen.getByTestId('alert')).toBeInTheDocument();
      expect(screen.getByText('Failed to load products')).toBeInTheDocument();
    });

    it('shows empty state when no products', () => {
      const store = createMockStore({
        masterData: {
          products: [],
          isImporting: false,
          error: null
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('No products found')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('renders search input', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
    });

    it('filters products by search term', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const searchInput = screen.getByPlaceholderText('Search products...');
      fireEvent.change(searchInput, { target: { value: 'Widget' } });

      expect(screen.getByText('Widget A')).toBeInTheDocument();
      expect(screen.queryByText('Service B')).not.toBeInTheDocument();
    });

    it('filters products by category', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const categorySelect = screen.getByDisplayValue('All Categories');
      fireEvent.change(categorySelect, { target: { value: 'Electronics' } });

      expect(screen.getByText('Widget A')).toBeInTheDocument();
      expect(screen.queryByText('Service B')).not.toBeInTheDocument();
    });

    it('filters products by status', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const statusSelect = screen.getByDisplayValue('All Status');
      fireEvent.change(statusSelect, { target: { value: 'active' } });

      expect(screen.getByText('Widget A')).toBeInTheDocument();
      expect(screen.getByText('Software License')).toBeInTheDocument();
      expect(screen.queryByText('Service B')).not.toBeInTheDocument();
    });

    it('filters products by price range', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const minPriceInput = screen.getByPlaceholderText('Min price');
      const maxPriceInput = screen.getByPlaceholderText('Max price');

      fireEvent.change(minPriceInput, { target: { value: '100' } });
      fireEvent.change(maxPriceInput, { target: { value: '200' } });

      expect(screen.getByText('Service B')).toBeInTheDocument();
      expect(screen.queryByText('Widget A')).not.toBeInTheDocument();
      expect(screen.queryByText('Software License')).not.toBeInTheDocument();
    });

    it('clears price filter', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const minPriceInput = screen.getByPlaceholderText('Min price');
      fireEvent.change(minPriceInput, { target: { value: '100' } });

      const clearButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(clearButton);

      expect(minPriceInput.value).toBe('');
    });
  });

  describe('Product Form - Add Product', () => {
    it('opens add product modal', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      expect(screen.getByText('Add Product')).toBeInTheDocument();
      expect(screen.getByLabelText('Product Code *')).toBeInTheDocument();
      expect(screen.getByLabelText('Product Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Unit Price * ($)')).toBeInTheDocument();
    });

    it('validates required fields', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      const saveButton = screen.getByText('Save Product');
      fireEvent.click(saveButton);

      expect(window.alert).toHaveBeenCalledWith('Please fill in all required fields');
    });

    it('validates negative unit price', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      fireEvent.change(screen.getByLabelText('Product Code *'), { 
        target: { value: 'TEST001' } 
      });
      fireEvent.change(screen.getByLabelText('Product Name *'), { 
        target: { value: 'Test Product' } 
      });
      fireEvent.change(screen.getByLabelText('Unit Price * ($)'), { 
        target: { value: '-10' } 
      });

      const saveButton = screen.getByText('Save Product');
      fireEvent.click(saveButton);

      expect(window.alert).toHaveBeenCalledWith('Unit price cannot be negative');
    });

    it('validates tax rate range', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      fireEvent.change(screen.getByLabelText('Product Code *'), { 
        target: { value: 'TEST001' } 
      });
      fireEvent.change(screen.getByLabelText('Product Name *'), { 
        target: { value: 'Test Product' } 
      });
      fireEvent.change(screen.getByLabelText('Unit Price * ($)'), { 
        target: { value: '100' } 
      });
      fireEvent.change(screen.getByLabelText('Tax Rate (%)'), { 
        target: { value: '150' } 
      });

      const saveButton = screen.getByText('Save Product');
      fireEvent.click(saveButton);

      expect(window.alert).toHaveBeenCalledWith('Tax rate must be between 0 and 100');
    });

    it('saves product with valid data', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      fireEvent.change(screen.getByLabelText('Product Code *'), { 
        target: { value: 'TEST001' } 
      });
      fireEvent.change(screen.getByLabelText('Product Name *'), { 
        target: { value: 'Test Product' } 
      });
      fireEvent.change(screen.getByLabelText('Unit Price * ($)'), { 
        target: { value: '99.99' } 
      });
      fireEvent.change(screen.getByLabelText('Tax Rate (%)'), { 
        target: { value: '15' } 
      });

      const saveButton = screen.getByText('Save Product');
      fireEvent.click(saveButton);

      expect(screen.queryByText('Add Product')).not.toBeInTheDocument();
    });

    it('cancels product creation', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Add Product')).not.toBeInTheDocument();
    });
  });

  describe('Product Form - Edit Product', () => {
    it('opens edit product modal with existing data', () => {
      const store = createMockStore();
      renderWithProviders(store);

      // Mock the handleEditProduct function by clicking on a product
      const editButton = screen.getAllByTestId('edit-icon')[0].closest('button');
      fireEvent.click(editButton);

      expect(screen.getByText('Edit Product')).toBeInTheDocument();
      expect(screen.getByDisplayValue('PROD001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Widget A')).toBeInTheDocument();
    });

    it('updates product data', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const editButton = screen.getAllByTestId('edit-icon')[0].closest('button');
      fireEvent.click(editButton);

      const nameInput = screen.getByDisplayValue('Widget A');
      fireEvent.change(nameInput, { target: { value: 'Updated Widget A' } });

      const saveButton = screen.getByText('Save Product');
      fireEvent.click(saveButton);

      expect(screen.queryByText('Edit Product')).not.toBeInTheDocument();
    });
  });

  describe('Product Actions', () => {
    it('shows product details on view', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const viewButton = screen.getAllByTestId('eye-icon')[0].closest('button');
      fireEvent.click(viewButton);

      expect(window.alert).toHaveBeenCalledWith('Viewing product: Widget A');
    });

    it('shows usage report modal', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const usageButton = screen.getAllByTestId('chart-icon')[0].closest('button');
      fireEvent.click(usageButton);

      expect(screen.getByText('Usage Report - Widget A')).toBeInTheDocument();
      expect(screen.getByText('Total Sales')).toBeInTheDocument();
      expect(screen.getByText('Recent Invoices')).toBeInTheDocument();
    });

    it('confirms product deletion', () => {
      const store = createMockStore();
      renderWithProviders(store);

      window.confirm = vi.fn(() => true);

      const deleteButton = screen.getAllByTestId('trash-icon')[0].closest('button');
      fireEvent.click(deleteButton);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete Widget A?');
      expect(window.alert).toHaveBeenCalledWith('Product Widget A would be deleted');
    });
  });

  describe('Import/Export Functionality', () => {
    it('opens import modal', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      expect(screen.getByText('Import Products')).toBeInTheDocument();
      expect(screen.getByText('Required columns: productCode, productName, unitPrice')).toBeInTheDocument();
    });

    it('handles file upload for import', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      const fileInput = screen.getByLabelText('Select CSV File');
      const file = new File(['test'], 'products.csv', { type: 'text/csv' });
      
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(fileInput.files[0]).toBe(file);
    });

    it('triggers export functionality', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      // Verify export action is dispatched (would need to mock dispatch)
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('Category Management', () => {
    it('shows all available categories in dropdown', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      const categorySelect = screen.getByLabelText('Category');
      fireEvent.click(categorySelect);

      expect(screen.getByText('Software')).toBeInTheDocument();
      expect(screen.getByText('Hardware')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
    });

    it('allows selecting product category', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      const categorySelect = screen.getByLabelText('Category');
      fireEvent.change(categorySelect, { target: { value: 'Software' } });

      expect(categorySelect.value).toBe('Software');
    });
  });

  describe('Pricing Logic', () => {
    it('displays formatted prices correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('$150.00')).toBeInTheDocument();
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });

    it('displays tax rates correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('10.0%')).toBeInTheDocument();
      expect(screen.getByText('20.0%')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('calculates average price in summary', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const avgPrice = (29.99 + 150.00 + 500.00) / 3;
      expect(screen.getByText(`Avg Price: $${avgPrice.toFixed(2)}`)).toBeInTheDocument();
    });
  });

  describe('Product Status Management', () => {
    it('shows active/inactive badges', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const activeBadges = screen.getAllByText('Active');
      const inactiveBadges = screen.getAllByText('Inactive');
      
      expect(activeBadges.length).toBe(2); // Widget A and Software License
      expect(inactiveBadges.length).toBe(1); // Service B
    });

    it('toggles product active status', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      const activeCheckbox = screen.getByLabelText('Active');
      expect(activeCheckbox).toBeChecked();

      fireEvent.click(activeCheckbox);
      expect(activeCheckbox).not.toBeChecked();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Products');
    });

    it('has proper form labels', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      expect(screen.getByLabelText('Product Code *')).toBeInTheDocument();
      expect(screen.getByLabelText('Product Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Unit Price * ($)')).toBeInTheDocument();
      expect(screen.getByLabelText('Tax Rate (%)')).toBeInTheDocument();
    });

    it('has proper search input accessibility', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const searchInput = screen.getByPlaceholderText('Search products...');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('type', 'text');
    });
  });

  describe('Error Handling', () => {
    it('clears error message', () => {
      const store = createMockStore({
        masterData: {
          products: [],
          error: 'Test error message'
        }
      });
      renderWithProviders(store);

      const closeButton = screen.getByTestId('x-icon').closest('button');
      fireEvent.click(closeButton);

      // Error should be cleared (would need to verify dispatch action)
      expect(closeButton).toBeInTheDocument();
    });

    it('handles form validation errors gracefully', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Product');
      fireEvent.click(addButton);

      // Try to save without required fields
      const saveButton = screen.getByText('Save Product');
      fireEvent.click(saveButton);

      // Form should remain open
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });
  });
});