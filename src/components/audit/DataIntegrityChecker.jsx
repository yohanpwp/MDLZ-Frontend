import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Shield, CheckCircle, AlertTriangle, XCircle, 
  RefreshCw, Database, FileText, Users, Settings
} from 'lucide-react';
import Button from '../ui/Button';

/**
 * DataIntegrityChecker Component
 * 
 * Provides data integrity checking and validation functionality
 * for compliance and audit purposes.
 */
const DataIntegrityChecker = () => {
  const dispatch = useDispatch();
  
  // Local state
  const [isChecking, setIsChecking] = useState(false);
  const [integrityResults, setIntegrityResults] = useState({
    lastCheck: null,
    overallStatus: 'unknown',
    checks: []
  });

  // Data integrity check definitions
  const integrityChecks = [
    {
      id: 'user_data_consistency',
      name: 'User Data Consistency',
      description: 'Verify user accounts and permissions are consistent',
      category: 'users',
      icon: Users
    },
    {
      id: 'audit_log_integrity',
      name: 'Audit Log Integrity',
      description: 'Check audit logs for completeness and tampering',
      category: 'audit',
      icon: FileText
    },
    {
      id: 'invoice_data_integrity',
      name: 'Invoice Data Integrity',
      description: 'Validate invoice records and calculations',
      category: 'invoices',
      icon: Database
    },
    {
      id: 'system_configuration',
      name: 'System Configuration',
      description: 'Verify system settings and security configurations',
      category: 'system',
      icon: Settings
    }
  ];

  // Run data integrity checks
  const runIntegrityChecks = async () => {
    setIsChecking(true);
    
    try {
      const results = [];
      
      for (const check of integrityChecks) {
        const result = await performIntegrityCheck(check);
        results.push(result);
      }
      
      const overallStatus = results.every(r => r.status === 'passed') 
        ? 'passed' 
        : results.some(r => r.status === 'failed') 
          ? 'failed' 
          : 'warning';
      
      setIntegrityResults({
        lastCheck: new Date().toISOString(),
        overallStatus,
        checks: results
      });
      
    } catch (error) {
      console.error('Integrity check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Perform individual integrity check
  const performIntegrityCheck = async (checkDefinition) => {
    // Simulate check execution with different results
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const mockResults = {
      user_data_consistency: {
        status: 'passed',
        message: 'All user accounts and permissions are consistent',
        details: {
          totalUsers: 25,
          activeUsers: 23,
          inconsistencies: 0
        }
      },
      audit_log_integrity: {
        status: 'passed',
        message: 'Audit logs are complete and unmodified',
        details: {
          totalLogs: 1247,
          integrityHash: 'sha256:abc123...',
          missingEntries: 0
        }
      },
      invoice_data_integrity: {
        status: 'warning',
        message: '2 invoices have calculation discrepancies',
        details: {
          totalInvoices: 156,
          validInvoices: 154,
          discrepancies: 2
        }
      },
      system_configuration: {
        status: 'passed',
        message: 'System configuration is secure and valid',
        details: {
          securitySettings: 'compliant',
          backupConfiguration: 'enabled',
          encryptionStatus: 'active'
        }
      }
    };
    
    return {
      id: checkDefinition.id,
      name: checkDefinition.name,
      category: checkDefinition.category,
      timestamp: new Date().toISOString(),
      ...mockResults[checkDefinition.id]
    };
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    const displays = {
      passed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
      warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
      failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
      unknown: { icon: Shield, color: 'text-gray-600', bg: 'bg-gray-100' }
    };
    return displays[status] || displays.unknown;
  };

  // Format details for display
  const formatDetails = (details) => {
    return Object.entries(details)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}`)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Data Integrity Checker</h3>
          <p className="text-muted-foreground">
            Verify data consistency and detect potential integrity issues
          </p>
        </div>
        <Button 
          onClick={runIntegrityChecks}
          disabled={isChecking}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Run Checks'}
        </Button>
      </div>

      {/* Overall Status */}
      {integrityResults.lastCheck && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Overall Status</h4>
            <span className="text-sm text-muted-foreground">
              Last check: {new Date(integrityResults.lastCheck).toLocaleString()}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {(() => {
              const statusDisplay = getStatusDisplay(integrityResults.overallStatus);
              return (
                <>
                  <statusDisplay.icon className={`h-6 w-6 ${statusDisplay.color}`} />
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                    {integrityResults.overallStatus.toUpperCase()}
                  </span>
                  <span className="text-muted-foreground">
                    {integrityResults.checks.filter(c => c.status === 'passed').length} of {integrityResults.checks.length} checks passed
                  </span>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Individual Check Results */}
      <div className="grid gap-4">
        {integrityResults.checks.length > 0 ? (
          integrityResults.checks.map((result) => {
            const statusDisplay = getStatusDisplay(result.status);
            const checkDefinition = integrityChecks.find(c => c.id === result.id);
            
            return (
              <div key={result.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <checkDefinition.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h5 className="font-medium">{result.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        {checkDefinition.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <statusDisplay.icon className={`h-5 w-5 ${statusDisplay.color}`} />
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.bg} ${statusDisplay.color}`}>
                      {result.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm">{result.message}</p>
                  
                  {result.details && (
                    <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                      {formatDetails(result.details)}
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Checked: {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-card border border-border rounded-lg p-8 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium mb-2">No Integrity Checks Run</h4>
            <p className="text-muted-foreground mb-4">
              Click "Run Checks" to verify data integrity across the system
            </p>
            <Button 
              onClick={runIntegrityChecks}
              disabled={isChecking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              Start Integrity Check
            </Button>
          </div>
        )}
      </div>

      {/* Check Categories Summary */}
      {integrityResults.checks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {['users', 'audit', 'invoices', 'system'].map(category => {
            const categoryChecks = integrityResults.checks.filter(c => c.category === category);
            const passedChecks = categoryChecks.filter(c => c.status === 'passed').length;
            const totalChecks = categoryChecks.length;
            
            return (
              <div key={category} className="bg-card border border-border rounded-lg p-4">
                <h5 className="font-medium capitalize mb-2">{category}</h5>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {passedChecks}/{totalChecks}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DataIntegrityChecker;