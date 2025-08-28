/**
 * Unit tests for Sidebar component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, beforeEach } from 'vitest';
import Sidebar from '../Sidebar.jsx';
import authReducer from '../../../redux/slices/authSlice.js';

const TestWrapper = ({ children, initialState = {} }) => {
  const store = configureStore({
    reducer: {
      auth: authReducer
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

describe('Sidebar', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    role: 'admin'
  };

  test('should render navigation menu items', () => {
    const initialState = {
      auth: {
        user: mockUser,
        isAuthenticated: true,
        permissions: ['upload_files', 'view_validation', 'manage_users'],
        isLoading: false,
        error: null
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <Sidebar />
      </TestWrapper>
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/master data/i)).toBeInTheDocument();
    expect(screen.getByText(/components/i)).toBeInTheDocument();
  });

  test('should show role-based menu items', () => {
    const initialState = {
      auth: {
        user: mockUser,
        isAuthenticated: true,
        permissions: ['manage_users', 'view_audit'],
        isLoading: false,
        error: null
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <Sidebar />
      </TestWrapper>
    );

    expect(screen.getByText(/user management/i)).toBeInTheDocument();
    expect(screen.getByText(/audit/i)).toBeInTheDocument();
  });

  test('should hide restricted menu items for regular users', () => {
    const initialState = {
      auth: {
        user: { ...mockUser, role: 'user' },
        isAuthenticated: true,
        permissions: ['upload_files', 'view_validation'],
        isLoading: false,
        error: null
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <Sidebar />
      </TestWrapper>
    );

    expect(screen.queryByText(/user management/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/audit/i)).not.toBeInTheDocument();
  });

  test('should handle sidebar collapse/expand', () => {
    const initialState = {
      auth: {
        user: mockUser,
        isAuthenticated: true,
        permissions: [],
        isLoading: false,
        error: null
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <Sidebar />
      </TestWrapper>
    );

    const collapseButton = screen.getByRole('button', { name: /toggle sidebar/i });
    fireEvent.click(collapseButton);

    // Should show collapsed state
    expect(screen.getByTestId('sidebar')).toHaveClass('collapsed');
  });

  test('should highlight active navigation item', () => {
    const initialState = {
      auth: {
        user: mockUser,
        isAuthenticated: true,
        permissions: ['upload_files'],
        isLoading: false,
        error: null
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <Sidebar />
      </TestWrapper>
    );

    const dashboardLink = screen.getByText(/dashboard/i).closest('a');
    expect(dashboardLink).toHaveClass('active');
  });
});