import { BarChart3, Download, Calendar, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';

const Reports = () => {
  // Mock report data
  const reportTemplates = [
    {
      name: 'Validation Summary Report',
      description: 'Overview of all validation activities and results',
      lastGenerated: '2024-01-15',
      type: 'Summary'
    },
    {
      name: 'Discrepancy Analysis',
      description: 'Detailed analysis of found discrepancies and patterns',
      lastGenerated: '2024-01-14',
      type: 'Analysis'
    },
    {
      name: 'Customer Validation Report',
      description: 'Customer-specific validation results and statistics',
      lastGenerated: '2024-01-13',
      type: 'Customer'
    },
    {
      name: 'Audit Trail Report',
      description: 'Complete audit trail of system activities',
      lastGenerated: '2024-01-12',
      type: 'Audit'
    }
  ];

  const recentReports = [
    { name: 'Monthly Validation Summary', date: '2024-01-15', size: '2.4 MB', format: 'PDF' },
    { name: 'Discrepancy Analysis Q1', date: '2024-01-14', size: '1.8 MB', format: 'Excel' },
    { name: 'Customer Report - ABC Corp', date: '2024-01-13', size: '956 KB', format: 'PDF' }
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground">
          Generate and manage validation reports and analytics
        </p>
      </div>

      {/* Report templates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Report Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTemplates.map((template, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{template.name}</h3>
                    <p className="text-sm text-muted-foreground">{template.type}</p>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">{template.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Last: {template.lastGenerated}
                </div>
                <Button size="sm">
                  Generate Report
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent reports */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Reports</h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="space-y-3">
            {recentReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.size} • {report.format}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {report.date}
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2">
            <BarChart3 className="h-6 w-6" />
            Custom Report
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Download className="h-6 w-6" />
            Export Data
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2">
            <Calendar className="h-6 w-6" />
            Schedule Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Reports;