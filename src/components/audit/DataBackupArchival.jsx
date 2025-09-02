import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  HardDrive, Download, Upload, Archive, 
  Calendar, Clock, CheckCircle, AlertTriangle, 
  Database, FileText, Settings, RefreshCw
} from 'lucide-react';
import Button from '../ui/Button';

/**
 * DataBackupArchival Component
 * 
 * Manages data backup and archival operations for compliance
 * and data retention requirements.
 */
const DataBackupArchival = () => {
  const dispatch = useDispatch();
  
  // Local state
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backups, setBackups] = useState([]);
  const [archivalSettings, setArchivalSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    retentionPeriod: 90,
    compressionEnabled: true,
    encryptionEnabled: true
  });
  const [selectedDataTypes, setSelectedDataTypes] = useState({
    auditLogs: true,
    userData: true,
    invoiceData: true,
    systemConfig: true,
    reports: false
  });

  // Data type definitions
  const dataTypes = [
    {
      id: 'auditLogs',
      name: 'Audit Logs',
      description: 'System audit trails and compliance logs',
      icon: FileText,
      size: '45.2 MB',
      lastBackup: '2024-01-15T10:30:00Z'
    },
    {
      id: 'userData',
      name: 'User Data',
      description: 'User accounts, roles, and permissions',
      icon: Database,
      size: '12.8 MB',
      lastBackup: '2024-01-15T10:30:00Z'
    },
    {
      id: 'invoiceData',
      name: 'Invoice Data',
      description: 'Invoice records and validation results',
      icon: FileText,
      size: '156.7 MB',
      lastBackup: '2024-01-15T10:30:00Z'
    },
    {
      id: 'systemConfig',
      name: 'System Configuration',
      description: 'Application settings and configurations',
      icon: Settings,
      size: '2.1 MB',
      lastBackup: '2024-01-15T10:30:00Z'
    },
    {
      id: 'reports',
      name: 'Generated Reports',
      description: 'Compliance and audit reports',
      icon: Archive,
      size: '89.4 MB',
      lastBackup: '2024-01-14T15:45:00Z'
    }
  ];

  // Load existing backups on component mount
  useEffect(() => {
    loadBackups();
  }, []);

  // Load backup history
  const loadBackups = () => {
    // Mock backup data
    const mockBackups = [
      {
        id: 'backup_001',
        name: 'Full System Backup',
        createdAt: '2024-01-15T10:30:00Z',
        size: '234.5 MB',
        type: 'full',
        status: 'completed',
        dataTypes: ['auditLogs', 'userData', 'invoiceData', 'systemConfig'],
        encrypted: true,
        compressed: true
      },
      {
        id: 'backup_002',
        name: 'Audit Logs Backup',
        createdAt: '2024-01-14T15:45:00Z',
        size: '45.2 MB',
        type: 'incremental',
        status: 'completed',
        dataTypes: ['auditLogs'],
        encrypted: true,
        compressed: true
      },
      {
        id: 'backup_003',
        name: 'Weekly Archive',
        createdAt: '2024-01-08T02:00:00Z',
        size: '512.8 MB',
        type: 'archive',
        status: 'completed',
        dataTypes: ['auditLogs', 'userData', 'invoiceData', 'systemConfig', 'reports'],
        encrypted: true,
        compressed: true
      }
    ];
    
    setBackups(mockBackups);
  };

  // Create new backup
  const createBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      // Simulate backup creation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const selectedTypes = Object.entries(selectedDataTypes)
        .filter(([_, selected]) => selected)
        .map(([type, _]) => type);
      
      const totalSize = selectedTypes.reduce((sum, type) => {
        const dataType = dataTypes.find(dt => dt.id === type);
        return sum + parseFloat(dataType?.size || '0');
      }, 0);
      
      const newBackup = {
        id: `backup_${Date.now()}`,
        name: `Manual Backup - ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        size: `${totalSize.toFixed(1)} MB`,
        type: 'manual',
        status: 'completed',
        dataTypes: selectedTypes,
        encrypted: archivalSettings.encryptionEnabled,
        compressed: archivalSettings.compressionEnabled
      };
      
      setBackups(prev => [newBackup, ...prev]);
      
    } catch (error) {
      console.error('Backup creation failed:', error);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Download backup
  const downloadBackup = async (backup) => {
    try {
      // Simulate backup download
      const backupData = {
        id: backup.id,
        name: backup.name,
        createdAt: backup.createdAt,
        dataTypes: backup.dataTypes,
        metadata: {
          version: '1.0',
          encrypted: backup.encrypted,
          compressed: backup.compressed
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${backup.name.replace(/\s+/g, '_')}_${backup.id}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Backup download failed:', error);
    }
  };

  // Restore from backup
  const restoreFromBackup = async (backup) => {
    if (!confirm(`Are you sure you want to restore from "${backup.name}"? This will overwrite current data.`)) {
      return;
    }
    
    setIsRestoring(true);
    
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      alert('Restore completed successfully');
      
    } catch (error) {
      console.error('Restore failed:', error);
      alert('Restore failed. Please try again.');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle data type selection
  const handleDataTypeChange = (dataType, selected) => {
    setSelectedDataTypes(prev => ({
      ...prev,
      [dataType]: selected
    }));
  };

  // Handle settings change
  const handleSettingsChange = (setting, value) => {
    setArchivalSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const displays = {
      completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      in_progress: { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
      failed: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' }
    };
    return displays[status] || displays.completed;
  };

  // Format file size
  const formatSize = (sizeStr) => {
    return sizeStr;
  };

  // Format date
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-foreground">Data Backup & Archival</h3>
        <p className="text-muted-foreground">
          Manage data backups and archival for compliance and disaster recovery
        </p>
      </div>

      {/* Backup Creation */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Create New Backup</h4>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Type Selection */}
          <div>
            <h5 className="font-medium mb-3">Select Data Types</h5>
            <div className="space-y-3">
              {dataTypes.map(dataType => {
                const Icon = dataType.icon;
                return (
                  <label key={dataType.id} className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/25 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDataTypes[dataType.id]}
                      onChange={(e) => handleDataTypeChange(dataType.id, e.target.checked)}
                      className="mt-1"
                    />
                    <Icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{dataType.name}</div>
                      <div className="text-sm text-muted-foreground">{dataType.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Size: {dataType.size} • Last backup: {formatDate(dataType.lastBackup)}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          
          {/* Backup Settings */}
          <div>
            <h5 className="font-medium mb-3">Backup Settings</h5>
            <div className="space-y-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={archivalSettings.encryptionEnabled}
                  onChange={(e) => handleSettingsChange('encryptionEnabled', e.target.checked)}
                />
                <span>Enable encryption</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={archivalSettings.compressionEnabled}
                  onChange={(e) => handleSettingsChange('compressionEnabled', e.target.checked)}
                />
                <span>Enable compression</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium mb-1">Backup Type</label>
                <select className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
                  <option value="full">Full Backup</option>
                  <option value="incremental">Incremental Backup</option>
                </select>
              </div>
              
              <Button 
                onClick={createBackup}
                disabled={isCreatingBackup || Object.values(selectedDataTypes).every(v => !v)}
                className="w-full"
              >
                <HardDrive className={`h-4 w-4 mr-2 ${isCreatingBackup ? 'animate-pulse' : ''}`} />
                {isCreatingBackup ? 'Creating Backup...' : 'Create Backup'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Archival Settings */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h4 className="font-semibold mb-4">Archival Settings</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Auto Backup</label>
            <select
              value={archivalSettings.autoBackup ? 'enabled' : 'disabled'}
              onChange={(e) => handleSettingsChange('autoBackup', e.target.value === 'enabled')}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Frequency</label>
            <select
              value={archivalSettings.backupFrequency}
              onChange={(e) => handleSettingsChange('backupFrequency', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Retention (days)</label>
            <input
              type="number"
              value={archivalSettings.retentionPeriod}
              onChange={(e) => handleSettingsChange('retentionPeriod', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              min="1"
              max="365"
            />
          </div>
          
          <div className="flex items-end">
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Backup History</h4>
          <Button variant="outline" onClick={loadBackups}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        {backups.length > 0 ? (
          <div className="space-y-3">
            {backups.map(backup => {
              const statusDisplay = getStatusDisplay(backup.status);
              
              return (
                <div key={backup.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <HardDrive className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h5 className="font-medium">{backup.name}</h5>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(backup.createdAt)} • {formatSize(backup.size)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <statusDisplay.icon className={`h-4 w-4 ${statusDisplay.color}`} />
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                        {backup.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {backup.dataTypes.map(type => (
                        <span key={type} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          {dataTypes.find(dt => dt.id === type)?.name || type}
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadBackup(backup)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreFromBackup(backup)}
                        disabled={isRestoring}
                      >
                        <Upload className={`h-4 w-4 mr-1 ${isRestoring ? 'animate-spin' : ''}`} />
                        Restore
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Type: {backup.type} • 
                    {backup.encrypted && ' Encrypted •'}
                    {backup.compressed && ' Compressed'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h5 className="font-medium mb-2">No Backups Found</h5>
            <p className="text-muted-foreground">
              Create your first backup using the form above
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataBackupArchival;