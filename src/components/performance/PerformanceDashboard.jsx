import React, { useState, useEffect } from 'react';
import { Activity, Download, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Button } from '../ui';
import { Alert, AlertDescription } from '../ui/Alert';
import { usePerformanceDashboard } from '../../hooks/usePerformanceMonitoring.js';
import { useAccessibility } from '../../hooks/useAccessibility.js';

/**
 * Performance Dashboard Component
 * Displays performance metrics, warnings, and recommendations
 */
const PerformanceDashboard = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { getPerformanceSummary, exportPerformanceData, clearMetrics } = usePerformanceDashboard();
  const { announce } = useAccessibility({
    announceOnMount: 'Performance dashboard loaded'
  });

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = () => {
    setIsRefreshing(true);
    
    try {
      const data = getPerformanceSummary();
      setPerformanceData(data);
      announce('Performance data refreshed', 'polite');
    } catch (error) {
      console.error('Failed to load performance data:', error);
      announce('Failed to load performance data', 'assertive');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = exportPerformanceData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      announce('Performance data exported successfully', 'polite');
    } catch (error) {
      console.error('Failed to export performance data:', error);
      announce('Failed to export performance data', 'assertive');
    }
  };

  const handleClearMetrics = () => {
    if (window.confirm('Are you sure you want to clear all performance metrics?')) {
      clearMetrics();
      loadPerformanceData();
      announce('Performance metrics cleared', 'polite');
    }
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  if (!performanceData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor application performance and optimization opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadPerformanceData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearMetrics}
          >
            Clear Metrics
          </Button>
        </div>
      </div>

      {/* Performance Warnings */}
      {performanceData.warnings && performanceData.warnings.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Performance Warnings</h3>
          {performanceData.warnings.map((warning, index) => (
            <Alert key={index} className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>{warning.type}:</strong> {warning.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Performance Recommendations */}
      {performanceData.recommendations && performanceData.recommendations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Optimization Recommendations</h3>
          {performanceData.recommendations.map((rec, index) => (
            <Alert key={index} className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>{rec.type}:</strong> {rec.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Navigation Timing */}
        {performanceData.metrics.navigation && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Page Load Performance
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Page Load:</span>
                <span className="font-mono">
                  {formatDuration(performanceData.metrics.navigation.pageLoad)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DOM Interactive:</span>
                <span className="font-mono">
                  {formatDuration(performanceData.metrics.navigation.domInteractive)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">First Byte:</span>
                <span className="font-mono">
                  {formatDuration(performanceData.metrics.navigation.firstByte)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Memory Usage */}
        {performanceData.metrics.memory && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Used:</span>
                <span className="font-mono">
                  {formatBytes(performanceData.metrics.memory.used)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-mono">
                  {formatBytes(performanceData.metrics.memory.total)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limit:</span>
                <span className="font-mono">
                  {formatBytes(performanceData.metrics.memory.limit)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ 
                    width: `${(performanceData.metrics.memory.used / performanceData.metrics.memory.limit) * 100}%` 
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Resource Performance */}
        {performanceData.metrics.resources && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Resource Loading</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Resources:</span>
                <span className="font-mono">
                  {performanceData.metrics.resources.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cached:</span>
                <span className="font-mono">
                  {performanceData.metrics.resources.filter(r => r.cached).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Large Resources:</span>
                <span className="font-mono">
                  {performanceData.metrics.resources.filter(r => r.size > 1024 * 1024).length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Component Performance */}
        {performanceData.metrics.components && performanceData.metrics.components.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Component Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Renders:</span>
                <span className="font-mono">
                  {performanceData.metrics.components.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slow Renders:</span>
                <span className="font-mono">
                  {performanceData.metrics.components.filter(c => c.renderTime > 16).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg Render Time:</span>
                <span className="font-mono">
                  {formatDuration(
                    performanceData.metrics.components.reduce((sum, c) => sum + c.renderTime, 0) / 
                    performanceData.metrics.components.length
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Connection Info */}
        {performanceData.metrics.connection && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Connection Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-mono">
                  {performanceData.metrics.connection.effectiveType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Downlink:</span>
                <span className="font-mono">
                  {performanceData.metrics.connection.downlink} Mbps
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RTT:</span>
                <span className="font-mono">
                  {performanceData.metrics.connection.rtt}ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Application Uptime */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Application Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uptime:</span>
              <span className="font-mono">
                {formatDuration(performanceData.uptime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Application Running</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;