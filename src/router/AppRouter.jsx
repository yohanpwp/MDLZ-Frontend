import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeAuth } from '../redux/slices/authSlice.js';
import { ProtectedRoute } from '../components/auth';
import { Layout } from '../components/layout';
import {
  Dashboard,
  ImportData,
  ExportData,
  Customers,
  Products,
  Invoices,
  CreditNotes,
  Reports,
  UserManagement,
  TermsConditions,
  Login,
  AccessDenied
} from '../pages';

const AppRouter = () => {
  const dispatch = useDispatch();

  // Initialize authentication state on app start
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/master-data/import" 
          element={
            <ProtectedRoute requiredPermissions={['import_data']}>
              <Layout><ImportData /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/master-data/export" 
          element={
            <ProtectedRoute requiredPermissions={['export_data']}>
              <Layout><ExportData /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/components/customers" 
          element={
            <ProtectedRoute requiredPermissions={['manage_master_data']}>
              <Layout><Customers /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/components/products" 
          element={
            <ProtectedRoute requiredPermissions={['manage_master_data']}>
              <Layout><Products /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/components/invoices" 
          element={
            <ProtectedRoute requiredPermissions={['read_invoices']}>
              <Layout><Invoices /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/components/credit-notes" 
          element={
            <ProtectedRoute requiredPermissions={['read_invoices']}>
              <Layout><CreditNotes /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/components/reports" 
          element={
            <ProtectedRoute requiredPermissions={['generate_reports']}>
              <Layout><Reports /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/roles/user-management" 
          element={
            <ProtectedRoute requiredPermissions={['manage_users']}>
              <Layout><UserManagement /></Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings/terms-conditions" 
          element={
            <ProtectedRoute>
              <Layout><TermsConditions /></Layout>
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;