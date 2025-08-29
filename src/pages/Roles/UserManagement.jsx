import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  UserCog, Plus, Search, Shield, Edit, Trash2, Eye, Settings, 
  Activity, Monitor, AlertTriangle, CheckCircle, XCircle, 
  Filter, Download, RefreshCw, Clock, MapPin, Smartphone
} from 'lucide-react';
import Button from '../../components/ui/Button';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateUserPermissions,
  fetchUserActivity,
  fetchActiveSessions,
  terminateSession,
  testUserPermissions,
  setSelectedUser,
  clearSelectedUser,
  updateFilters,
  clearMessages,
  selectUsers,
  selectSelectedUser,
  selectUserActivity,
  selectActiveSessions,
  selectPermissionTestResults,
  selectFilters,
  selectIsLoading,
  selectError,
  selectSuccessMessage
} from '../../redux/slices/userManagementSlice.js';
import { ROLE_PERMISSIONS, PERMISSIONS } from '../../types/auth.js';
import AuditTrail from '../../components/audit/AuditTrail.jsx';

const UserManagement = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const users = useSelector(selectUsers);
  const selectedUser = useSelector(selectSelectedUser);
  const userActivity = useSelector(selectUserActivity);
  const activeSessions = useSelector(selectActiveSessions);
  const permissionTestResults = useSelector(selectPermissionTestResults);
  const filters = useSelector(selectFilters);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const successMessage = useSelector(selectSuccessMessage);

  // Local state
  const [activeTab, setActiveTab] = useState('users');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showPermissionTestModal, setShowPermissionTestModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'business_user',
    isActive: true
  });
  const [editingUser, setEditingUser] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [testPermissions, setTestPermissions] = useState([]);

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchUsers(filters));
    dispatch(fetchActiveSessions());
  }, [dispatch, filters]);

  // Handle search
  const handleSearch = (searchTerm) => {
    dispatch(updateFilters({ search: searchTerm }));
  };

  // Handle role filter
  const handleRoleFilter = (role) => {
    dispatch(updateFilters({ role }));
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    dispatch(updateFilters({ status }));
  };  
// Handle create user
  const handleCreateUser = async () => {
    try {
      await dispatch(createUser(newUser)).unwrap();
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        role: 'business_user',
        isActive: true
      });
      dispatch(fetchUsers(filters));
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  // Handle edit user
  const handleEditUser = async () => {
    try {
      await dispatch(updateUser({ 
        userId: editingUser.id, 
        userData: editingUser 
      })).unwrap();
      setShowEditModal(false);
      setEditingUser(null);
      dispatch(fetchUsers(filters));
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dispatch(deleteUser(userId)).unwrap();
        dispatch(fetchUsers(filters));
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  // Handle role update
  const handleRoleUpdate = async (userId, role) => {
    try {
      await dispatch(updateUserRole({ userId, role })).unwrap();
      dispatch(fetchUsers(filters));
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  // Handle permissions update
  const handlePermissionsUpdate = async () => {
    try {
      await dispatch(updateUserPermissions({ 
        userId: selectedUser.id, 
        permissions: selectedPermissions 
      })).unwrap();
      setShowPermissionsModal(false);
      dispatch(fetchUsers(filters));
    } catch (error) {
      console.error('Failed to update permissions:', error);
    }
  };

  // Handle view user activity
  const handleViewActivity = (user) => {
    dispatch(setSelectedUser(user));
    dispatch(fetchUserActivity({ userId: user.id }));
    setShowActivityModal(true);
  };

  // Handle terminate session
  const handleTerminateSession = async (sessionId) => {
    if (window.confirm('Are you sure you want to terminate this session?')) {
      try {
        await dispatch(terminateSession(sessionId)).unwrap();
        dispatch(fetchActiveSessions());
      } catch (error) {
        console.error('Failed to terminate session:', error);
      }
    }
  };

  // Handle permission test
  const handlePermissionTest = async () => {
    try {
      await dispatch(testUserPermissions({ 
        userId: selectedUser.id, 
        permissions: testPermissions 
      })).unwrap();
    } catch (error) {
      console.error('Failed to test permissions:', error);
    }
  };

  // Get role color
  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      financial_administrator: 'bg-blue-100 text-blue-800',
      financial_auditor: 'bg-purple-100 text-purple-800',
      finance_manager: 'bg-green-100 text-green-800',
      system_administrator: 'bg-orange-100 text-orange-800',
      business_user: 'bg-gray-100 text-gray-800',
      compliance_officer: 'bg-indigo-100 text-indigo-800',
      financial_analyst: 'bg-teal-100 text-teal-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  // Get status color
  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Get role statistics
  const getRoleStats = () => {
    const roleStats = {};
    users.forEach(user => {
      roleStats[user.role] = (roleStats[user.role] || 0) + 1;
    });
    
    return Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => ({
      name: role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      role,
      users: roleStats[role] || 0,
      permissions: permissions.length
    }));
  };  
  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {(successMessage || error) && (
        <div className={`p-4 rounded-lg ${
          successMessage ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <span>{successMessage || error}</span>
            <button 
              onClick={() => dispatch(clearMessages())}
              className="text-sm underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, permissions, and security
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowSessionsModal(true)}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Active Sessions
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-8">
          {[
            { id: 'users', label: 'Users', icon: UserCog },
            { id: 'roles', label: 'Roles & Permissions', icon: Shield },
            { id: 'activity', label: 'Activity Logs', icon: Activity },
            { id: 'audit', label: 'Audit Trail', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>    
  {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <select
              value={filters.role}
              onChange={(e) => handleRoleFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Roles</option>
              {Object.keys(ROLE_PERMISSIONS).map(role => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <Button 
              variant="outline"
              onClick={() => dispatch(fetchUsers(filters))}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Users Table */}
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
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.isActive)}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground text-sm">
                        {formatDate(user.lastLoginAt)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setEditingUser({ ...user });
                              setShowEditModal(true);
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              dispatch(setSelectedUser(user));
                              setSelectedPermissions(user.permissions || []);
                              setShowPermissionsModal(true);
                            }}
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Permissions
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewActivity(user)}
                          >
                            <Activity className="h-3 w-3 mr-1" />
                            Activity
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}      
{/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getRoleStats().map((role) => (
              <div key={role.role} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">{role.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {role.permissions} permissions
                </p>
                <p className="text-sm font-medium">{role.users} users</p>
              </div>
            ))}
          </div>

          {/* Permission Matrix */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Permission Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Permission</th>
                    {Object.keys(ROLE_PERMISSIONS).map(role => (
                      <th key={role} className="text-center p-2 font-medium min-w-[100px]">
                        {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.values(PERMISSIONS).map(permission => (
                    <tr key={permission.type} className="border-b">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-xs text-muted-foreground">{permission.description}</div>
                        </div>
                      </td>
                      {Object.entries(ROLE_PERMISSIONS).map(([role, rolePermissions]) => (
                        <td key={role} className="text-center p-2">
                          {rolePermissions.includes(permission.type) ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-300 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">System Activity</h3>
            <Button 
              variant="outline"
              onClick={() => dispatch(fetchUserActivity())}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Action</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Details</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {userActivity.map((activity) => (
                    <tr key={activity.id} className="border-t border-border hover:bg-muted/25">
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </td>
                      <td className="p-4">
                        <div className="font-medium">{activity.userId}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {activity.action}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{activity.details}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {activity.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail Tab */}
      {activeTab === 'audit' && (
        <AuditTrail />
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.keys(ROLE_PERMISSIONS).map(role => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newUser.isActive}
                  onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>
                Create User
              </Button>
            </div>
          </div>
        </div>
      )}  
    {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {Object.keys(ROLE_PERMISSIONS).map(role => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingUser.isActive}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="editIsActive" className="text-sm font-medium">Active</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleEditUser}>
                Update User
              </Button>
            </div>
          </div>
        </div>
      )}      {/*
 Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Manage Permissions - {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => {
                  setTestPermissions([]);
                  setShowPermissionTestModal(true);
                }}
              >
                Test Permissions
              </Button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Role: <span className="font-medium">{selectedUser.role}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Role permissions are automatically included
              </p>
            </div>

            <div className="space-y-3">
              {Object.values(PERMISSIONS).map(permission => {
                const hasRolePermission = ROLE_PERMISSIONS[selectedUser.role]?.includes(permission.type);
                const hasIndividualPermission = selectedPermissions.includes(permission.type);
                
                return (
                  <div key={permission.type} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{permission.name}</h4>
                        {hasRolePermission && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Role
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{permission.description}</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hasRolePermission || hasIndividualPermission}
                        disabled={hasRolePermission}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPermissions([...selectedPermissions, permission.type]);
                          } else {
                            setSelectedPermissions(selectedPermissions.filter(p => p !== permission.type));
                          }
                        }}
                        className="ml-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowPermissionsModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePermissionsUpdate}>
                Update Permissions
              </Button>
            </div>
          </div>
        </div>
      )} 
     {/* Permission Test Modal */}
      {showPermissionTestModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold mb-4">
              Test Permissions - {selectedUser.firstName} {selectedUser.lastName}
            </h3>
            
            <div className="space-y-3 mb-4">
              <p className="text-sm text-muted-foreground">
                Select permissions to test:
              </p>
              {Object.values(PERMISSIONS).map(permission => (
                <div key={permission.type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`test-${permission.type}`}
                    checked={testPermissions.includes(permission.type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTestPermissions([...testPermissions, permission.type]);
                      } else {
                        setTestPermissions(testPermissions.filter(p => p !== permission.type));
                      }
                    }}
                    className="mr-2"
                  />
                  <label htmlFor={`test-${permission.type}`} className="text-sm">
                    {permission.name}
                  </label>
                </div>
              ))}
            </div>

            {permissionTestResults && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Test Results:</h4>
                <div className="space-y-1">
                  {permissionTestResults.testResults.map(result => (
                    <div key={result.permission} className="flex items-center justify-between text-sm">
                      <span>{PERMISSIONS[result.permission]?.name}</span>
                      <div className="flex items-center gap-2">
                        {result.hasPermission ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          ({result.source})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowPermissionTestModal(false)}
              >
                Close
              </Button>
              <Button 
                onClick={handlePermissionTest}
                disabled={testPermissions.length === 0}
              >
                Test Permissions
              </Button>
            </div>
          </div>
        </div>
      )} 
     {/* Activity Modal */}
      {showActivityModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              User Activity - {selectedUser.firstName} {selectedUser.lastName}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">Timestamp</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Details</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {userActivity.map((activity) => (
                    <tr key={activity.id} className="border-t border-border">
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {activity.action}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{activity.details}</td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {activity.ipAddress}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowActivityModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Sessions Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Active User Sessions</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Start Time</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Last Activity</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Location</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Device</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.map((session) => (
                    <tr key={session.id} className="border-t border-border">
                      <td className="p-3">
                        <div className="font-medium">{session.username}</div>
                        <div className="text-sm text-muted-foreground">{session.ipAddress}</div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(session.startTime)}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDate(session.lastActivity)}
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          {session.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Terminate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowSessionsModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;