import { useState } from 'react';
import { useSelector } from 'react-redux';
import { BarChart3, Download, Calendar, FileText, Plus, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import ReportGenerator from '../../components/reports/ReportGenerator';
import ReportViewer from '../../components/reports/ReportViewer';
import { useLanguage } from '../../contexts/LanguageContext';

const Reports = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedReport, setSelectedReport] = useState(null);
  const { generated: recentReports, templates } = useSelector(state => state.reports);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('navigation.reports')}</h1>
        <p className="text-muted-foreground">
          {t('report.description')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('generate')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'generate'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('report.generate')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recent'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {t('dashboard.recentActivity')} ({recentReports.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Templates ({templates.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'generate' && (
        <ReportGenerator />
      )}

      {activeTab === 'recent' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t('dashboard.recentActivity')}</h2>
            <Button
              onClick={() => setActiveTab('generate')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {t('report.generate')}
            </Button>
          </div>

          {recentReports.length > 0 ? (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.recordCount} records • {report.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">{t('report.noData')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('report.generate')}
              </p>
              <Button onClick={() => setActiveTab('generate')}>
                {t('report.generate')}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Report Templates</h2>
            <Button
              onClick={() => setActiveTab('generate')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Use Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{template.type}</p>
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">{template.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {template.sections.length} sections • {template.sections.filter(s => s.isRequired).length} required
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => setActiveTab('generate')}
                  >
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Viewer Modal */}
      {selectedReport && (
        <ReportViewer 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
};

export default Reports;