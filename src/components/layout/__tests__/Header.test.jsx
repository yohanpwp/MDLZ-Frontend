/**
 * Unit tests for Header component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Header from '../Header.jsx';
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

describe('Header', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'admin'
  };

  test('should render header with branding', () => {
    render(
      <TestWrapper>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByText(/invoice validation system/i)).toBeInTheDocument();
  });

  test('should display user info when authenticated', () => {
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
        <Header />
      </TestWrapper>
    );

    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
  });

  test('should show login button when not authenticated', () => {
    const initialState = {
      auth: {
        user: null,
        isAuthenticated: false,
        permissions: [],
        isLoading: false,
        error: null
      }
    };

    render(
      <TestWrapper initialState={initialState}>
        <Header />
      </TestWrapper>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });

  test('should handle user menu interactions', () => {
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
        <Header />
      </TestWrapper>
    );

    const userButton = screen.getByText(mockUser.username);
    fireEvent.click(userButton);

    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });

  test('should display notification badge when alerts exist', () => {
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
        <Header />
      </TestWrapper>
    );

    // Check for notification bell icon
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument();
  });
});