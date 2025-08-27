import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Package, 
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
  CheckCircle,
  TrendingUp,
  BarChart3,
  DollarSign,
  Percent
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

const Products = () => {
  const dispatch = useDispatch();
  const products = useSelector(state => state.masterData.products);
  const isLoading = useSelector(state => state.masterData.isImporting);
  const error = useSelector(state => state.masterData.error);
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    productCode: '',
    productName: '',
    category: '',
    description: '',
    unitPrice: 0,
    taxRate: 0,
    isActive: true
  });
  const [sortBy, setSortBy] = useState('productName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Product categories
  const categories = [
    'Software', 'Hardware', 'Services', 'Training', 'Support', 'Consulting', 'Licenses'
  ];

  // Load products on component mount
  useEffect(() => {
    dispatch(loadMasterData({ dataType: 'products' }));
  }, [dispatch]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = !searchTerm || 
        product.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || 
        product.category?.toLowerCase() === categoryFilter.toLowerCase();
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && product.isActive) ||
        (statusFilter === 'inactive' && !product.isActive);
      
      const matchesPriceRange = (!priceRange.min || product.unitPrice >= parseFloat(priceRange.min)) &&
        (!priceRange.max || product.unitPrice <= parseFloat(priceRange.max));
      
      return matchesSearch && matchesCategory && matchesStatus && matchesPriceRange;
    });

    // Sort products
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      
      if (sortBy === 'unitPrice' || sortBy === 'taxRate') {
        const aNum = parseFloat(aValue) || 0;
        const bNum = parseFloat(bValue) || 0;
        return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      if (sortOrder === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });

    return filtered;
  }, [products, searchTerm, categoryFilter, statusFilter, priceRange, sortBy, sortOrder]);

  // Table columns configuration
  const columns = [
    {
      key: 'productCode',
      header: 'Code',
      render: (value, product) => (
        <div className="font-medium text-primary">{value}</div>
      )
    },
    {
      key: 'productName',
      header: 'Product Name',
      render: (value, product) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-sm text-muted-foreground">{product.description || 'No description'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (value) => (
        <Badge variant="outline">{value || 'Uncategorized'}</Badge>
      )
    },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      render: (value) => (
        <div className="text-right font-mono">
          ${(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      )
    },
    {
      key: 'taxRate',
      header: 'Tax Rate',
      render: (value) => (
        <div className="text-right font-mono">
          {(value || 0).toFixed(1)}%
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
      render: (_, product) => (
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleViewProduct(product)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleEditProduct(product)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleShowUsage(product)}
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleDeleteProduct(product)}
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

  const handleAddProduct = () => {
    setFormData({
      productCode: '',
      productName: '',
      category: '',
      description: '',
      unitPrice: 0,
      taxRate: 0,
      isActive: true
    });
    setShowAddModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setFormData({ ...product });
    setShowEditModal(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    // In a real app, this would navigate to a detailed view
    alert(`Viewing product: ${product.productName}`);
  };

  const handleDeleteProduct = (product) => {
    if (window.confirm(`Are you sure you want to delete ${product.productName}?`)) {
      // In a real app, this would dispatch a delete action
      alert(`Product ${product.productName} would be deleted`);
    }
  };

  const handleShowUsage = (product) => {
    setSelectedProduct(product);
    setShowUsageModal(true);
  };

  const handleSaveProduct = () => {
    // Validate form data
    if (!formData.productCode || !formData.productName || !formData.unitPrice) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate pricing logic
    if (formData.unitPrice < 0) {
      alert('Unit price cannot be negative');
      return;
    }

    if (formData.taxRate < 0 || formData.taxRate > 100) {
      alert('Tax rate must be between 0 and 100');
      return;
    }

    // In a real app, this would dispatch save action
    console.log('Saving product:', formData);
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedProduct(null);
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleExport = () => {
    const filters = {
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
      priceRange: priceRange.min || priceRange.max ? priceRange : null
    };
    
    dispatch(exportMasterData({
      dataType: 'products',
      filters,
      format: 'csv',
      options: {}
    }));
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      dispatch(validateImportFile({ file, dataType: 'products' }));
    }
  };

  const clearErrorMessage = () => {
    dispatch(clearError());
  };

  const clearPriceFilter = () => {
    setPriceRange({ min: '', max: '' });
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
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">
            Manage product catalog and pricing information
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
          <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min price"
            value={priceRange.min}
            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            placeholder="Max price"
            value={priceRange.max}
            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
            className="w-full border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {(priceRange.min || priceRange.max) && (
            <Button variant="ghost" size="sm" onClick={clearPriceFilter}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filteredProducts.length} of {products.length} products</span>
        <div className="flex items-center gap-4">
          <span>Avg Price: ${products.length > 0 ? (products.reduce((sum, p) => sum + (p.unitPrice || 0), 0) / products.length).toFixed(2) : '0.00'}</span>
          <span>Active: {products.filter(p => p.isActive).length}</span>
        </div>
      </div>

      {/* Products table */}
      <DataTable
        data={filteredProducts}
        columns={columns}
        loading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchable={false} // We handle search externally
        emptyMessage="No products found"
      />

      {/* Add/Edit Product Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {showAddModal ? 'Add Product' : 'Edit Product'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedProduct(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Code *
                </label>
                <input
                  type="text"
                  value={formData.productCode}
                  onChange={(e) => setFormData({ ...formData, productCode: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter product code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Unit Price * ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="0.0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Enter product description"
                  rows={3}
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
                  setSelectedProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProduct}>
                <Save className="h-4 w-4 mr-2" />
                Save Product
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
              <h2 className="text-xl font-semibold">Import Products</h2>
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
                <p>Required columns: productCode, productName, unitPrice</p>
                <p>Optional columns: category, description, taxRate</p>
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

      {/* Usage Report Modal */}
      {showUsageModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Usage Report - {selectedProduct.productName}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowUsageModal(false);
                  setSelectedProduct(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Total Sales</span>
                </div>
                <div className="text-2xl font-bold">$12,450</div>
                <div className="text-sm text-muted-foreground">Last 30 days</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Invoices</span>
                </div>
                <div className="text-2xl font-bold">24</div>
                <div className="text-sm text-muted-foreground">This month</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Avg. Value</span>
                </div>
                <div className="text-2xl font-bold">${selectedProduct.unitPrice}</div>
                <div className="text-sm text-muted-foreground">Per unit</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Recent Invoices</h3>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">Invoice</th>
                      <th className="text-left p-3 text-sm font-medium">Customer</th>
                      <th className="text-left p-3 text-sm font-medium">Quantity</th>
                      <th className="text-left p-3 text-sm font-medium">Amount</th>
                      <th className="text-left p-3 text-sm font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Mock usage data */}
                    <tr className="border-t border-border">
                      <td className="p-3 text-sm">INV-2024-001</td>
                      <td className="p-3 text-sm">ABC Corporation</td>
                      <td className="p-3 text-sm">2</td>
                      <td className="p-3 text-sm font-mono">${(selectedProduct.unitPrice * 2).toFixed(2)}</td>
                      <td className="p-3 text-sm">{new Date().toLocaleDateString()}</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="p-3 text-sm">INV-2024-002</td>
                      <td className="p-3 text-sm">XYZ Industries</td>
                      <td className="p-3 text-sm">1</td>
                      <td className="p-3 text-sm font-mono">${selectedProduct.unitPrice.toFixed(2)}</td>
                      <td className="p-3 text-sm">{new Date(Date.now() - 86400000).toLocaleDateString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;