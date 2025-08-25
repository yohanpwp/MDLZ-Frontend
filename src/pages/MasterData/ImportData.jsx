import { Upload, FileText, Database } from 'lucide-react';
import Button from '../../components/ui/Button';

const ImportData = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Import Data</h1>
        <p className="text-muted-foreground">
          Import master data including customers, products, and reference information
        </p>
      </div>

      {/* Import options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Customer Data</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Import customer information, contact details, and billing preferences
          </p>
          <Button variant="outline" className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Import Customers
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Product Catalog</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Import product information, pricing, and validation rules
          </p>
          <Button variant="outline" className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Import Products
          </Button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Reference Data</h3>
          </div>
          <p className="text-muted-foreground mb-4">
            Import tax rates, currencies, and other reference information
          </p>
          <Button variant="outline" className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            Import References
          </Button>
        </div>
      </div>

      {/* Recent imports */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Imports</h3>
        <div className="space-y-3">
          {[
            { type: 'Customers', file: 'customers_2024.csv', status: 'Completed', records: 1247 },
            { type: 'Products', file: 'products_catalog.csv', status: 'Processing', records: 856 },
            { type: 'Tax Rates', file: 'tax_rates.csv', status: 'Failed', records: 0 }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="font-medium">{item.type}</p>
                <p className="text-sm text-muted-foreground">{item.file}</p>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  item.status === 'Completed' 
                    ? 'bg-green-100 text-green-800'
                    : item.status === 'Processing'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.status}
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {item.records > 0 ? `${item.records} records` : 'No records'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImportData;