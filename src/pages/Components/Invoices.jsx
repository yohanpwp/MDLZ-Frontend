import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Search, 
  Upload,
  Eye,
  RefreshCw,
  History,
  GitCompare,
  X,
  Clock,
  AlertCircle,
  Filter,
  Calendar,
  DollarSign,
  User,
  FileCheck,
  Download
} from 'lucide-react';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';

const Invoices = () => {
  const dispatch = useDispatch();
  
  // Mock invoice data - in real app this would come from Redux store
  const [invoices] = useState([
    { 
      id: 'INV-001', 
      invoiceNumber: 'INV-001',
      customer: 'ABC Corporation', 
      customerCode: 'CUST001',
      amount: 1299.99, 
      taxAmount: 169.99,
      totalAmount: 1469.98,
      date: '2024-01-15', 
      dueDate: '2024-02-15',
      status: 'Valid',
      validationStatus: 'completed',
      discrepancies: 0,
      version: 1,
      lastModified: '2024-01-15T10:30:00Z',
      createdBy: 'System',
      workflow: 'approved'
    },
    { 
      id: 'INV-002', 
      invoiceNumber: 'INV-002',
      customer: 'XYZ Industries', 
      customerCode: 'CUST002',
      amount: 2450.00, 
      taxAmount: 318.50,
      totalAmount: 2768.50,
      date: '2024-01-14', 
      dueDate: '2024-02-14',
      status: 'Discrepancy',
      validationStatus: 'failed',
      discrepancies: 2,
      version: 2,
      lastModified: '2024-01-14T15:45:00Z',
      createdBy: 'John Doe',
      workflow: 'review_required'
    },
    { 
      id: 'INV-003', 
      invoiceNumber: 'INV-003',
      customer: 'Tech Solutions Ltd', 
      customerCode: 'CUST003',
      amount: 899.50, 
      taxAmount: 116.94,
      totalAmount: 1016.44,
      date: '2024-01-13', 
      dueDate: '2024-02-13',
      status: 'Valid',
      validationStatus: 'completed',
      discrepancies: 0,
      version: 1,
      lastModified: '2024-01-13T09:15:00Z',
      createdBy: 'Jane Smith',
      workflow: 'approved'
    },
    { 
      id: 'INV-004', 
      invoiceNumber: 'INV-004',
      customer: 'Global Enterprises', 
      customerCode: 'CUST004',
      amount: 3200.00, 
      taxAmount: 416.00,
      totalAmount: 3616.00,
      date: '2024-01-12', 
      dueDate: '2024-02-12',
      status: 'Pending',
      validationStatus: 'pending',
      discrepancies: 0,
      version: 1,
      lastModified: '2024-01-12T14:20:00Z',
      createdBy: 'System',
      workflow: 'pending_validation'
    }
  ]);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [compareInvoices, setCompareInvoices] = useState([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isValidating, setIsValidating] = useState(false);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = !searchTerm || 
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.customerCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        invoice.status.toLowerCase() === statusFilter.toLowerCase();
      
      const matchesDateRange = (!dateRange.from || new Date(invoice.date) >= new Date(dateRange.from)) &&
        (!dateRange.to || new Date(invoice.date) <= new Date(dateRange.to));
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });

    // Sort invoices
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'date' || sortBy === 'dueDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === 'amount' || sortBy === 'totalAmount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [invoices, searchTerm, statusFilter, dateRange, sortBy, sortOrder]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Discrepancy':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Valid':
        return 'success';
      case 'Discrepancy':
        return 'destructive';
      case 'Pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getWorkflowVariant = (workflow) => {
    switch (workflow) {
      case 'approved':
        return 'success';
      case 'review_required':
        return 'destructive';
      case 'pending_validation':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice',
      render: (value, invoice) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            {invoice.discrepancies > 0 && (
              <p className="text-sm text-red-600">
                {invoice.discrepancies} discrepancies
              </p>
            )}
            <p className="text-xs text-muted-foreground">v{invoice.version}</p>
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (value, invoice) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-muted-foreground">{invoice.customerCode}</p>
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Amount',
      render: (value, invoice) => (
        <div className="text-right">
          <p className="font-mono font-medium">${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-muted-foreground">Tax: ${invoice.taxAmount.toFixed(2)}</p>
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (value, invoice) => (
        <div>
          <p>{new Date(value).toLocaleDateString()}</p>
          <p className="text-sm text-muted-foreground">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Validation',
      render: (value, invoice) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(value)}
          <Badge variant={getStatusVariant(value)}>
            {value}
          </Badge>
        </div>
      )
    },
    {
      key: 'workflow',
      header: 'Workflow',
      render: (value) => (
        <Badge variant={getWorkflowVariant(value)}>
          {value.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, invoice) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleViewInvoice(invoice)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleValidateInvoice(invoice)}
            disabled={invoice.status === 'Valid'}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleShowVersions(invoice)}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleCompareInvoice(invoice)}
          >
            <GitCompare className="h-4 w-4" />
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

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleValidateInvoice = async (invoice) => {
    setIsValidating(true);
    // Simulate validation process
    setTimeout(() => {
      setIsValidating(false);
      alert(`Validation completed for ${invoice.invoiceNumber}`);
    }, 2000);
  };

  const handleValidateAll = async () => {
    setIsValidating(true);
    const pendingInvoices = invoices.filter(inv => inv.status === 'Pending');
    // Simulate batch validation
    setTimeout(() => {
      setIsValidating(false);
      alert(`Validated ${pendingInvoices.length} invoices`);
    }, 3000);
  };

  const handleShowVersions = (invoice) => {
    setSelectedInvoice(invoice);
    setShowVersionModal(true);
  };

  const handleCompareInvoice = (invoice) => {
    if (compareInvoices.length === 0) {
      setCompareInvoices([invoice]);
      alert('Select another invoice to compare');
    } else if (compareInvoices.length === 1) {
      setCompareInvoices([...compareInvoices, invoice]);
      setShowCompareModal(true);
    } else {
      setCompareInvoices([invoice]);
      alert('Comparison reset. Select another invoice to compare');
    }
  };

  const clearDateFilter = () => {
    setDateRange({ from: '', to: '' });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">
            View and validate invoice documents with workflow management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleValidateAll}
            disabled={isValidating}
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileCheck className="h-4 w-4 mr-2" />
            )}
            Validate All
          </Button>
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Invoices
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoices..."
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
          <option value="valid">Valid</option>
          <option value="discrepancy">Discrepancy</option>
          <option value="pending">Pending</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {(dateRange.from || dateRange.to) && (
            <Button variant="ghost" size="sm" onClick={clearDateFilter}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Total Invoices</span>
          </div>
          <div className="text-2xl font-bold">{filteredInvoices.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Valid</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {filteredInvoices.filter(inv => inv.status === 'Valid').length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">Discrepancies</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {filteredInvoices.filter(inv => inv.status === 'Discrepancy').length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Total Value</span>
          </div>
          <div className="text-2xl font-bold">
            ${filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Invoices table */}
      <DataTable
        data={filteredInvoices}
        columns={columns}
        loading={isValidating}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchable={false}
        emptyMessage="No invoices found"
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Upload Invoices</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowUploadModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select Files
                </label>
                <input
                  type="file"
                  multiple
                  accept=".csv,.txt,.pdf"
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Supported formats: CSV, TXT, PDF</p>
                <p>Maximum file size: 10MB per file</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </Button>
              <Button>
                Upload & Process
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Invoice Details - {selectedInvoice.invoiceNumber}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedInvoice(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Invoice Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Invoice Number:</span>
                      <span className="font-medium">{selectedInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(selectedInvoice.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Due Date:</span>
                      <span>{new Date(selectedInvoice.dueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusVariant(selectedInvoice.status)}>
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{selectedInvoice.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer Code:</span>
                      <span>{selectedInvoice.customerCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Financial Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-mono">${selectedInvoice.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Amount:</span>
                      <span className="font-mono">${selectedInvoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-mono font-bold">${selectedInvoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Validation Results</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discrepancies:</span>
                      <span className={selectedInvoice.discrepancies > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {selectedInvoice.discrepancies}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Validated:</span>
                      <span>{new Date(selectedInvoice.lastModified).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedInvoice.discrepancies > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Discrepancy Details</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Tax calculation mismatch</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Total amount discrepancy</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Version History - {selectedInvoice.invoiceNumber}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowVersionModal(false);
                  setSelectedInvoice(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Mock version history */}
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="success">Current</Badge>
                    <span className="font-medium">Version {selectedInvoice.version}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedInvoice.lastModified).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Modified by {selectedInvoice.createdBy}
                </p>
                <p className="text-sm">Status: {selectedInvoice.status}</p>
              </div>

              {selectedInvoice.version > 1 && (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Version {selectedInvoice.version - 1}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(Date.now() - 86400000).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Modified by System
                  </p>
                  <p className="text-sm">Status: Pending</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && compareInvoices.length === 2 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Compare Invoices</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowCompareModal(false);
                  setCompareInvoices([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {compareInvoices.map((invoice, index) => (
                <div key={invoice.id} className="space-y-4">
                  <h3 className="font-semibold text-center">
                    {invoice.invoiceNumber}
                  </h3>
                  <div className="border border-border rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span>{invoice.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono">${invoice.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(invoice.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;