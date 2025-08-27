import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import UserManagement from '../UserManagement';
import userManagementReducer from '../../../redux/slices/userManagementSlice';
import auditReducer from '../../../redux/slices/auditSlice';

// Mock the services
jest.mock('../../../services/UserManagementService', () => ({
  getUsers: jest.fn(() => Promise.resolve({ users: [], total: 0, totalPages: 0 })),
  getActiveSessions: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../../services/AuditService', () => ({
  getAuditLogs: jest.fn(() => ({ logs: [], total: 0, totalPages: 0 })),
  getAuditStatistics: jest.fn(() => ({
    totalEvents: 0,
    eventsByModule: {},
    eventsByAction: {},
    eventsBySeverity: {},
    eventsLast24Hours: 0,
    eventsLast7Days: 0,
    eventsLast30Days: 0
  })),
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      userManagement: userManagementReducer,
      audit: auditReducer,
    },
  });
};

const renderWithProvider = (component) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      {component}
    </Provider>
  );
};

describe('UserManagement', () => {
  test('renders user management page with tabs', () => {
    renderWithProvider(<UserManagement />);
    
    // Check if the main heading is present
    expect(screen.getByText('User Management')).toBeInTheDocument();
    
    // Check if all tabs are present
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument();
    expect(screen.getByText('Activity Logs')).toBeInTheDocument();
    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
  });

  test('switches between tabs correctly', async () => {
    renderWithProvider(<UserManagement />);
    
    // Initially should show Users tab
    expect(screen.getByText('Search users...')).toBeInTheDocument();
    
    // Click on Roles & Permissions tab
    fireEvent.click(screen.getByText('Roles & Permissions'));
    await waitFor(() => {
      expect(screen.getByText('Permission Matrix')).toBeInTheDocument();
    });
    
    // Click on Activity Logs tab
    fireEvent.click(screen.getByText('Activity Logs'));
    await waitFor(() => {
      expect(screen.getByText('System Activity')).toBeInTheDocument();
    });
    
    // Click on Audit Trail tab
    fireEvent.click(screen.getByText('Audit Trail'));
    await waitFor(() => {
      expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    });
  });

  test('shows add user button', () => {
    renderWithProvider(<UserManagement />);
    
    expect(screen.getByText('Add User')).toBeInTheDocument();
  });

  test('shows active sessions button', () => {
    renderWithProvider(<UserManagement />);
    
    expect(screen.getByText('Active Sessions')).toBeInTheDocument();
  });
});