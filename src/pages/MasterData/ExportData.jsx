import { Download, FileText, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';

const ExportData = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Export Data</h1>
        <p className="text-muted-foreground">
          Export master data and validation results for backup or analysis
        </p>
      </div>

      {/* Export options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Master Data Export</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <span>Customer Database</span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <span>Product Catalog</span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <span>Validation Rules</span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Validation Results</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <span>All Validation Results</span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <span>Discrepancy Reports</span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 border border-border rounded-md">
              <span>Audit Trail</span>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Export history */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Export History</h3>
        <div className="space-y-3">
          {[
            { type: 'Customer Database', date: '2024-01-15', size: '2.4 MB', format: 'CSV' },
            { type: 'Validation Results', date: '2024-01-14', size: '1.8 MB', format: 'Excel' },
            { type: 'Product Catalog', date: '2024-01-13', size: '956 KB', format: 'CSV' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{item.type}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.size} • {item.format}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {item.date}
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
  );
};

export default ExportData;