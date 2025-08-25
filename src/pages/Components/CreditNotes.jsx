import { CreditCard, Search, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';

const CreditNotes = () => {
  // Mock credit note data
  const creditNotes = [
    { 
      id: 'CN-001', 
      customer: 'ABC Corporation', 
      amount: 299.99, 
      date: '2024-01-15', 
      reason: 'Product Return',
      status: 'Processed'
    },
    { 
      id: 'CN-002', 
      customer: 'XYZ Industries', 
      amount: 150.00, 
      date: '2024-01-14', 
      reason: 'Billing Error',
      status: 'Pending'
    },
    { 
      id: 'CN-003', 
      customer: 'Tech Solutions Ltd', 
      amount: 89.50, 
      date: '2024-01-13', 
      reason: 'Discount Adjustment',
      status: 'Processed'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Processed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Credit Notes</h1>
          <p className="text-muted-foreground">
            Manage credit notes and refund processing
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Credit Note
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search credit notes..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="outline">Filter</Button>
      </div>

      {/* Credit notes table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-medium text-muted-foreground">Credit Note</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Reason</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {creditNotes.map((note) => (
                <tr key={note.id} className="border-t border-border hover:bg-muted/25">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <p className="font-medium">{note.id}</p>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{note.customer}</td>
                  <td className="p-4 font-medium">${note.amount.toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground">{note.date}</td>
                  <td className="p-4 text-muted-foreground">{note.reason}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(note.status)}`}>
                      {note.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">View</Button>
                      <Button variant="ghost" size="sm">Edit</Button>
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

export default CreditNotes;