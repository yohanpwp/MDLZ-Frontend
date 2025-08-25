import { FileText, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import Button from '../../components/ui/Button';

const Invoices = () => {
  // Mock invoice data
  const invoices = [
    { 
      id: 'INV-001', 
      customer: 'ABC Corporation', 
      amount: 1299.99, 
      date: '2024-01-15', 
      status: 'Valid',
      discrepancies: 0
    },
    { 
      id: 'INV-002', 
      customer: 'XYZ Industries', 
      amount: 2450.00, 
      date: '2024-01-14', 
      status: 'Discrepancy',
      discrepancies: 2
    },
    { 
      id: 'INV-003', 
      customer: 'Tech Solutions Ltd', 
      amount: 899.50, 
      date: '2024-01-13', 
      status: 'Valid',
      discrepancies: 0
    },
    { 
      id: 'INV-004', 
      customer: 'Global Enterprises', 
      amount: 3200.00, 
      date: '2024-01-12', 
      status: 'Pending',
      discrepancies: 0
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Discrepancy':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Valid':
        return 'bg-green-100 text-green-800';
      case 'Discrepancy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">
            View and validate invoice documents
          </p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Upload Invoices
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="outline">Filter</Button>
        <Button variant="outline">Validate All</Button>
      </div>

      {/* Invoices table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Invoice</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-border hover:bg-muted/25">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.id}</p>
                        {invoice.discrepancies > 0 && (
                          <p className="text-sm text-red-600">
                            {invoice.discrepancies} discrepancies
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{invoice.customer}</td>
                  <td className="p-4 font-medium">${invoice.amount.toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground">{invoice.date}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invoice.status)}
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="ghost" size="sm">Validate</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Invoices;