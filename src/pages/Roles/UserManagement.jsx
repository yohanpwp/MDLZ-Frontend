import { UserCog, Plus, Search, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';

const UserManagement = () => {
  // Mock user data
  const users = [
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john.doe@company.com', 
      role: 'Administrator', 
      status: 'Active',
      lastLogin: '2024-01-15 10:30'
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      email: 'jane.smith@company.com', 
      role: 'Financial Auditor', 
      status: 'Active',
      lastLogin: '2024-01-15 09:15'
    },
    { 
      id: 3, 
      name: 'Mike Johnson', 
      email: 'mike.johnson@company.com', 
      role: 'Finance Manager', 
      status: 'Inactive',
      lastLogin: '2024-01-10 14:22'
    }
  ];

  const roles = [
    { name: 'Administrator', users: 2, permissions: 'Full Access' },
    { name: 'Financial Auditor', users: 5, permissions: 'Validation & Reports' },
    { name: 'Finance Manager', users: 3, permissions: 'Reports & Analytics' },
    { name: 'Data Entry', users: 8, permissions: 'File Upload Only' }
  ];

  const getRoleColor = (role) => {
    switch (role) {
      case 'Administrator':
        return 'bg-red-100 text-red-800';
      case 'Financial Auditor':
        return 'bg-blue-100 text-blue-800';
      case 'Finance Manager':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Roles overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Roles & Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.map((role, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">{role.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{role.permissions}</p>
              <p className="text-sm font-medium">{role.users} users</p>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Users</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Button variant="outline">Filter</Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Last Login</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-border hover:bg-muted/25">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <UserCog className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">{user.lastLogin}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">Edit</Button>
                        <Button variant="ghost" size="sm">Permissions</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;