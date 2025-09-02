import { useEffect, Suspense, lazy } from "react";
import { useDispatch } from "react-redux";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { initializeAuth } from "../redux/slices/authSlice.js";
import { ProtectedRoute } from "../components/auth";
import { Layout } from "../components/layout";
import { LoadingSpinner } from "../components/ui";
import Distributors from "../pages/References/Distributors.jsx";

// Lazy load page components for code splitting
const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const ImportData = lazy(() => import("../pages/MasterData/ImportData.jsx"));
const ExportData = lazy(() => import("../pages/MasterData/ExportData.jsx"));
const Customers = lazy(() => import("../pages/References/Customers.jsx"));
const Products = lazy(() => import("../pages/References/Products.jsx"));
const Invoices = lazy(() => import("../pages/Transactions/Invoices.jsx"));
const CreditNotes = lazy(() => import("../pages/Transactions/CreditNotes.jsx"));
const Reports = lazy(() => import("../pages/Reports/Reports.jsx"));
const UserManagement = lazy(() => import("../pages/Roles/UserManagement.jsx"));
const TermsConditions = lazy(() =>
  import("../pages/Settings/TermsConditions.jsx")
);
const Login = lazy(() => import("../pages/Login.jsx"));
const AccessDenied = lazy(() => import("../pages/AccessDenied.jsx"));
const NotFound = lazy(() => import("../pages/NotFound.jsx"));

const AppRouter = () => {
  const dispatch = useDispatch();

  // Initialize authentication state on app start
  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/access-denied" element={<AccessDenied />} />
          {/* 404 Not Found Route */}
          <Route path="*" element={<NotFound />} />
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/master-data/import"
            element={
              <ProtectedRoute requiredPermissions={["import_data"]}>
                <Layout>
                  <ImportData />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/master-data/export"
            element={
              <ProtectedRoute requiredPermissions={["export_data"]}>
                <Layout>
                  <ExportData />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/references/distributors"
            element={
              <ProtectedRoute requiredPermissions={["manage_master_data"]}>
                <Layout>
                  <Distributors />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/references/customers"
            element={
              <ProtectedRoute requiredPermissions={["manage_master_data"]}>
                <Layout>
                  <Customers />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/references/products"
            element={
              <ProtectedRoute requiredPermissions={["manage_master_data"]}>
                <Layout>
                  <Products />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions/invoices"
            element={
              <ProtectedRoute requiredPermissions={["read_invoices"]}>
                <Layout>
                  <Invoices />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions/credit-notes"
            element={
              <ProtectedRoute requiredPermissions={["read_invoices"]}>
                <Layout>
                  <CreditNotes />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute requiredPermissions={["generate_reports"]}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles/user-management"
            element={
              <ProtectedRoute requiredPermissions={["manage_users"]}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings/terms-conditions"
            element={
              <ProtectedRoute>
                <Layout>
                  <TermsConditions />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
