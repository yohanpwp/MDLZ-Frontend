/**
 * Customers Component Tests
 * 
 * Tests for the Customers page component including CRUD operations,
 * search functionality, and data management.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import Customers from '../../pages/Components/Customers';

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

// Mock DataTable component
vi.mock('../../components/ui/DataTable', () => ({
  default: ({ data, columns, onEdit, onDelete, onAdd }) => (
    <div data-testid="data-table">
      <button onClick={onAdd}>Add Customer</button>
      {data.map(customer => (
        <div key={customer.id} data-testid={`customer-${customer.id}`}>
          <span>{customer.name}</span>
          <span>{customer.email}</span>
          <button onClick={() => onEdit(customer)}>Edit</button>
          <button onClick={() => onDelete(customer.id)}>Delete</button>
        </div>
      ))}
    </div>
  )
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon" />,
  Search: () => <div data-testid="search-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  Filter: () => <div data-testid="filter-icon" />
}));

describe('Customers Component', () => {
  const mockCustomers = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: '123 Main St',
      status: 'active',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+0987654321',
      address: '456 Oak Ave',
      status: 'inactive',
      createdAt: '2024-01-10T15:30:00Z'
    }
  ];

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        customers: (state = {
          customers: mockCustomers,
          isLoading: false,
          error: null,
          searchTerm: '',
          filters: {},
          selectedCustomer: null,
          isEditing: false,
          ...initialState.customers
        }) => state,
        auth: (state = {
          user: { id: 1, name: 'Test User' },
          permissions: ['manage_customers', 'view_customers']
        }) => state
      },
      preloadedState: initialState
    });
  };

  const renderWithProviders = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <Customers {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the customers page correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Customer Management')).toBeInTheDocument();
      expect(screen.getByText('Manage customer information and relationships')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    it('displays customer list', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      const store = createMockStore({
        customers: {
          isLoading: true,
          customers: []
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Loading customers...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      const store = createMockStore({
        customers: {
          error: 'Failed to load customers',
          customers: []
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Failed to load customers')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('renders search input', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByPlaceholderText('Search customers...')).toBeInTheDocument();
    });

    it('filters customers based on search term', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const searchInput = screen.getByPlaceholderText('Search customers...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('shows no results message when search yields no matches', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const searchInput = screen.getByPlaceholderText('Search customers...');
      fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

      expect(screen.getByText('No customers found matching your search')).toBeInTheDocument();
    });
  });

  describe('Customer Actions', () => {
    it('opens add customer form', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      expect(screen.getByText('Add New Customer')).toBeInTheDocument();
      expect(screen.getByLabelText('Customer Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('opens edit customer form', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit Customer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
    });

    it('shows delete confirmation dialog', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText('Delete Customer')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this customer?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });
  });

  describe('Customer Form', () => {
    it('validates required fields', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      const saveButton = screen.getByText('Save Customer');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Customer name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const saveButton = screen.getByText('Save Customer');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates phone number format', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      const phoneInput = screen.getByLabelText('Phone');
      fireEvent.change(phoneInput, { target: { value: 'invalid-phone' } });

      const saveButton = screen.getByText('Save Customer');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    it('saves customer with valid data', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      fireEvent.change(screen.getByLabelText('Customer Name'), { 
        target: { value: 'New Customer' } 
      });
      fireEvent.change(screen.getByLabelText('Email'), { 
        target: { value: 'new@example.com' } 
      });
      fireEvent.change(screen.getByLabelText('Phone'), { 
        target: { value: '+1234567890' } 
      });

      const saveButton = screen.getByText('Save Customer');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Customer saved successfully')).toBeInTheDocument();
      });
    });

    it('cancels form editing', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Add New Customer')).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('shows filter options', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('filters by customer status', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      const activeFilter = screen.getByLabelText('Active');
      fireEvent.click(activeFilter);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('clears all filters', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const filterButton = screen.getByText('Filters');
      fireEvent.click(filterButton);

      const activeFilter = screen.getByLabelText('Active');
      fireEvent.click(activeFilter);

      const clearButton = screen.getByText('Clear Filters');
      fireEvent.click(clearButton);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Import/Export', () => {
    it('shows import button', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Import')).toBeInTheDocument();
    });

    it('shows export button', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('opens import dialog', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const importButton = screen.getByText('Import');
      fireEvent.click(importButton);

      expect(screen.getByText('Import Customers')).toBeInTheDocument();
      expect(screen.getByText('Upload a CSV file with customer data')).toBeInTheDocument();
    });

    it('triggers export functionality', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const exportButton = screen.getByText('Export');
      fireEvent.click(exportButton);

      expect(screen.getByText('Export Options')).toBeInTheDocument();
      expect(screen.getByText('Select export format')).toBeInTheDocument();
    });
  });

  describe('Permissions', () => {
    it('hides add button when user lacks permissions', () => {
      const store = createMockStore({
        auth: {
          user: { id: 1, name: 'Test User' },
          permissions: ['view_customers'] // No manage permission
        }
      });
      renderWithProviders(store);

      expect(screen.queryByText('Add Customer')).not.toBeInTheDocument();
    });

    it('hides edit/delete buttons when user lacks permissions', () => {
      const store = createMockStore({
        auth: {
          user: { id: 1, name: 'Test User' },
          permissions: ['view_customers'] // No manage permission
        }
      });
      renderWithProviders(store);

      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Customer Management');
    });

    it('has proper form labels', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add Customer');
      fireEvent.click(addButton);

      expect(screen.getByLabelText('Customer Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
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

    it('has proper search input accessibility', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search customers...');
    });
  });
});