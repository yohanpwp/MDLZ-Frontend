import React, { useState } from 'react';
import { 
  Shield, FileText, Database, Archive, 
  BarChart3, Settings, AlertTriangle
} from 'lucide-react';
import AuditTrail from '../components/audit/AuditTrail';
import DataIntegrityChecker from '../components/audit/DataIntegrityChecker';
import ComplianceReporting from '../components/audit/ComplianceReporting';
import DataBackupArchival from '../components/audit/DataBackupArchival';

/**
 * AuditCompliance Page
 * 
 * Main page for audit trail and compliance features including:
 * - Audit trail display and filtering
 * - Data integrity checking
 * - Compliance reporting
 * - Data backup and archival
 */
const AuditCompliance = () => {
  const [activeTab, setActiveTab] = useState('audit-trail');

  // Tab definitions
  const tabs = [
    {
      id: 'audit-trail',
      name: 'Audit Trail',
      icon: FileText,
      description: 'View and filter system audit logs'
    },
    {
      id: 'data-integrity',
      name: 'Data Integrity',
      icon: Shield,
      description: 'Check data consistency and integrity'
    },
    {
      id: 'compliance-reports',
      name: 'Compliance Reports',
      icon: BarChart3,
      description: 'Generate compliance and audit reports'
    },
    {
      id: 'backup-archival',
      name: 'Backup & Archival',
      icon: Archive,
      description: 'Manage data backups and archival'
    }
  ];

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'audit-trail':
        return <AuditTrail />;
      case 'data-integrity':
        return <DataIntegrityChecker />;
      case 'compliance-reports':
        return <ComplianceReporting />;
      case 'backup-archival':
        return <DataBackupArchival />;
      default:
        return <AuditTrail />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Audit & Compliance</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Comprehensive audit trail management and compliance monitoring for the Invoice Validation System
          </p>
        </div>

        {/* Compliance Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Compliance Score</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">94%</p>
            <p className="text-sm text-muted-foreground">Overall compliance rating</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Audit Events</h3>
            </div>
            <p className="text-2xl font-bold">1,247</p>
            <p className="text-sm text-muted-foreground">Total logged events</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-semibold">Alerts</h3>
            </div>
            <p className="text-2xl font-bold">3</p>
            <p className="text-sm text-muted-foreground">Pending review</p>
          </div>
          
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold">Last Backup</h3>
            </div>
            <p className="text-2xl font-bold">2h</p>
            <p className="text-sm text-muted-foreground">ago</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-card border border-border rounded-lg mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* Tab Description */}
          <div className="px-6 py-3 bg-muted/25">
            <p className="text-sm text-muted-foreground">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border rounded-lg p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AuditCompliance;