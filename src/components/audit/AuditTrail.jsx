import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, Filter, Download, RefreshCw, Calendar, 
  AlertTriangle, Info, AlertCircle, XCircle, 
  User, Shield, Database, Settings, Eye
} from 'lucide-react';
import Button from '../ui/Button';
import {
  fetchAuditLogs,
  exportAuditLogs,
  fetchAuditStatistics,
  updateFilters,
  resetFilters,
  clearMessages,
  selectAuditLogs,
  selectAuditStatistics,
  selectAuditFilters,
  selectAuditPagination,
  selectIsLoading,
  selectIsExporting,
  selectError,
  selectSuccessMessage
} from '../../redux/slices/auditSlice.js';

const AuditTrail = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const auditLogs = useSelector(selectAuditLogs);
  const statistics = useSelector(selectAuditStatistics);
  const filters = useSelector(selectAuditFilters);
  const pagination = useSelector(selectAuditPagination);
  const isLoading = useSelector(selectIsLoading);
  const isExporting = useSelector(selectIsExporting);
  const error = useSelector(selectError);
  const successMessage = useSelector(selectSuccessMessage);

  // Local state
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchAuditLogs(filters));
    dispatch(fetchAuditStatistics(filters));
  }, [dispatch, filters]);

  // Handle search
  const handleSearch = (searchTerm) => {
    dispatch(updateFilters({ userId: searchTerm, page: 1 }));
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    dispatch(updateFilters({ [filterName]: value, page: 1 }));
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    
    dispatch(updateFilters({ 
      startDate: newDateRange.startDate,
      endDate: newDateRange.endDate,
      page: 1
    }));
  };

  // Handle export
  const handleExport = () => {
    dispatch(exportAuditLogs(filters));
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(fetchAuditLogs(filters));
    dispatch(fetchAuditStatistics(filters));
  };

  // Handle reset filters
  const handleResetFilters = () => {
    dispatch(resetFilters());
    setDateRange({ startDate: '', endDate: '' });
  };

  // Get severity icon and color
  const getSeverityDisplay = (severity) => {
    const displays = {
      info: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
      warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
      error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' }
    };
    return displays[severity] || displays.info;
  };

  // Get module icon
  const getModuleIcon = (module) => {
    const icons = {
      authentication: User,
      user_management: Shield,
      data_access: Database,
      configuration: Settings,
      security: AlertTriangle
    };
    return icons[module] || Eye;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Format details
  const formatDetails = (details) => {
    if (!details) return '';
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    } catch {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {(successMessage || error) && (
        <div className={`p-4 rounded-lg ${
          successMessage ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span>{successMessage || error}</span>
            <button 
              onClick={() => dispatch(clearMessages())}
              className="text-sm underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Audit Trail</h2>
          <p className="text-muted-foreground">
            System activity logs and compliance monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button 
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className={`h-4 w-4 mr-2 ${isExporting ? 'animate-spin' : ''}`} />
            Export
          </Button>
          <Button 
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold">Total Events</h3>
          </div>
          <p className="text-2xl font-bold">{statistics.totalEvents}</p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold">Last 24 Hours</h3>
          </div>
          <p className="text-2xl font-bold">{statistics.eventsLast24Hours}</p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold">Warnings</h3>
          </div>
          <p className="text-2xl font-bold">{statistics.eventsBySeverity.warning || 0}</p>
        </div>
        
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold">Critical</h3>
          </div>
          <p className="text-2xl font-bold">{statistics.eventsBySeverity.critical || 0}</p>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Filter by user ID..."
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Action</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="CREATE_USER">Create User</option>
                <option value="UPDATE_USER">Update User</option>
                <option value="DELETE_USER">Delete User</option>
                <option value="VIEW_INVOICES">View Invoices</option>
                <option value="VALIDATE_INVOICES">Validate Invoices</option>
                <option value="EXPORT_DATA">Export Data</option>
                <option value="IMPORT_DATA">Import Data</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Module</label>
              <select
                value={filters.module}
                onChange={(e) => handleFilterChange('module', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Modules</option>
                <option value="authentication">Authentication</option>
                <option value="user_management">User Management</option>
                <option value="data_access">Data Access</option>
                <option value="configuration">Configuration</option>
                <option value="security">Security</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Severities</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input
                type="datetime-local"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input
                type="datetime-local"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                variant="outline"
                onClick={handleResetFilters}
                className="w-full"
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Timestamp</th>
                <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Module</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Action</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Severity</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Description</th>
                <th className="text-left p-4 font-medium text-muted-foreground">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => {
                const severityDisplay = getSeverityDisplay(log.severity);
                const ModuleIcon = getModuleIcon(log.module);
                
                return (
                  <tr key={log.id} className="border-t border-border hover:bg-muted/25">
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{log.userId || 'System'}</div>
                      {log.targetUserId && (
                        <div className="text-sm text-muted-foreground">
                          Target: {log.targetUserId}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="capitalize">{log.module?.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <severityDisplay.icon className={`h-4 w-4 ${severityDisplay.color}`} />
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${severityDisplay.bg} ${severityDisplay.color}`}>
                          {log.severity}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="max-w-md">
                        <div>{log.description}</div>
                        {log.details && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatDetails(log.details)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {log.ipAddress}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => handleFilterChange('page', pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => handleFilterChange('page', pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTrail;