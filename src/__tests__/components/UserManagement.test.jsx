/**
 * UserManagement Component Tests
 * 
 * Tests for the UserManagement page component including user CRUD operations,
 * role assignment, and permission management.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import UserManagement from '../../pages/Roles/UserManagement';

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
      <button onClick={onAdd}>Add User</button>
      {data.map(user => (
        <div key={user.id} data-testid={`user-${user.id}`}>
          <span>{user.name}</span>
          <span>{user.email}</span>
          <span>{user.role}</span>
          <button onClick={() => onEdit(user)}>Edit</button>
          <button onClick={() => onDelete(user.id)}>Delete</button>
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
  Shield: () => <div data-testid="shield-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Key: () => <div data-testid="key-icon" />,
  Lock: () => <div data-testid="lock-icon" />
}));

describe('UserManagement Component', () => {
  const mockUsers = [
    {
      id: 1,
      name: 'John Admin',
      email: 'admin@example.com',
      role: 'Administrator',
      permissions: ['all'],
      status: 'active',
      lastLogin: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 2,
      name: 'Jane Manager',
      email: 'manager@example.com',
      role: 'Manager',
      permissions: ['manage_users', 'view_reports'],
      status: 'active',
      lastLogin: '2024-01-14T15:30:00Z',
      createdAt: '2024-01-05T00:00:00Z'
    },
    {
      id: 3,
      name: 'Bob User',
      email: 'user@example.com',
      role: 'User',
      permissions: ['view_data'],
      status: 'inactive',
      lastLogin: '2024-01-10T09:15:00Z',
      createdAt: '2024-01-10T00:00:00Z'
    }
  ];

  const mockRoles = [
    {
      id: 1,
      name: 'Administrator',
      description: 'Full system access',
      permissions: ['all']
    },
    {
      id: 2,
      name: 'Manager',
      description: 'Management level access',
      permissions: ['manage_users', 'view_reports', 'manage_data']
    },
    {
      id: 3,
      name: 'User',
      description: 'Basic user access',
      permissions: ['view_data']
    }
  ];

  const createMockStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        users: (state = {
          users: mockUsers,
          roles: mockRoles,
          isLoading: false,
          error: null,
          selectedUser: null,
          isEditing: false,
          ...initialState.users
        }) => state,
        auth: (state = {
          user: { id: 1, name: 'Test Admin', role: 'Administrator' },
          permissions: ['manage_users', 'view_users', 'manage_roles']
        }) => state
      },
      preloadedState: initialState
    });
  };

  const renderWithProviders = (store, props = {}) => {
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <UserManagement {...props} />
        </BrowserRouter>
      </Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the user management page correctly', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Manage users, roles, and permissions')).toBeInTheDocument();
      expect(screen.getByTestId('data-table')).toBeInTheDocument();
    });

    it('displays user list with roles', () => {
      const store = createMockStore();
      renderWithProviders(store);

      expect(screen.getByText('John Admin')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      
      expect(screen.getByText('Bob User')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      const store = createMockStore({
        users: {
          isLoading: true,
          users: []
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Loading users...')).toBeInTheDocument();
    });

    it('shows error state', () => {
      const store = createMockStore({
        users: {
          error: 'Failed to load users',
          users: []
        }
      });
      renderWithProviders(store);

      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    it('opens add user form', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      expect(screen.getByText('Add New User')).toBeInTheDocument();
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
    });

    it('opens edit user form', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Admin')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin@example.com')).toBeInTheDocument();
    });

    it('shows delete confirmation dialog', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]); // Don't delete admin

      expect(screen.getByText('Delete User')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete this user?')).toBeInTheDocument();
      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('prevents deleting current user', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[0]); // Try to delete admin (current user)

      expect(screen.getByText('Cannot delete your own account')).toBeInTheDocument();
    });
  });

  describe('User Form', () => {
    it('validates required fields', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      const saveButton = screen.getByText('Save User');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Role is required')).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const saveButton = screen.getByText('Save User');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('validates unique email', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'admin@example.com' } }); // Existing email

      const saveButton = screen.getByText('Save User');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Email address is already in use')).toBeInTheDocument();
      });
    });

    it('saves user with valid data', async () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      fireEvent.change(screen.getByLabelText('Full Name'), { 
        target: { value: 'New User' } 
      });
      fireEvent.change(screen.getByLabelText('Email'), { 
        target: { value: 'newuser@example.com' } 
      });
      fireEvent.change(screen.getByLabelText('Role'), { 
        target: { value: 'User' } 
      });

      const saveButton = screen.getByText('Save User');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('User saved successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Role Management', () => {
    it('shows role selection dropdown', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      const roleSelect = screen.getByLabelText('Role');
      expect(roleSelect).toBeInTheDocument();

      fireEvent.click(roleSelect);
      expect(screen.getByText('Administrator')).toBeInTheDocument();
      expect(screen.getByText('Manager')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
    });

    it('updates permissions when role changes', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      const roleSelect = screen.getByLabelText('Role');
      fireEvent.change(roleSelect, { target: { value: 'Manager' } });

      expect(screen.getByText('Permissions for Manager role:')).toBeInTheDocument();
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
      expect(screen.getByText('View Reports')).toBeInTheDocument();
    });

    it('shows custom permissions option', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      const customPermissionsCheckbox = screen.getByLabelText('Custom Permissions');
      fireEvent.click(customPermissionsCheckbox);

      expect(screen.getByText('Select individual permissions:')).toBeInTheDocument();
    });
  });

  describe('Permission Management', () => {
    it('displays permission matrix', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const permissionsTab = screen.getByText('Permissions');
      fireEvent.click(permissionsTab);

      expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
      expect(screen.getByText('View permissions by role')).toBeInTheDocument();
    });

    it('allows editing role permissions', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const permissionsTab = screen.getByText('Permissions');
      fireEvent.click(permissionsTab);

      const editRoleButton = screen.getByText('Edit Manager Role');
      fireEvent.click(editRoleButton);

      expect(screen.getByText('Edit Role Permissions')).toBeInTheDocument();
      expect(screen.getByLabelText('Manage Data')).toBeInTheDocument();
    });

    it('shows permission descriptions', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const permissionsTab = screen.getByText('Permissions');
      fireEvent.click(permissionsTab);

      expect(screen.getByText('View Data: Can view system data')).toBeInTheDocument();
      expect(screen.getByText('Manage Users: Can create and edit users')).toBeInTheDocument();
    });
  });

  describe('User Status Management', () => {
    it('allows activating inactive users', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const activateButton = screen.getByText('Activate');
      fireEvent.click(activateButton);

      expect(screen.getByText('User activated successfully')).toBeInTheDocument();
    });

    it('allows deactivating active users', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const deactivateButton = screen.getByText('Deactivate');
      fireEvent.click(deactivateButton);

      expect(screen.getByText('Deactivate User')).toBeInTheDocument();
      expect(screen.getByText('This will prevent the user from logging in')).toBeInTheDocument();
    });

    it('shows user status badges', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const activeBadges = screen.getAllByText('Active');
      const inactiveBadges = screen.getAllByText('Inactive');
      
      expect(activeBadges.length).toBeGreaterThan(0);
      expect(inactiveBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Search and Filtering', () => {
    it('filters users by search term', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const searchInput = screen.getByPlaceholderText('Search users...');
      fireEvent.change(searchInput, { target: { value: 'John' } });

      expect(screen.getByText('John Admin')).toBeInTheDocument();
      expect(screen.queryByText('Jane Manager')).not.toBeInTheDocument();
    });

    it('filters users by role', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const roleFilter = screen.getByLabelText('Filter by Role');
      fireEvent.change(roleFilter, { target: { value: 'Administrator' } });

      expect(screen.getByText('John Admin')).toBeInTheDocument();
      expect(screen.queryByText('Jane Manager')).not.toBeInTheDocument();
    });

    it('filters users by status', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const statusFilter = screen.getByLabelText('Filter by Status');
      fireEvent.change(statusFilter, { target: { value: 'active' } });

      expect(screen.getByText('John Admin')).toBeInTheDocument();
      expect(screen.getByText('Jane Manager')).toBeInTheDocument();
      expect(screen.queryByText('Bob User')).not.toBeInTheDocument();
    });
  });

  describe('Audit Trail', () => {
    it('shows user activity log', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const auditTab = screen.getByText('Activity Log');
      fireEvent.click(auditTab);

      expect(screen.getByText('User Activity History')).toBeInTheDocument();
      expect(screen.getByText('Last Login:')).toBeInTheDocument();
    });

    it('displays login history', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[0]);

      const auditTab = screen.getByText('Activity Log');
      fireEvent.click(auditTab);

      expect(screen.getByText('Login History')).toBeInTheDocument();
      expect(screen.getByText('Recent login attempts')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('User Management');
    });

    it('has proper form labels', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const addButton = screen.getByText('Add User');
      fireEvent.click(addButton);

      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Role')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for permissions', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const permissionsTab = screen.getByText('Permissions');
      fireEvent.click(permissionsTab);

      const permissionCheckboxes = screen.getAllByRole('checkbox');
      permissionCheckboxes.forEach(checkbox => {
        expect(checkbox).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Security', () => {
    it('requires confirmation for sensitive actions', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const deleteButtons = screen.getAllByText('Delete');
      fireEvent.click(deleteButtons[1]);

      expect(screen.getByText('Type "DELETE" to confirm')).toBeInTheDocument();
      
      const confirmInput = screen.getByLabelText('Confirmation');
      const confirmButton = screen.getByText('Confirm Delete');
      
      expect(confirmButton).toBeDisabled();
      
      fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
      expect(confirmButton).not.toBeDisabled();
    });

    it('shows password reset option', () => {
      const store = createMockStore();
      renderWithProviders(store);

      const editButtons = screen.getAllByText('Edit');
      fireEvent.click(editButtons[1]);

      expect(screen.getByText('Reset Password')).toBeInTheDocument();
      expect(screen.getByText('Send password reset email')).toBeInTheDocument();
    });
  });
});