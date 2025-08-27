/**
 * ValidationResults Component
 * 
 * Displays validation results in a data table with filtering, sorting,
 * and detailed discrepancy drill-down capabilities.
 */

import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectFilteredValidationResults,
  selectValidationFilters,
  selectValidationSort,
  selectIsValidating,
  setValidationFilters,
  clearValidationFilters,
  setValidationSort
} from '../../redux/slices/validationSlice';
import DataTable from '../ui/DataTable';
import VirtualizedTable from '../ui/VirtualizedTable';
import { Badge } from '../ui/Badge';
import Button from '../ui/Button';
import { 
  Filter, 
  X, 
  Eye, 
  Download,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { SEVERITY_LEVELS } from '../../types/validation';

/**
 * Severity badge component
 */
const SeverityBadge = ({ severity }) => {
  const variants = {
    [SEVERITY_LEVELS.CRITICAL]: 'critical',
    [SEVERITY_LEVELS.HIGH]: 'high', 
    [SEVERITY_LEVELS.MEDIUM]: 'medium',
    [SEVERITY_LEVELS.LOW]: 'low'
  };
  
  return (
    <Badge variant={variants[severity] || 'secondary'}>
      {severity?.toUpperCase() || 'UNKNOWN'}
    </Badge>
  );
};

/**
 * Currency formatter
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
};

/**
 * Date formatter
 */
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Filters panel component
 */
const FiltersPanel = ({ filters, onFiltersChange, onClearFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== null && value !== undefined && value !== ''
  );

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={hasActiveFilters ? 'border-primary' : ''}
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters && (
          <Badge variant="primary" className="ml-2 text-xs">
            Active
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-10 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filter Results</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Severity filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Severity</label>
              <select
                value={filters.severity || ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  severity: e.target.value || null 
                })}
                className="w-full border border-border rounded px-3 py-2 text-sm"
              >
                <option value="">All Severities</option>
                <option value={SEVERITY_LEVELS.CRITICAL}>Critical</option>
                <option value={SEVERITY_LEVELS.HIGH}>High</option>
                <option value={SEVERITY_LEVELS.MEDIUM}>Medium</option>
                <option value={SEVERITY_LEVELS.LOW}>Low</option>
              </select>
            </div>

            {/* Field filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Field</label>
              <select
                value={filters.field || ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  field: e.target.value || null 
                })}
                className="w-full border border-border rounded px-3 py-2 text-sm"
              >
                <option value="">All Fields</option>
                <option value="taxAmount">Tax Amount</option>
                <option value="totalAmount">Total Amount</option>
                <option value="discountAmount">Discount Amount</option>
                <option value="subtotal">Subtotal</option>
              </select>
            </div>

            {/* Record ID filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Record ID</label>
              <input
                type="text"
                placeholder="Enter record ID..."
                value={filters.recordId || ''}
                onChange={(e) => onFiltersChange({ 
                  ...filters, 
                  recordId: e.target.value || null 
                })}
                className="w-full border border-border rounded px-3 py-2 text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                disabled={!hasActiveFilters}
              >
                Clear All
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};/**

 * Detailed discrepancy modal component
 */
const DiscrepancyDetailModal = ({ result, isOpen, onClose }) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Discrepancy Details</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Basic information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Record ID
                </label>
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono">{result.recordId}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Field
                </label>
                <span className="capitalize">{result.field}</span>
              </div>
            </div>

            {/* Severity and validation time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Severity
                </label>
                <SeverityBadge severity={result.severity} />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Validated At
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(result.validatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Value comparison */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-3">Value Comparison</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Original Value</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(result.originalValue)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Calculated Value</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(result.calculatedValue)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Discrepancy</div>
                  <div className="text-lg font-semibold text-red-600">
                    {formatCurrency(result.discrepancy)}
                  </div>
                </div>
              </div>
            </div>

            {/* Percentage difference */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Percentage Difference</span>
                <span className="text-lg font-semibold">
                  {(result.discrepancyPercentage || 0).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Message */}
            {result.message && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Validation Message
                </label>
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  {result.message}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};/**

 * Main ValidationResults component
 */
const ValidationResults = () => {
  const dispatch = useDispatch();
  const results = useSelector(selectFilteredValidationResults);
  const filters = useSelector(selectValidationFilters);
  const { sortBy, sortOrder } = useSelector(selectValidationSort);
  const isValidating = useSelector(selectIsValidating);
  
  const [selectedResult, setSelectedResult] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);

  // Auto-enable virtual scrolling for large datasets
  React.useEffect(() => {
    setUseVirtualScrolling(results.length > 100);
  }, [results.length]);

  // Table columns configuration
  const columns = useMemo(() => [
    {
      key: 'recordId',
      header: 'Record ID',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'field',
      header: 'Field',
      render: (value) => (
        <span className="capitalize font-medium">{value}</span>
      )
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (value) => <SeverityBadge severity={value} />
    },
    {
      key: 'originalValue',
      header: 'Original Value',
      render: (value) => (
        <span className="font-mono">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'calculatedValue',
      header: 'Calculated Value',
      render: (value) => (
        <span className="font-mono">{formatCurrency(value)}</span>
      )
    },
    {
      key: 'discrepancy',
      header: 'Discrepancy',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4 text-red-500" />
          <span className="font-mono font-semibold text-red-600">
            {formatCurrency(value)}
          </span>
        </div>
      )
    },
    {
      key: 'discrepancyPercentage',
      header: 'Percentage',
      render: (value) => (
        <span className="font-semibold">
          {(value || 0).toFixed(2)}%
        </span>
      )
    },
    {
      key: 'validatedAt',
      header: 'Validated At',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (_, result) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetails(result);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ], []);

  const handleSort = (field, order) => {
    dispatch(setValidationSort({ sortBy: field, sortOrder: order }));
  };

  const handleFiltersChange = (newFilters) => {
    dispatch(setValidationFilters(newFilters));
  };

  const handleClearFilters = () => {
    dispatch(clearValidationFilters());
  };

  const handleViewDetails = (result) => {
    setSelectedResult(result);
    setIsDetailModalOpen(true);
  };

  const handleRowClick = (result) => {
    handleViewDetails(result);
  };

  const handleExportResults = () => {
    // TODO: Implement export functionality
    console.log('Exporting results...', results);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Validation Results</h2>
          <p className="text-muted-foreground">
            {results.length} results found
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <FiltersPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
          
          {results.length > 50 && (
            <Button
              variant="outline"
              onClick={() => setUseVirtualScrolling(!useVirtualScrolling)}
            >
              {useVirtualScrolling ? 'Standard View' : 'Virtual Scrolling'}
            </Button>
          )}
          
          <Button variant="outline" onClick={handleExportResults}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Results table */}
      {useVirtualScrolling ? (
        <VirtualizedTable
          data={results}
          columns={columns}
          height={600}
          loading={isValidating}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
          emptyMessage="No validation results found. Upload and validate some files to see results here."
          className="min-h-[600px]"
        />
      ) : (
        <DataTable
          data={results}
          columns={columns}
          loading={isValidating}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
          searchable={true}
          searchPlaceholder="Search by record ID, field, or message..."
          emptyMessage="No validation results found. Upload and validate some files to see results here."
          className="min-h-[400px]"
        />
      )}

      {/* Detail modal */}
      <DiscrepancyDetailModal
        result={selectedResult}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedResult(null);
        }}
      />
    </div>
  );
};

export default ValidationResults;