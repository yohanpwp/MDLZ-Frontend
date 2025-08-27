/**
 * ValidationDashboard Component
 * 
 * Main dashboard component displaying validation summary statistics,
 * recent validation results, and quick action buttons.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { 
  selectValidationSummary, 
  selectValidationStatistics,
  selectUnacknowledgedAlerts,
  selectIsValidating,
  selectValidationProgress
} from '../../redux/slices/validationSlice';
import { Badge } from '../ui/Badge';
import Button from '../ui/Button';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  DollarSign,
  Clock,
  BarChart3,
  RefreshCw
} from 'lucide-react';

/**
 * Statistics card component
 */
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "primary",
  subtitle,
  badge,
  onClick 
}) => (
  <div 
    className={`bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow ${
      onClick ? 'cursor-pointer hover:border-primary/50' : ''
    }`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {badge && (
            <Badge variant={badge.variant} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-sm ${
            trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-600' : 'text-muted-foreground'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${trend.value < 0 ? 'rotate-180' : ''}`} />
            <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.period}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full bg-${color}/10 ml-4`}>
        <Icon className={`h-6 w-6 text-${color}`} />
      </div>
    </div>
  </div>
);

/**
 * Progress indicator for ongoing validation
 */
const ValidationProgress = ({ progress }) => {
  if (!progress) return null;

  const percentage = Math.round(progress.progressPercentage || 0);
  
  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin text-primary" />
          <span className="font-medium">Validation in Progress</span>
        </div>
        <Badge variant="info">{percentage}%</Badge>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2 mb-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{progress.currentOperation || 'Processing records...'}</span>
        <span>{progress.processedRecords || 0} / {progress.totalRecords || 0} records</span>
      </div>
    </div>
  );
};/**
 *
 Severity breakdown chart component
 */
const SeverityBreakdown = ({ statistics }) => {
  const { severityBreakdown } = statistics;
  const total = Object.values(severityBreakdown).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Severity Breakdown</h3>
        <div className="text-center text-muted-foreground py-8">
          No discrepancies found
        </div>
      </div>
    );
  }

  const severityData = [
    { 
      label: 'Critical', 
      count: severityBreakdown.critical, 
      color: 'bg-red-500',
      percentage: (severityBreakdown.critical / total * 100).toFixed(1)
    },
    { 
      label: 'High', 
      count: severityBreakdown.high, 
      color: 'bg-orange-500',
      percentage: (severityBreakdown.high / total * 100).toFixed(1)
    },
    { 
      label: 'Medium', 
      count: severityBreakdown.medium, 
      color: 'bg-yellow-500',
      percentage: (severityBreakdown.medium / total * 100).toFixed(1)
    },
    { 
      label: 'Low', 
      count: severityBreakdown.low, 
      color: 'bg-blue-500',
      percentage: (severityBreakdown.low / total * 100).toFixed(1)
    }
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Severity Breakdown</h3>
      
      {/* Progress bars */}
      <div className="space-y-3 mb-4">
        {severityData.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className={`w-3 h-3 rounded-full ${item.color}`} />
              <span className="text-sm font-medium">{item.label}</span>
              <div className="flex-1 bg-muted rounded-full h-2 mx-3">
                <div 
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{item.count}</div>
              <div className="text-xs text-muted-foreground">{item.percentage}%</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="text-sm text-muted-foreground text-center">
        Total: {total} discrepancies
      </div>
    </div>
  );
};

/**
 * Financial impact summary
 */
const FinancialImpact = ({ statistics }) => {
  const { financialImpact } = statistics;
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Financial Impact</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Discrepancy Amount</span>
          <span className="font-semibold text-red-600">
            {formatCurrency(financialImpact.totalDiscrepancyAmount)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Average Discrepancy</span>
          <span className="font-medium">
            {formatCurrency(financialImpact.averageDiscrepancyAmount)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Largest Discrepancy</span>
          <span className="font-medium">
            {formatCurrency(financialImpact.maxDiscrepancyAmount)}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Main ValidationDashboard component
 */
const ValidationDashboard = ({ onNavigateToResults, onNavigateToAlerts }) => {
  const summary = useSelector(selectValidationSummary);
  const statistics = useSelector(selectValidationStatistics);
  const unacknowledgedAlerts = useSelector(selectUnacknowledgedAlerts);
  const isValidating = useSelector(selectIsValidating);
  const progress = useSelector(selectValidationProgress);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(1)}%`;
  };

  const calculateSuccessRate = () => {
    if (summary.totalRecords === 0) return 0;
    return (summary.validRecords / summary.totalRecords * 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Validation Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor validation results and system performance
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {unacknowledgedAlerts.length > 0 && (
            <Button 
              variant="outline" 
              onClick={onNavigateToAlerts}
              className="relative"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Alerts
              <Badge variant="destructive" className="ml-2 text-xs">
                {unacknowledgedAlerts.length}
              </Badge>
            </Button>
          )}
          <Button onClick={onNavigateToResults}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View All Results
          </Button>
        </div>
      </div>

      {/* Validation progress */}
      {isValidating && <ValidationProgress progress={progress} />}

      {/* Main statistics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Records"
          value={formatNumber(summary.totalRecords)}
          icon={FileText}
          color="primary"
          subtitle="Processed in current batch"
          onClick={onNavigateToResults}
        />
        
        <StatCard
          title="Valid Records"
          value={formatNumber(summary.validRecords)}
          icon={CheckCircle}
          color="green-600"
          subtitle={`${formatPercentage(calculateSuccessRate())} success rate`}
        />
        
        <StatCard
          title="Discrepancies Found"
          value={formatNumber(summary.totalDiscrepancies)}
          icon={AlertTriangle}
          color="yellow-600"
          subtitle={`${formatNumber(summary.invalidRecords)} records affected`}
          badge={
            summary.criticalCount > 0 
              ? { variant: 'critical', text: `${summary.criticalCount} Critical` }
              : null
          }
          onClick={onNavigateToResults}
        />
        
        <StatCard
          title="Financial Impact"
          value={formatCurrency(statistics.financialImpact?.totalDiscrepancyAmount)}
          icon={DollarSign}
          color="red-600"
          subtitle="Total discrepancy amount"
        />
      </div>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SeverityBreakdown statistics={statistics} />
        <FinancialImpact statistics={statistics} />
      </div>

      {/* Summary information */}
      {summary.validationEndTime && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Last validation: {new Date(summary.validationEndTime).toLocaleString()}</span>
              </div>
              {summary.processingTimeMs && (
                <span>Processing time: {(summary.processingTimeMs / 1000).toFixed(2)}s</span>
              )}
            </div>
            {summary.batchId && (
              <Badge variant="outline" className="text-xs">
                Batch: {summary.batchId}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidationDashboard;