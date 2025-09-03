import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  CreditCard, 
  Search, 
  Plus, 
  Eye,
  Edit,
  Trash2,
  History,
  FileText,
  CheckCircle,
  Clock,
  X,
  Save,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  RefreshCw,
  Link
} from 'lucide-react';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { Badge } from '../../components/ui/Badge';
import { CreditNoteStatus, CreditNoteType } from '../../types/prisma';
import { useLanguage } from '../../contexts/LanguageContext';

const CreditNotes = () => {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  
  // Mock credit note data - in real app this would come from Redux store
  const [creditNotes] = useState([
    { 
      id: 1, 
      invNo: 'CN-001',
      customer: 'ABC Corporation', 
      customerCode: 'CUST001',
      netAmount: 299.99, 
      vatTaxAmount: 39.00,
      totalNetAmount: 338.99,
      invoiceDate: '2024-01-15',
      createDate: '2024-01-15',
      productType: CreditNoteType.RETURN,
      productCode: 'PROD001',
      quantity: 5,
      uomConvFactor: 1,
      status: CreditNoteStatus.PROCESSED,
      workflow: 'approved',
      relatedInvoice: 'INV-001',
      version: 1,
      updatedAt: '2024-01-15T10:30:00Z',
      createdBy: 'John Doe',
      approvedBy: 'Jane Smith',
      approvedDate: '2024-01-15T14:20:00Z'
    },
    { 
      id: 2, 
      invNo: 'CN-002',
      customer: 'XYZ Industries', 
      customerCode: 'CUST002',
      netAmount: 150.00, 
      vatTaxAmount: 19.50,
      totalNetAmount: 169.50,
      invoiceDate: '2024-01-14',
      createDate: '2024-01-14',
      productType: CreditNoteType.ADJUSTMENT,
      productCode: 'PROD002',
      quantity: 3,
      uomConvFactor: 1,
      status: CreditNoteStatus.PENDING,
      workflow: 'pending_approval',
      relatedInvoice: 'INV-002',
      version: 1,
      updatedAt: '2024-01-14T15:45:00Z',
      createdBy: 'Jane Smith',
      approvedBy: null,
      approvedDate: null
    },
    { 
      id: 3, 
      invNo: 'CN-003',
      customer: 'Tech Solutions Ltd', 
      customerCode: 'CUST003',
      netAmount: 89.50, 
      vatTaxAmount: 11.64,
      totalNetAmount: 101.14,
      invoiceDate: '2024-01-13',
      createDate: '2024-01-13',
      productType: CreditNoteType.DISCOUNT,
      productCode: 'PROD003',
      quantity: 2,
      uomConvFactor: 1,
      status: CreditNoteStatus.PROCESSED,
      workflow: 'approved',
      relatedInvoice: 'INV-003',
      version: 2,
      updatedAt: '2024-01-13T09:15:00Z',
      createdBy: 'System',
      approvedBy: 'John Doe',
      approvedDate: '2024-01-13T11:30:00Z'
    },
    { 
      id: 4, 
      invNo: 'CN-004',
      customer: 'Global Enterprises', 
      customerCode: 'CUST004',
      netAmount: 500.00, 
      vatTaxAmount: 65.00,
      totalNetAmount: 565.00,
      invoiceDate: '2024-01-12',
      createDate: '2024-01-12',
      productType: CreditNoteType.RETURN,
      productCode: 'PROD004',
      quantity: 10,
      uomConvFactor: 1,
      status: CreditNoteStatus.PENDING,
      workflow: 'draft',
      relatedInvoice: 'INV-004',
      version: 1,
      updatedAt: '2024-01-12T16:45:00Z',
      createdBy: 'Jane Smith',
      approvedBy: null,
      approvedDate: null
    }
  ]);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [formData, setFormData] = useState({
    invNo: '',
    customer: '',
    customerCode: '',
    netAmount: 0,
    vatTaxAmount: 0,
    productType: CreditNoteType.RETURN,
    productCode: '',
    quantity: 1,
    relatedInvoice: ''
  });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Credit note types
  const creditNoteTypes = [
    { code: CreditNoteType.RETURN, label: 'Product Return' },
    { code: CreditNoteType.ADJUSTMENT, label: 'Billing Adjustment' },
    { code: CreditNoteType.DISCOUNT, label: 'Discount Adjustment' }
  ];

  // Filter and sort credit notes
  const filteredCreditNotes = useMemo(() => {
    let filtered = creditNotes.filter(note => {
      const matchesSearch = !searchTerm || 
        note.invNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.relatedInvoice?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        note.status.toLowerCase() === statusFilter.toLowerCase();
      
      const matchesReason = reasonFilter === 'all' || 
        note.productType === reasonFilter;
      
      const matchesDateRange = (!dateRange.from || new Date(note.invoiceDate) >= new Date(dateRange.from)) &&
        (!dateRange.to || new Date(note.invoiceDate) <= new Date(dateRange.to));
      
      return matchesSearch && matchesStatus && matchesReason && matchesDateRange;
    });

    // Sort credit notes
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'invoiceDate' || sortBy === 'approvedDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === 'netAmount' || sortBy === 'totalNetAmount') {
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
  }, [creditNotes, searchTerm, statusFilter, reasonFilter, dateRange, sortBy, sortOrder]);

  const getStatusVariant = (status) => {
    switch (status) {
      case CreditNoteStatus.PROCESSED:
        return 'success';
      case CreditNoteStatus.PENDING:
        return 'warning';
      case CreditNoteStatus.APPROVED:
        return 'default';
      case CreditNoteStatus.REJECTED:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getWorkflowVariant = (workflow) => {
    switch (workflow) {
      case 'approved':
        return 'success';
      case 'pending_approval':
        return 'warning';
      case 'draft':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  // Table columns configuration
  const columns = [
    {
      key: 'invNo',
      header: 'Credit Note',
      render: (value, note) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">v{note.version}</p>
            <p className="text-xs text-purple-600">{note.productType}</p>
            {note.relatedInvoice && (
              <p className="text-xs text-blue-600 flex items-center gap-1">
                <Link className="h-3 w-3" />
                {note.relatedInvoice}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (value, note) => (
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-sm text-muted-foreground">{note.customerCode}</p>
        </div>
      )
    },
    {
      key: 'totalNetAmount',
      header: 'Total Amount',
      render: (value, note) => (
        <div className="text-right">
          <p className="font-mono font-medium text-red-600">-${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-muted-foreground">Tax: ${(note.vatTaxAmount || 0).toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Qty: {note.quantity}</p>
        </div>
      )
    },
    {
      key: 'invoiceDate',
      header: 'Date',
      render: (value, note) => (
        <div>
          <p>{new Date(value).toLocaleDateString()}</p>
          <p className="text-sm text-muted-foreground">Created: {new Date(note.createDate).toLocaleDateString()}</p>
        </div>
      )
    },
    {
      key: 'productType',
      header: 'Type',
      render: (value, note) => (
        <div>
          <Badge variant="outline" className="text-xs">
            {value}
          </Badge>
          <p className="text-sm text-muted-foreground mt-1">{note.productCode}</p>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (value) => (
        <Badge variant={getStatusVariant(value)}>
          {value}
        </Badge>
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
      render: (_, note) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleViewCreditNote(note)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditCreditNote(note)}
            disabled={note.status === CreditNoteStatus.PROCESSED}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleShowVersions(note)}
          >
            <History className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDeleteCreditNote(note)}
            disabled={note.status === CreditNoteStatus.PROCESSED}
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

  const handleAddCreditNote = () => {
    setFormData({
      invNo: '',
      customer: '',
      customerCode: '',
      netAmount: 0,
      vatTaxAmount: 0,
      productType: CreditNoteType.RETURN,
      productCode: '',
      quantity: 1,
      relatedInvoice: ''
    });
    setShowAddModal(true);
  };

  const handleEditCreditNote = (note) => {
    setSelectedCreditNote(note);
    setFormData({ ...note });
    setShowEditModal(true);
  };

  const handleViewCreditNote = (note) => {
    setSelectedCreditNote(note);
    setShowDetailModal(true);
  };

  const handleDeleteCreditNote = (note) => {
    if (window.confirm(`Are you sure you want to delete ${note.invNo}?`)) {
      // In a real app, this would dispatch a delete action
      alert(`Credit note ${note.invNo} would be deleted`);
    }
  };

  const handleShowVersions = (note) => {
    setSelectedCreditNote(note);
    setShowVersionModal(true);
  };

  const handleSaveCreditNote = () => {
    // Validate form data
    if (!formData.invNo || !formData.customer || !formData.netAmount) {
      alert('Please fill in all required fields');
      return;
    }

    // In a real app, this would dispatch save action
    console.log('Saving credit note:', formData);
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedCreditNote(null);
  };

  const clearDateFilter = () => {
    setDateRange({ from: '', to: '' });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('navigation.creditNotes')}</h1>
          <p className="text-muted-foreground">
            {t('creditNote.title', 'Manage credit notes and refund processing with workflow management')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddCreditNote}>
            <Plus className="h-4 w-4 mr-2" />
            {t('creditNote.addCreditNote')}
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('creditNote.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value={CreditNoteStatus.PENDING.toLowerCase()}>Pending</option>
          <option value={CreditNoteStatus.APPROVED.toLowerCase()}>Approved</option>
          <option value={CreditNoteStatus.PROCESSED.toLowerCase()}>Processed</option>
          <option value={CreditNoteStatus.REJECTED.toLowerCase()}>Rejected</option>
        </select>
        <select
          value={reasonFilter}
          onChange={(e) => setReasonFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="all">All Types</option>
          {creditNoteTypes.map(type => (
            <option key={type.code} value={type.code}>{type.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="flex-1 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
            <CreditCard className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Total Credit Notes</span>
          </div>
          <div className="text-2xl font-bold">{filteredCreditNotes.length}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Processed</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {filteredCreditNotes.filter(note => note.status === CreditNoteStatus.PROCESSED).length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {filteredCreditNotes.filter(note => note.status === CreditNoteStatus.PENDING).length}
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium">Total Value</span>
          </div>
          <div className="text-2xl font-bold text-red-600">
            -${filteredCreditNotes.reduce((sum, note) => sum + note.totalNetAmount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Credit notes table */}
      <DataTable
        data={filteredCreditNotes}
        columns={columns}
        loading={false}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchable={false}
        emptyMessage="No credit notes found"
      />

      {/* Add/Edit Credit Note Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {showAddModal ? 'Create Credit Note' : 'Edit Credit Note'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedCreditNote(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Credit Note Number *
                </label>
                <input
                  type="text"
                  value={formData.creditNoteNumber}
                  onChange={(e) => setFormData({ ...formData, creditNoteNumber: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Enter credit note number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Related Invoice
                </label>
                <input
                  type="text"
                  value={formData.relatedInvoice}
                  onChange={(e) => setFormData({ ...formData, relatedInvoice: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Enter invoice number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer *
                </label>
                <input
                  type="text"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Customer Code
                </label>
                <input
                  type="text"
                  value={formData.customerCode}
                  onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Enter customer code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount * ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tax Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.taxAmount}
                  onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Reason Code *
                </label>
                <select
                  value={formData.reasonCode}
                  onChange={(e) => {
                    const selectedReason = reasonCodes.find(r => r.code === e.target.value);
                    setFormData({ 
                      ...formData, 
                      reasonCode: e.target.value,
                      reason: selectedReason ? selectedReason.label : ''
                    });
                  }}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select reason</option>
                  {reasonCodes.map(reason => (
                    <option key={reason.code} value={reason.code}>{reason.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Custom Reason
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Enter custom reason"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedCreditNote(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveCreditNote}>
                <Save className="h-4 w-4 mr-2" />
                Save Credit Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCreditNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Credit Note Details - {selectedCreditNote.creditNoteNumber}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCreditNote(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Credit Note Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Credit Note Number:</span>
                      <span className="font-medium">{selectedCreditNote.creditNoteNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{new Date(selectedCreditNote.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusVariant(selectedCreditNote.status)}>
                        {selectedCreditNote.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Related Invoice:</span>
                      <span className="font-medium text-blue-600">{selectedCreditNote.relatedInvoice}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="font-medium">{selectedCreditNote.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer Code:</span>
                      <span>{selectedCreditNote.customerCode}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Financial Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-mono text-red-600">-${selectedCreditNote.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax Amount:</span>
                      <span className="font-mono text-red-600">-${selectedCreditNote.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Total Amount:</span>
                      <span className="font-mono font-bold text-red-600">-${selectedCreditNote.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Reason & Workflow</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reason:</span>
                      <span>{selectedCreditNote.reason}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reason Code:</span>
                      <Badge variant="outline">{selectedCreditNote.reasonCode}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Workflow:</span>
                      <Badge variant={getWorkflowVariant(selectedCreditNote.workflow)}>
                        {selectedCreditNote.workflow.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Audit Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created By:</span>
                      <span>{selectedCreditNote.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Modified:</span>
                      <span>{new Date(selectedCreditNote.lastModified).toLocaleString()}</span>
                    </div>
                    {selectedCreditNote.approvedBy && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Approved By:</span>
                          <span>{selectedCreditNote.approvedBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Approved Date:</span>
                          <span>{new Date(selectedCreditNote.approvedDate).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionModal && selectedCreditNote && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Version History - {selectedCreditNote.creditNoteNumber}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowVersionModal(false);
                  setSelectedCreditNote(null);
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
                    <span className="font-medium">Version {selectedCreditNote.version}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(selectedCreditNote.lastModified).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Modified by {selectedCreditNote.createdBy}
                </p>
                <p className="text-sm">Status: {selectedCreditNote.status}</p>
                <p className="text-sm">Amount: ${selectedCreditNote.totalAmount.toFixed(2)}</p>
              </div>

              {selectedCreditNote.version > 1 && (
                <div className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Version {selectedCreditNote.version - 1}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(Date.now() - 86400000).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Modified by System
                  </p>
                  <p className="text-sm">Status: Draft</p>
                  <p className="text-sm">Amount: ${(selectedCreditNote.totalAmount - 50).toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditNotes;