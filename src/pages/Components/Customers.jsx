import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Upload,
  History,
  X,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { 
  loadMasterData,
  exportMasterData,
  importMasterData,
  validateImportFile,
  clearError
} from '../../redux/slices/masterDataSlice';

const Customers = () => {
  const dispatch = useDispatch();
  const customers = useSelector(state => state.masterData.customers);
  const isLoading = useSelector(state => state.masterData.isImporting);
  const error = useSelector(state => state.masterData.error);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customerCode: '',
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    taxId: '',
    creditLimit: 0,
    isActive: true
  });
  const [sortBy, setSortBy] = useState('customerName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Load customers on component mount
  useEffect(() => {
    dispatch(loadMasterData({ dataType: 'customers' }));
  }, [dispatch]);

  // Filter and sort customers
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchesSearch = !searchTerm || 
        customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && customer.isActive) ||
        (statusFilter === 'inactive' && !customer.isActive);
      
      return matchesSearch && matchesStatus;
    });

    // Sort customers
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      
      if (sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return filtered;
  }, [customers, searchTerm, statusFilter, sortBy, sortOrder]);

  // Table columns configuration
  const columns = [
    {
      key: 'customerCode',
      header: 'Code',
      render: (value, customer) => (
        <div className="font-medium text-primary">{value}</div>
      )
    },
    {
      key: 'customerName',
      header: 'Customer Name',
      render: (value, customer) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-muted-foreground">{customer.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (value) => value || '-'
    },
    {
      key: 'city',
      header: 'Location',
      render: (value, customer) => (
        <div>
          <div>{value || '-'}</div>
          {customer.country && (
            <div className="text-sm text-muted-foreground">{customer.country}</div>
          )}
        </div>
      )
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      render: (value) => (
        <div className="text-right font-mono">
          ${(value || 0).toLocaleString()}
        </div>
      )
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, customer) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleViewCustomer(customer)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditCustomer(customer)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleShowAudit(customer)}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDeleteCustomer(customer)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Event handlers
  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
  };

  const handleAddCustomer = () => {
    setFormData({
      customerCode: '',
      customerName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      taxId: '',
      creditLimit: 0,
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEditCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData({ ...customer });
    setShowEditModal(true);
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    // In a real app, this would navigate to a detailed view
    alert(`Viewing customer: ${customer.customerName}`);
  };

  const handleDeleteCustomer = (customer) => {
    if (window.confirm(`Are you sure you want to delete ${customer.customerName}?`)) {
      // In a real app, this would dispatch a delete action
      alert(`Customer ${customer.customerName} would be deleted`);
    }
  };

  const handleShowAudit = (customer) => {
    setSelectedCustomer(customer);
    setShowAuditModal(true);
  };

  const handleSaveCustomer = () => {
    // Validate form data
    if (!formData.customerCode || !formData.customerName || !formData.email) {
      alert('Please fill in all required fields');
      return;
    }

    // In a real app, this would dispatch save action
    console.log('Saving customer:', formData);
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedCustomer(null);
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleExport = () => {
    const filters = {
      search: searchTerm,
      status: statusFilter
    };
    
    dispatch(exportMasterData({
      dataType: 'customers',
      filters,
      format: 'csv',
      options: {}
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      dispatch(validateImportFile({ file, dataType: 'customers' }));
    }
  };

  const clearErrorMessage = () => {
    dispatch(clearError());
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={clearErrorMessage}>
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">
            Manage customer information and validation settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="text-sm text-muted-foreground">
          {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Customers table */}
      <DataTable
        data={filteredCustomers}
        columns={columns}
        loading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchable={false} // We handle search externally
        emptyMessage="No customers found"
      />

      {/* Add/Edit Customer Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {showAddModal ? 'Add Customer' : 'Edit Customer'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedCustomer(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Code *
                </label>
                <input
                  type="text"
                  value={formData.customerCode}
                  onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter customer code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter country"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tax ID
                </label>
                <input
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter tax ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Credit Limit
                </label>
                <input
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter credit limit"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedCustomer(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveCustomer}>
                <Save className="h-4 w-4 mr-2" />
                Save Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Import Customers</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowImportModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Required columns: customerCode, customerName, email</p>
                <p>Optional columns: phone, address, city, country, taxId, creditLimit</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowImportModal(false)}
              >
                Cancel
              </Button>
              <Button disabled>
                Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Audit Trail - {selectedCustomer.customerName}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowAuditModal(false);
                  setSelectedCustomer(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Mock audit trail data */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Customer Created</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Customer record created by System Admin
                </p>
              </div>

              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Contact Information Updated</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(Date.now() - 86400000).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Email address updated from old@email.com to {selectedCustomer.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;