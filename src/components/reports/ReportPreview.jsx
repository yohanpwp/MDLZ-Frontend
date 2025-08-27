import { useSelector } from 'react-redux';
import { Eye, BarChart3, Table, FileText, TrendingUp } from 'lucide-react';

const ReportPreview = ({ template }) => {
  const { filters } = useSelector(state => state.reports);
  const { results, summary } = useSelector(state => state.validation);

  // Apply filters to get preview data
  const getPreviewData = () => {
    let filteredResults = [...results];
    
    // Apply basic filters for preview
    if (filters.severityLevels.length > 0) {
      filteredResults = filteredResults.filter(result => 
        filters.severityLevels.includes(result.severity)
      );
    }
    
    if (filters.minDiscrepancyAmount > 0) {
      filteredResults = filteredResults.filter(result => 
        result.discrepancy >= filters.minDiscrepancyAmount
      );
    }
    
    // Limit to first 5 for preview
    return filteredResults.slice(0, 5);
  };

  const previewData = getPreviewData();
  
  const previewSummary = {
    totalRecords: previewData.length,
    validRecords: previewData.filter(r => r.severity === 'low' || r.discrepancy === 0).length,
    invalidRecords: previewData.filter(r => r.severity !== 'low' && r.discrepancy > 0).length,
    totalDiscrepancies: previewData.length,
    totalDiscrepancyAmount: previewData.reduce((sum, r) => sum + r.discrepancy, 0),
    severityBreakdown: {
      low: previewData.filter(r => r.severity === 'low').length,
      medium: previewData.filter(r => r.severity === 'medium').length,
      high: previewData.filter(r => r.severity === 'high').length,
      critical: previewData.filter(r => r.severity === 'critical').length
    }
  };

  const renderSectionPreview = (section) => {
    switch (section.type) {
      case 'summary':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-accent/30 rounded-lg">
                <div className="text-2xl font-bold text-primary">{previewSummary.totalRecords}</div>
                <div className="text-sm text-muted-foreground">Total Records</div>
              </div>
              <div className="p-3 bg-accent/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{previewSummary.validRecords}</div>
                <div className="text-sm text-muted-foreground">Valid Records</div>
              </div>
              <div className="p-3 bg-accent/30 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{previewSummary.invalidRecords}</div>
                <div className="text-sm text-muted-foreground">Invalid Records</div>
              </div>
              <div className="p-3 bg-accent/30 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  ${previewSummary.totalDiscrepancyAmount.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Total Discrepancy</div>
              </div>
            </div>
          </div>
        );
      
      case 'chart':
        return (
          <div className="space-y-4">
            <div className="p-6 bg-accent/30 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Severity Distribution</h4>
              </div>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(previewSummary.severityBreakdown).map(([severity, count]) => (
                  <div key={severity} className="text-center">
                    <div className={`w-full h-20 rounded-lg flex items-end justify-center ${getSeverityBgColor(severity)}`}>
                      <div className="text-white font-bold mb-2">{count}</div>
                    </div>
                    <div className="text-sm mt-2 capitalize">{severity}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'table':
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-accent/30">
                    <th className="border border-border p-2 text-left text-sm font-medium">Record ID</th>
                    <th className="border border-border p-2 text-left text-sm font-medium">Field</th>
                    <th className="border border-border p-2 text-left text-sm font-medium">Original</th>
                    <th className="border border-border p-2 text-left text-sm font-medium">Calculated</th>
                    <th className="border border-border p-2 text-left text-sm font-medium">Discrepancy</th>
                    <th className="border border-border p-2 text-left text-sm font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((result, index) => (
                    <tr key={index} className="hover:bg-accent/20">
                      <td className="border border-border p-2 text-sm">{result.recordId}</td>
                      <td className="border border-border p-2 text-sm">{result.field}</td>
                      <td className="border border-border p-2 text-sm">{result.originalValue}</td>
                      <td className="border border-border p-2 text-sm">{result.calculatedValue}</td>
                      <td className="border border-border p-2 text-sm">${result.discrepancy.toFixed(2)}</td>
                      <td className="border border-border p-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(result.severity)}`}>
                          {result.severity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No data matches the current filters
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-4 bg-accent/30 rounded-lg text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2" />
            <p>Preview not available for this section type</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Eye className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Report Preview</h3>
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
          {template.name}
        </span>
      </div>

      {/* Preview Notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800">
          <TrendingUp className="h-4 w-4" />
          <span className="text-sm font-medium">Preview Mode</span>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          This preview shows a sample of your report based on current filters. 
          The actual report will include all matching data.
        </p>
      </div>

      {/* Template Sections Preview */}
      <div className="space-y-6">
        {template.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <div key={section.id} className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {section.type === 'summary' && <TrendingUp className="h-4 w-4 text-primary" />}
                  {section.type === 'chart' && <BarChart3 className="h-4 w-4 text-primary" />}
                  {section.type === 'table' && <Table className="h-4 w-4 text-primary" />}
                  {section.type === 'text' && <FileText className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <h4 className="font-semibold">{section.title}</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {section.type} section
                    {section.isRequired && ' • Required'}
                  </p>
                </div>
              </div>
              
              {renderSectionPreview(section)}
            </div>
          ))}
      </div>

      {/* Preview Statistics */}
      <div className="p-4 bg-accent/30 rounded-lg">
        <h4 className="font-medium mb-2">Preview Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Preview Records:</span>
            <span className="ml-2 font-medium">{previewData.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Available:</span>
            <span className="ml-2 font-medium">{results.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Sections:</span>
            <span className="ml-2 font-medium">{template.sections.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Required Sections:</span>
            <span className="ml-2 font-medium">
              {template.sections.filter(s => s.isRequired).length}
            </span>
          </div>
        </div>
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

export default ReportPreview;