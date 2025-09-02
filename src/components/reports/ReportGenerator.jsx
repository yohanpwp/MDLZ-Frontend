import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FileText, Settings, Play, Eye, Calendar } from 'lucide-react';
import Button from '../ui/Button';
import { generateReport, setSelectedTemplate } from '../../redux/slices/reportsSlice';
import ReportFilters from './ReportFilters';
import ReportPreview from './ReportPreview';

const ReportGenerator = () => {
  const dispatch = useDispatch();
  const { templates, selectedTemplate, isGenerating, filters } = useSelector(state => state.reports);
  const [reportName, setReportName] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleTemplateSelect = (template) => {
    dispatch(setSelectedTemplate(template));
    setReportName(`${template.name} - ${new Date().toLocaleDateString()}`);
  };

  const handleGenerateReport = async () => {
    if (!selectedTemplate || !reportName.trim()) {
      return;
    }

    try {
      await dispatch(generateReport({
        templateId: selectedTemplate.id,
        filters,
        name: reportName.trim()
      })).unwrap();
      
      // Reset form after successful generation
      setReportName('');
      dispatch(setSelectedTemplate(null));
      setShowFilters(false);
      setShowPreview(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const handlePreview = () => {
    if (!selectedTemplate) return;
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Generate Report</h2>
        <p className="text-muted-foreground">
          Select a template and configure filters to generate a custom report
        </p>
      </div>

      {/* Template Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Report Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`
                border rounded-lg p-4 cursor-pointer transition-all
                ${selectedTemplate?.id === template.id 
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20' 
                  : 'border-border hover:border-primary/50 hover:bg-accent/50'
                }
              `}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{template.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 bg-secondary rounded-full">
                      {template.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {template.sections.length} sections
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Configuration */}
      {selectedTemplate && (
        <div className="border rounded-lg p-6 bg-card">
          <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
          
          {/* Report Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Report Name</label>
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name..."
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Template Details */}
          <div className="mb-4 p-4 bg-accent/30 rounded-lg">
            <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
            <p className="text-sm text-muted-foreground mb-3">{selectedTemplate.description}</p>
            
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Report Sections:</h5>
              {selectedTemplate.sections.map((section) => (
                <div key={section.id} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${section.isRequired ? 'bg-primary' : 'bg-muted-foreground'}`} />
                  <span>{section.title}</span>
                  <span className="text-xs text-muted-foreground">({section.type})</span>
                  {section.isRequired && (
                    <span className="text-xs text-primary">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Configure Filters'}
            </Button>
            
            <Button
              onClick={handlePreview}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || !reportName.trim()}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && selectedTemplate && (
        <div className="border rounded-lg p-6 bg-card">
          <ReportFilters />
        </div>
      )}

      {/* Preview Panel */}
      {showPreview && selectedTemplate && (
        <div className="border rounded-lg p-6 bg-card">
          <ReportPreview template={selectedTemplate} />
        </div>
      )}

      {/* Quick Templates */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              const summaryTemplate = templates.find(t => t.id === 'validation-summary');
              if (summaryTemplate) {
                handleTemplateSelect(summaryTemplate);
              }
            }}
          >
            <FileText className="h-6 w-6" />
            <span className="text-sm">Quick Summary</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              const analysisTemplate = templates.find(t => t.id === 'discrepancy-analysis');
              if (analysisTemplate) {
                handleTemplateSelect(analysisTemplate);
              }
            }}
          >
            <Settings className="h-6 w-6" />
            <span className="text-sm">Discrepancy Analysis</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => {
              const auditTemplate = templates.find(t => t.id === 'audit-trail');
              if (auditTemplate) {
                handleTemplateSelect(auditTemplate);
              }
            }}
          >
            <Calendar className="h-6 w-6" />
            <span className="text-sm">Audit Trail</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;