import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
  TermsConditions
} from '../pages';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/master-data/import" element={<Layout><ImportData /></Layout>} />
        <Route path="/master-data/export" element={<Layout><ExportData /></Layout>} />
        <Route path="/components/customers" element={<Layout><Customers /></Layout>} />
        <Route path="/components/products" element={<Layout><Products /></Layout>} />
        <Route path="/components/invoices" element={<Layout><Invoices /></Layout>} />
        <Route path="/components/credit-notes" element={<Layout><CreditNotes /></Layout>} />
        <Route path="/components/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/roles/user-management" element={<Layout><UserManagement /></Layout>} />
        <Route path="/settings/terms-conditions" element={<Layout><TermsConditions /></Layout>} />
      </Routes>
    </Router>
  );
};

export default AppRouter;