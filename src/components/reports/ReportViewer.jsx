import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Eye, 
  Download, 
  Share, 
  Trash2, 
  Calendar, 
  User, 
  FileText, 
  BarChart3, 
  Table,
  X,
  ExternalLink
} from 'lucide-react';
import Button from '../ui/Button';
import ExportOptions from './ExportOptions';
import { deleteReport } from '../../redux/slices/reportsSlice';

const ReportViewer = ({ report, onClose }) => {
  const dispatch = useDispatch();
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [activeSection, setActiveSection] = useState('summary');

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      dispatch(deleteReport(report.id));
      onClose();
    }
  };

  const renderSummarySection = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-accent/30 rounded-lg">
          <div className="text-2xl font-bold text-primary">{report.data.summary.totalRecords}</div>
          <div className="text-sm text-muted-foreground">Total Records</div>
        </div>
        <div className="p-4 bg-accent/30 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{report.data.summary.validRecords}</div>
          <div className="text-sm text-muted-foreground">Valid Records</div>
        </div>
        <div className="p-4 bg-accent/30 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{report.data.summary.invalidRecords}</div>
          <div className="text-sm text-muted-foreground">Invalid Records</div>
        </div>
        <div className="p-4 bg-accent/30 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            ${report.data.summary.totalDiscrepancyAmount.toFixed(2)}
          </div>
          <div className="text-sm text-muted-foreground">Total Discrepancy</div>
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="p-6 bg-card border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Severity Breakdown</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(report.data.summary.severityBreakdown).map(([severity, count]) => {
            const percentage = report.data.summary.totalRecords > 0 
              ? ((count / report.data.summary.totalRecords) * 100).toFixed(1)
              : 0;
            
            return (
              <div key={severity} className="text-center">
                <div className={`w-full h-20 rounded-lg flex items-end justify-center ${getSeverityBgColor(severity)}`}>
                  <div className="text-white font-bold mb-2">{count}</div>
                </div>
                <div className="text-sm mt-2 capitalize">{severity}</div>
                <div className="text-xs text-muted-foreground">{percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-card border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Discrepancy Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Amount:</span>
              <span className="font-medium">${report.data.summary.averageDiscrepancyAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum Amount:</span>
              <span className="font-medium">${report.data.summary.maxDiscrepancyAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Discrepancies:</span>
              <span className="font-medium">{report.data.summary.totalDiscrepancies}</span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-card border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Processing Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing Time:</span>
              <span className="font-medium">{report.metadata.processingTimeMs}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Batch ID:</span>
              <span className="font-medium text-xs">{report.data.summary.batchId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Source:</span>
              <span className="font-medium">{report.metadata.dataSource}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChartsSection = () => (
    <div className="space-y-6">
      {report.data.charts.map((chart) => (
        <div key={chart.id} className="p-6 bg-card border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">{chart.title}</h3>
          
          {chart.type === 'pie' && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                {chart.data.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <span className="text-sm font-medium ml-auto">{item.value}</span>
                    {item.percentage && (
                      <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="h-16 w-16 mx-auto mb-2" />
                  <p>Chart visualization would appear here</p>
                </div>
              </div>
            </div>
          )}
          
          {chart.type === 'bar' && (
            <div className="space-y-4">
              <div className="text-center text-muted-foreground mb-4">
                <BarChart3 className="h-16 w-16 mx-auto mb-2" />
                <p>Bar chart visualization would appear here</p>
              </div>
              <div className="space-y-2">
                {chart.data.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-sm w-20">{item.name}</span>
                    <div className="flex-1 bg-accent/30 rounded-full h-6 relative">
                      <div 
                        className="bg-primary h-full rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.min((item.value / Math.max(...chart.data.map(d => d.value))) * 100, 100)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {report.data.charts.length === 0 && (
        <div className="text-center py-12 bg-card border rounded-lg">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No charts available</h3>
          <p className="text-muted-foreground">
            This report doesn't include any chart visualizations
          </p>
        </div>
      )}
    </div>
  );

  const renderDataSection = () => (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-border">
          <thead>
            <tr className="bg-accent/30">
              <th className="border border-border p-3 text-left text-sm font-medium">Record ID</th>
              <th className="border border-border p-3 text-left text-sm font-medium">Field</th>
              <th className="border border-border p-3 text-left text-sm font-medium">Original</th>
              <th className="border border-border p-3 text-left text-sm font-medium">Calculated</th>
              <th className="border border-border p-3 text-left text-sm font-medium">Discrepancy</th>
              <th className="border border-border p-3 text-left text-sm font-medium">Severity</th>
              <th className="border border-border p-3 text-left text-sm font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {report.data.records.slice(0, 50).map((record, index) => (
              <tr key={index} className="hover:bg-accent/20">
                <td className="border border-border p-3 text-sm">{record.recordId}</td>
                <td className="border border-border p-3 text-sm">{record.field}</td>
                <td className="border border-border p-3 text-sm">{record.originalValue}</td>
                <td className="border border-border p-3 text-sm">{record.calculatedValue}</td>
                <td className="border border-border p-3 text-sm">${record.discrepancy.toFixed(2)}</td>
                <td className="border border-border p-3 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(record.severity)}`}>
                    {record.severity}
                  </span>
                </td>
                <td className="border border-border p-3 text-sm">
                  {new Date(record.validatedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {report.data.records.length > 50 && (
          <div className="text-center py-4 text-muted-foreground">
            Showing first 50 of {report.data.records.length} records. 
            Export the report to see all data.
          </div>
        )}
        
        {report.data.records.length === 0 && (
          <div className="text-center py-12">
            <Table className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No data available</h3>
            <p className="text-muted-foreground">
              This report doesn't contain any detailed records
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">{report.name}</h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(report.generatedAt).toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {report.generatedBy}
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {report.recordCount} records
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportOptions(true)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveSection('summary')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'summary'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveSection('charts')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'charts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Charts ({report.data.charts.length})
            </button>
            <button
              onClick={() => setActiveSection('data')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'data'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Data ({report.data.records.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'summary' && renderSummarySection()}
          {activeSection === 'charts' && renderChartsSection()}
          {activeSection === 'data' && renderDataSection()}
        </div>

        {/* Export Options Modal */}
        {showExportOptions && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60 p-4">
            <div className="bg-background border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <ExportOptions 
                  report={report} 
                  onClose={() => setShowExportOptions(false)} 
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getSeverityColor = (severity) => {
  switch (severity) {
    case 'low':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'critical':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getSeverityBgColor = (severity) => {
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

export default ReportViewer;