import { BarChart3, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import Button from '../components/ui/Button';

const Dashboard = () => {
  // Mock data - will be replaced with Redux state later
  const stats = {
    totalInvoices: 1247,
    validatedToday: 89,
    discrepanciesFound: 12,
    successRate: 94.2
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = "primary" }) => (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {trend && (
            <p className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend > 0 ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}/10`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the Invoice Validation System
          </p>
        </div>
        <Button>
          Upload New File
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Invoices"
          value={stats.totalInvoices.toLocaleString()}
          icon={FileText}
          trend={8.2}
          color="primary"
        />
        <StatCard
          title="Validated Today"
          value={stats.validatedToday}
          icon={CheckCircle}
          trend={12.5}
          color="green-600"
        />
        <StatCard
          title="Discrepancies Found"
          value={stats.discrepanciesFound}
          icon={AlertTriangle}
          trend={-3.1}
          color="yellow-600"
        />
        <StatCard
          title="Success Rate"
          value={`${stats.successRate}%`}
          icon={BarChart3}
          trend={1.8}
          color="blue-600"
        />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Validations</h3>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">Invoice #{1000 + item}</p>
                  <p className="text-sm text-muted-foreground">Customer ABC Corp</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item % 3 === 0 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {item % 3 === 0 ? 'Discrepancy' : 'Valid'}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">2 min ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Upload Invoice File
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Discrepancies
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;