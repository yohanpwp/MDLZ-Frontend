import { useDispatch, useSelector } from 'react-redux';
import { Calendar, Filter, RotateCcw, Search } from 'lucide-react';
import Button from '../ui/Button';
import { setFilters, clearFilters } from '../../redux/slices/reportsSlice';
import { SEVERITY_LEVELS } from '../../types/reports';

const ReportFilters = () => {
  const dispatch = useDispatch();
  const { filters } = useSelector(state => state.reports);
  const { results } = useSelector(state => state.validation);

  // Get unique values for filter options
  const uniqueCustomers = [...new Set(results.map(r => r.recordId.split('_')[0]))];
  const uniqueFields = [...new Set(results.map(r => r.field))];

  const handleFilterChange = (filterName, value) => {
    dispatch(setFilters({ [filterName]: value }));
  };

  const handleArrayFilterChange = (filterName, value, checked) => {
    const currentArray = filters[filterName] || [];
    let newArray;
    
    if (checked) {
      newArray = [...currentArray, value];
    } else {
      newArray = currentArray.filter(item => item !== value);
    }
    
    dispatch(setFilters({ [filterName]: newArray }));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  const getFilterCount = () => {
    let count = 0;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.severityLevels.length > 0) count++;
    if (filters.minDiscrepancyAmount > 0) count++;
    if (filters.maxDiscrepancyAmount !== null) count++;
    if (filters.customerIds.length > 0) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Report Filters</h3>
          {getFilterCount() > 0 && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
              {getFilterCount()} active
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Clear All
        </Button>
      </div>

      {/* Date Range */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Date Range
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Severity Levels */}
      <div>
        <h4 className="font-medium mb-3">Severity Levels</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(SEVERITY_LEVELS).map(([key, value]) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.severityLevels.includes(value)}
                onChange={(e) => handleArrayFilterChange('severityLevels', value, e.target.checked)}
                className="rounded border-border focus:ring-primary"
              />
              <span className="text-sm capitalize">{value}</span>
              <div className={`w-3 h-3 rounded-full ${getSeverityColor(value)}`} />
            </label>
          ))}
        </div>
      </div>

      {/* Discrepancy Amount Range */}
      <div>
        <h4 className="font-medium mb-3">Discrepancy Amount Range</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Minimum Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.minDiscrepancyAmount}
              onChange={(e) => handleFilterChange('minDiscrepancyAmount', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Maximum Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={filters.maxDiscrepancyAmount || ''}
              onChange={(e) => handleFilterChange('maxDiscrepancyAmount', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="No limit"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Customer Selection */}
      {uniqueCustomers.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Customers</h4>
          <div className="max-h-40 overflow-y-auto border border-border rounded-md p-3 space-y-2">
            {uniqueCustomers.slice(0, 10).map((customer) => (
              <label key={customer} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.customerIds.includes(customer)}
                  onChange={(e) => handleArrayFilterChange('customerIds', customer, e.target.checked)}
                  className="rounded border-border focus:ring-primary"
                />
                <span className="text-sm">{customer}</span>
              </label>
            ))}
            {uniqueCustomers.length > 10 && (
              <p className="text-xs text-muted-foreground">
                Showing first 10 customers. Use search for more specific filtering.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Field Selection */}
      {uniqueFields.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Validation Fields</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uniqueFields.map((field) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.validationFields?.includes(field) || false}
                  onChange={(e) => handleArrayFilterChange('validationFields', field, e.target.checked)}
                  className="rounded border-border focus:ring-primary"
                />
                <span className="text-sm capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Record Type Selection */}
      <div>
        <h4 className="font-medium mb-3">Record Types</h4>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeValidRecords}
              onChange={(e) => handleFilterChange('includeValidRecords', e.target.checked)}
              className="rounded border-border focus:ring-primary"
            />
            <span className="text-sm">Valid Records</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.includeInvalidRecords}
              onChange={(e) => handleFilterChange('includeInvalidRecords', e.target.checked)}
              className="rounded border-border focus:ring-primary"
            />
            <span className="text-sm">Invalid Records</span>
          </label>
        </div>
      </div>

      {/* Sorting */}
      <div>
        <h4 className="font-medium mb-3">Sorting</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="validatedAt">Date</option>
              <option value="discrepancy">Discrepancy Amount</option>
              <option value="severity">Severity</option>
              <option value="field">Field</option>
              <option value="recordId">Record ID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {getFilterCount() > 0 && (
        <div className="p-4 bg-accent/30 rounded-lg">
          <h4 className="font-medium mb-2">Active Filters Summary</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            {filters.startDate && <p>• Start Date: {filters.startDate}</p>}
            {filters.endDate && <p>• End Date: {filters.endDate}</p>}
            {filters.severityLevels.length > 0 && (
              <p>• Severity: {filters.severityLevels.join(', ')}</p>
            )}
            {filters.minDiscrepancyAmount > 0 && (
              <p>• Min Amount: ${filters.minDiscrepancyAmount}</p>
            )}
            {filters.maxDiscrepancyAmount !== null && (
              <p>• Max Amount: ${filters.maxDiscrepancyAmount}</p>
            )}
            {filters.customerIds.length > 0 && (
              <p>• Customers: {filters.customerIds.length} selected</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get severity color
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'low':
      return 'bg-green-500';
    case 'medium':
      return 'bg-yellow-500';
    case 'high':
      return 'bg-orange-500';
    case 'critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export default ReportFilters;