/**
 * End-to-end tests for complete user journeys
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import App from '../../App.jsx';
import authReducer from '../../redux/slices/authSlice.js';
import fileProcessingReducer from '../../redux/slices/fileProcessingSlice.js';
import validationReducer from '../../redux/slices/validationSlice.js';
import reportsReducer from '../../redux/slices/reportsSlice.js';
import masterDataReducer from '../../redux/slices/masterDataSlice.js';
import userManagementReducer from '../../redux/slices/userManagementSlice.js';
import auditReducer from '../../redux/slices/auditSlice.js';

// Mock services
vi.mock('../../services/AuthService.js');
vi.mock('../../services/ValidationEngine.js');
vi.mock('../../services/ReportService.js');
vi.mock('../../utils/CsvParser.js');
vi.mock('../../utils/TxtParser.js');

// Mock File constructor
class MockFile {
  constructor(name, size, type = '') {
    this.name = name;
    this.size = size;
    this.type = type;
  }
}

// Test wrapper component
const TestWrapper = ({ children, initialState = {} }) => {
  const store = configureStore({
    reducer: {
      auth: authReducer,
      fileProcessing: fileProcessingReducer,
      validation: validationReducer,
      reports: reportsReducer,
      masterData: masterDataReducer,
      userManagement: userManagementReducer,
      audit: auditReducer
    },
    preloadedState: initialState
  });

  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
};

describe('End-to-End User Journeys', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      }
    });
  });

  describe('Complete Invoice Validation Journey', () => {
    test('should complete full invoice validation workflow from login to report generation', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        role: 'admin',
        permissions: ['upload_files', 'view_validation', 'generate_reports']
      };

      const initialState = {
        auth: {
          user: mockUser,
          isAuthenticated: true,
          permissions: mockUser.permissions,
          isLoading: false,
          error: null
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Step 1: Verify dashboard is loaded
      await waitFor(() => {
        expect(screen.getByText(/validation dashboard/i)).toBeInTheDocument();
      });

      // Step 2: Navigate to file upload
      const uploadLink = screen.getByRole('link', { name: /upload/i });
      fireEvent.click(uploadLink);

      await waitFor(() => {
        expect(screen.getByText(/upload invoice files/i)).toBeInTheDocument();
      });

      // Step 3: Upload a file
      const file = new MockFile('invoices.csv', 5000, 'text/csv');
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Step 4: Wait for processing to complete
      await waitFor(() => {
        expect(screen.getByText(/processing complete/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Step 5: Navigate to validation results
      const resultsLink = screen.getByRole('link', { name: /results/i });
      fireEvent.click(resultsLink);

      await waitFor(() => {
        expect(screen.getByText(/validation results/i)).toBeInTheDocument();
      });

      // Step 6: Generate a report
      const generateReportButton = screen.getByRole('button', { name: /generate report/i });
      fireEvent.click(generateReportButton);

      await waitFor(() => {
        expect(screen.getByText(/report generated/i)).toBeInTheDocument();
      });

      // Step 7: Export the report
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/export complete/i)).toBeInTheDocument();
      });
    });

    test('should handle authentication flow and role-based access', async () => {
      render(
        <TestWrapper>
          <App />
        </TestWrapper>
      );

      // Should redirect to login when not authenticated
      await waitFor(() => {
        expect(screen.getByText(/login/i)).toBeInTheDocument();
      });

      // Login with credentials
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(passwordInput, { target: { value: 'password' } });
      fireEvent.click(loginButton);

      // Should navigate to dashboard after successful login
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });
    });

    test('should handle error scenarios gracefully', async () => {
      const initialState = {
        auth: {
          user: { id: 1, username: 'testuser', role: 'user' },
          isAuthenticated: true,
          permissions: ['upload_files'],
          isLoading: false,
          error: null
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Try to upload an invalid file
      const invalidFile = new MockFile('invalid.pdf', 1000, 'application/pdf');
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      
      fireEvent.change(fileInput, { target: { files: [invalidFile] } });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      });

      // Try to access restricted area
      const adminLink = screen.queryByRole('link', { name: /user management/i });
      expect(adminLink).not.toBeInTheDocument(); // Should not be visible for regular user
    });
  });

  describe('Master Data Management Journey', () => {
    test('should complete master data import and export workflow', async () => {
      const initialState = {
        auth: {
          user: { id: 1, username: 'admin', role: 'admin' },
          isAuthenticated: true,
          permissions: ['manage_master_data', 'import_data', 'export_data'],
          isLoading: false,
          error: null
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Navigate to Master Data section
      const masterDataLink = screen.getByRole('link', { name: /master data/i });
      fireEvent.click(masterDataLink);

      // Navigate to Import Data
      const importLink = screen.getByRole('link', { name: /import data/i });
      fireEvent.click(importLink);

      await waitFor(() => {
        expect(screen.getByText(/import master data/i)).toBeInTheDocument();
      });

      // Upload master data file
      const masterDataFile = new MockFile('customers.csv', 3000, 'text/csv');
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      
      fireEvent.change(fileInput, { target: { files: [masterDataFile] } });

      // Confirm import
      const importButton = screen.getByRole('button', { name: /import/i });
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/import successful/i)).toBeInTheDocument();
      });

      // Navigate to Export Data
      const exportLink = screen.getByRole('link', { name: /export data/i });
      fireEvent.click(exportLink);

      // Select export options and export
      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText(/export complete/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Management Journey', () => {
    test('should complete user management workflow', async () => {
      const initialState = {
        auth: {
          user: { id: 1, username: 'admin', role: 'admin' },
          isAuthenticated: true,
          permissions: ['manage_users', 'assign_roles', 'view_audit'],
          isLoading: false,
          error: null
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Navigate to User Management
      const userMgmtLink = screen.getByRole('link', { name: /user management/i });
      fireEvent.click(userMgmtLink);

      await waitFor(() => {
        expect(screen.getByText(/user management/i)).toBeInTheDocument();
      });

      // Create new user
      const createUserButton = screen.getByRole('button', { name: /create user/i });
      fireEvent.click(createUserButton);

      // Fill user form
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email/i);
      const roleSelect = screen.getByLabelText(/role/i);

      fireEvent.change(usernameInput, { target: { value: 'newuser' } });
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
      fireEvent.change(roleSelect, { target: { value: 'user' } });

      // Save user
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/user created successfully/i)).toBeInTheDocument();
      });

      // Assign permissions
      const permissionsButton = screen.getByRole('button', { name: /permissions/i });
      fireEvent.click(permissionsButton);

      const uploadPermission = screen.getByLabelText(/upload files/i);
      fireEvent.click(uploadPermission);

      const savePermissionsButton = screen.getByRole('button', { name: /save permissions/i });
      fireEvent.click(savePermissionsButton);

      await waitFor(() => {
        expect(screen.getByText(/permissions updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Audit and Compliance Journey', () => {
    test('should complete audit trail review workflow', async () => {
      const initialState = {
        auth: {
          user: { id: 1, username: 'auditor', role: 'auditor' },
          isAuthenticated: true,
          permissions: ['view_audit', 'generate_compliance_reports'],
          isLoading: false,
          error: null
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Navigate to Audit & Compliance
      const auditLink = screen.getByRole('link', { name: /audit/i });
      fireEvent.click(auditLink);

      await waitFor(() => {
        expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
      });

      // Filter audit logs
      const dateFromInput = screen.getByLabelText(/from date/i);
      const dateToInput = screen.getByLabelText(/to date/i);
      
      fireEvent.change(dateFromInput, { target: { value: '2024-01-01' } });
      fireEvent.change(dateToInput, { target: { value: '2024-01-31' } });

      const filterButton = screen.getByRole('button', { name: /filter/i });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText(/audit entries found/i)).toBeInTheDocument();
      });

      // Generate compliance report
      const complianceReportButton = screen.getByRole('button', { name: /compliance report/i });
      fireEvent.click(complianceReportButton);

      await waitFor(() => {
        expect(screen.getByText(/compliance report generated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Large Dataset Handling', () => {
    test('should handle large file uploads with progress tracking', async () => {
      const initialState = {
        auth: {
          user: { id: 1, username: 'testuser', role: 'user' },
          isAuthenticated: true,
          permissions: ['upload_files', 'view_validation'],
          isLoading: false,
          error: null
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Upload large file
      const largeFile = new MockFile('large-invoices.csv', 50000000, 'text/csv'); // 50MB
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      
      fireEvent.change(fileInput, { target: { files: [largeFile] } });

      // Should show progress indicator
      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      // Should show processing status
      await waitFor(() => {
        expect(screen.getByText(/processing/i)).toBeInTheDocument();
      });

      // Should complete processing
      await waitFor(() => {
        expect(screen.getByText(/processing complete/i)).toBeInTheDocument();
      }, { timeout: 10000 });
    });

    test('should handle validation of large datasets with chunking', async () => {
      const initialState = {
        auth: {
          user: { id: 1, username: 'testuser', role: 'user' },
          isAuthenticated: true,
          permissions: ['upload_files', 'view_validation'],
          isLoading: false,
          error: null
        },
        validation: {
          results: Array.from({ length: 10000 }, (_, i) => ({
            id: i.toString(),
            recordId: `INV-${i}`,
            field: 'taxAmount',
            severity: i % 3 === 0 ? 'high' : 'medium',
            discrepancy: Math.random() * 10,
            originalValue: 100 + i,
            calculatedValue: 95 + i,
            message: `Discrepancy in record ${i}`
          })),
          summary: {
            totalRecords: 10000,
            validRecords: 8000,
            invalidRecords: 2000,
            totalDiscrepancies: 2000
          },
          isValidating: false,
          error: null
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Navigate to validation results
      const resultsLink = screen.getByRole('link', { name: /results/i });
      fireEvent.click(resultsLink);

      // Should use virtual scrolling for large datasets
      await waitFor(() => {
        expect(screen.getByText(/10000.*records/i)).toBeInTheDocument();
      });

      // Should be able to filter large datasets
      const severityFilter = screen.getByLabelText(/severity/i);
      fireEvent.change(severityFilter, { target: { value: 'high' } });

      await waitFor(() => {
        // Should show filtered results
        expect(screen.getByText(/filtered/i)).toBeInTheDocument();
      });
    });
  });

  describe('Offline Capability and Error Recovery', () => {
    test('should handle offline scenarios gracefully', async () => {
      const initialState = {
        auth: {
          user: { id: 1, username: 'testuser', role: 'user' },
          isAuthenticated: true,
          permissions: ['upload_files'],
          isLoading: false,
          error: null
        }
      };

      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Should show offline indicator
      await waitFor(() => {
        expect(screen.getByText(/offline/i)).toBeInTheDocument();
      });

      // Try to upload file while offline
      const file = new MockFile('invoices.csv', 1000, 'text/csv');
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should queue for later processing
      await waitFor(() => {
        expect(screen.getByText(/queued for upload/i)).toBeInTheDocument();
      });

      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        value: true
      });

      window.dispatchEvent(new Event('online'));

      // Should process queued uploads
      await waitFor(() => {
        expect(screen.getByText(/processing queued uploads/i)).toBeInTheDocument();
      });
    });

    test('should recover from network errors', async () => {
      const initialState = {
        auth: {
          user: { id: 1, username: 'testuser', role: 'user' },
          isAuthenticated: true,
          permissions: ['upload_files'],
          isLoading: false,
          error: null
        }
      };

      render(
        <TestWrapper initialState={initialState}>
          <App />
        </TestWrapper>
      );

      // Simulate network error during file upload
      const file = new MockFile('invoices.csv', 1000, 'text/csv');
      const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
      
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Should show error and retry option
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      fireEvent.click(retryButton);

      // Should attempt upload again
      await waitFor(() => {
        expect(screen.getByText(/retrying/i)).toBeInTheDocument();
      });
    });
  });
});