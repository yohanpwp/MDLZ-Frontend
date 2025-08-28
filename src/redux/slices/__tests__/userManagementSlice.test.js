import { describe, test, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import userManagementReducer, {
  clearMessages,
  setSelectedUser,
  clearSelectedUser,
  updateFilters,
  updatePagination,
  setSuccessMessage,
  selectUsers,
  selectIsLoading
} from '../userManagementSlice.js';

describe('userManagementSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        userManagement: userManagementReducer
      }
    });
  });

  test('should have correct initial state', () => {
    const state = store.getState().userManagement;
    
    expect(state.users).toEqual([]);
    expect(state.selectedUser).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  test('should set selected user', () => {
    const user = { id: 1, username: 'testuser' };
    
    store.dispatch(setSelectedUser(user));
    
    const state = store.getState().userManagement;
    expect(state.selectedUser).toEqual(user);
  });

  test('should clear selected user', () => {
    const user = { id: 1, username: 'testuser' };
    store.dispatch(setSelectedUser(user));
    
    store.dispatch(clearSelectedUser());
    
    const state = store.getState().userManagement;
    expect(state.selectedUser).toBeNull();
  });

  test('should update filters', () => {
    const newFilters = { search: 'john', role: 'admin' };
    
    store.dispatch(updateFilters(newFilters));
    
    const state = store.getState().userManagement;
    expect(state.filters.search).toBe('john');
    expect(state.filters.role).toBe('admin');
  });

  test('should update pagination', () => {
    const newPagination = { page: 2, limit: 20 };
    
    store.dispatch(updatePagination(newPagination));
    
    const state = store.getState().userManagement;
    expect(state.pagination.page).toBe(2);
    expect(state.pagination.limit).toBe(20);
  });

  test('should set success message', () => {
    const message = 'Success!';
    
    store.dispatch(setSuccessMessage(message));
    
    const state = store.getState().userManagement;
    expect(state.successMessage).toBe(message);
    expect(state.error).toBeNull();
  });

  test('should clear messages', () => {
    store.dispatch(setSuccessMessage('Test success'));
    store.dispatch({ type: 'userManagement/createUser/rejected', payload: 'Test error' });
    
    store.dispatch(clearMessages());
    
    const state = store.getState().userManagement;
    expect(state.error).toBeNull();
    expect(state.successMessage).toBeNull();
  });

  test('should select users', () => {
    const state = store.getState();
    const users = selectUsers(state);
    
    expect(Array.isArray(users)).toBe(true);
  });

  test('should select loading state', () => {
    const state = store.getState();
    const isLoading = selectIsLoading(state);
    
    expect(typeof isLoading).toBe('boolean');
  });
});