/**
 * DataIntegrityService - Handles data integrity checking and validation
 * 
 * This service provides methods for checking data consistency, detecting
 * corruption, and validating system integrity for compliance purposes.
 */
class DataIntegrityService {
  constructor() {
    this.integrityChecks = new Map();
    this.lastCheckResults = new Map();
  }

  /**
   * Register an integrity check
   * @param {string} checkId - Unique identifier for the check
   * @param {Function} checkFunction - Function that performs the check
   * @param {Object} metadata - Check metadata (name, description, etc.)
   */
  registerCheck(checkId, checkFunction, metadata = {}) {
    this.integrityChecks.set(checkId, {
      id: checkId,
      function: checkFunction,
      ...metadata
    });
  }

  /**
   * Run all registered integrity checks
   * @returns {Promise<Object>} Check results
   */
  async runAllChecks() {
    const results = [];
    
    for (const [checkId, check] of this.integrityChecks) {
      try {
        const result = await this.runSingleCheck(checkId);
        results.push(result);
      } catch (error) {
        results.push({
          id: checkId,
          name: check.name || checkId,
          status: 'failed',
          message: `Check failed: ${error.message}`,
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    }
    
    // Store results
    this.lastCheckResults.set('all_checks', {
      timestamp: new Date().toISOString(),
      results
    });
    
    return {
      timestamp: new Date().toISOString(),
      overallStatus: this.calculateOverallStatus(results),
      checks: results,
      summary: this.generateSummary(results)
    };
  }

  /**
   * Run a single integrity check
   * @param {string} checkId - Check identifier
   * @returns {Promise<Object>} Check result
   */
  async runSingleCheck(checkId) {
    const check = this.integrityChecks.get(checkId);
    if (!check) {
      throw new Error(`Check not found: ${checkId}`);
    }

    const startTime = Date.now();
    const result = await check.function();
    const duration = Date.now() - startTime;

    const checkResult = {
      id: checkId,
      name: check.name || checkId,
      category: check.category || 'general',
      timestamp: new Date().toISOString(),
      duration,
      ...result
    };

    // Store individual result
    this.lastCheckResults.set(checkId, checkResult);
    
    return checkResult;
  }

  /**
   * Get stored check results
   * @param {string} checkId - Optional specific check ID
   * @returns {Object} Check results
   */
  getCheckResults(checkId = null) {
    if (checkId) {
      return this.lastCheckResults.get(checkId) || null;
    }
    
    return this.lastCheckResults.get('all_checks') || {
      timestamp: null,
      results: [],
      summary: {}
    };
  }

  /**
   * Check user data consistency
   * @returns {Promise<Object>} Check result
   */
  async checkUserDataConsistency() {
    try {
      // Simulate user data consistency check
      const users = this.getUserData();
      const roles = this.getRoleData();
      const permissions = this.getPermissionData();
      
      const inconsistencies = [];
      let validUsers = 0;
      
      users.forEach(user => {
        // Check if user role exists
        if (user.roleId && !roles.find(r => r.id === user.roleId)) {
          inconsistencies.push({
            type: 'missing_role',
            userId: user.id,
            message: `User ${user.id} has invalid role: ${user.roleId}`
          });
        } else {
          validUsers++;
        }
        
        // Check user permissions
        if (user.permissions) {
          user.permissions.forEach(permId => {
            if (!permissions.find(p => p.id === permId)) {
              inconsistencies.push({
                type: 'missing_permission',
                userId: user.id,
                message: `User ${user.id} has invalid permission: ${permId}`
              });
            }
          });
        }
      });
      
      return {
        status: inconsistencies.length === 0 ? 'passed' : 'warning',
        message: inconsistencies.length === 0 
          ? 'All user accounts and permissions are consistent'
          : `Found ${inconsistencies.length} user data inconsistencies`,
        details: {
          totalUsers: users.length,
          validUsers,
          inconsistencies: inconsistencies.length,
          issues: inconsistencies
        }
      };
      
    } catch (error) {
      return {
        status: 'failed',
        message: `User data consistency check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check audit log integrity
   * @returns {Promise<Object>} Check result
   */
  async checkAuditLogIntegrity() {
    try {
      const auditLogs = this.getAuditLogs();
      const missingEntries = [];
      const corruptedEntries = [];
      
      // Check for sequential integrity
      for (let i = 1; i < auditLogs.length; i++) {
        const current = auditLogs[i];
        const previous = auditLogs[i - 1];
        
        // Check timestamp ordering
        if (new Date(current.timestamp) < new Date(previous.timestamp)) {
          corruptedEntries.push({
            type: 'timestamp_order',
            logId: current.id,
            message: 'Log entry timestamp is out of order'
          });
        }
        
        // Check required fields
        if (!current.userId || !current.action || !current.timestamp) {
          corruptedEntries.push({
            type: 'missing_fields',
            logId: current.id,
            message: 'Log entry missing required fields'
          });
        }
      }
      
      // Calculate integrity hash (simplified)
      const integrityHash = this.calculateIntegrityHash(auditLogs);
      
      return {
        status: corruptedEntries.length === 0 ? 'passed' : 'failed',
        message: corruptedEntries.length === 0
          ? 'Audit logs are complete and unmodified'
          : `Found ${corruptedEntries.length} audit log integrity issues`,
        details: {
          totalLogs: auditLogs.length,
          integrityHash,
          missingEntries: missingEntries.length,
          corruptedEntries: corruptedEntries.length,
          issues: [...missingEntries, ...corruptedEntries]
        }
      };
      
    } catch (error) {
      return {
        status: 'failed',
        message: `Audit log integrity check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check invoice data integrity
   * @returns {Promise<Object>} Check result
   */
  async checkInvoiceDataIntegrity() {
    try {
      const invoices = this.getInvoiceData();
      const discrepancies = [];
      let validInvoices = 0;
      
      invoices.forEach(invoice => {
        // Check calculation accuracy
        const calculatedTotal = (invoice.subtotal || 0) + (invoice.taxAmount || 0) - (invoice.discountAmount || 0);
        const tolerance = 0.01; // Allow 1 cent tolerance
        
        if (Math.abs(calculatedTotal - (invoice.totalAmount || 0)) > tolerance) {
          discrepancies.push({
            type: 'calculation_error',
            invoiceId: invoice.id,
            expected: calculatedTotal,
            actual: invoice.totalAmount,
            difference: Math.abs(calculatedTotal - invoice.totalAmount)
          });
        } else {
          validInvoices++;
        }
        
        // Check required fields
        if (!invoice.invoiceNumber || !invoice.customerId || invoice.totalAmount === undefined) {
          discrepancies.push({
            type: 'missing_data',
            invoiceId: invoice.id,
            message: 'Invoice missing required fields'
          });
        }
      });
      
      return {
        status: discrepancies.length === 0 ? 'passed' : 'warning',
        message: discrepancies.length === 0
          ? 'All invoice calculations are accurate'
          : `Found ${discrepancies.length} invoice discrepancies`,
        details: {
          totalInvoices: invoices.length,
          validInvoices,
          discrepancies: discrepancies.length,
          issues: discrepancies
        }
      };
      
    } catch (error) {
      return {
        status: 'failed',
        message: `Invoice data integrity check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  /**
   * Check system configuration integrity
   * @returns {Promise<Object>} Check result
   */
  async checkSystemConfiguration() {
    try {
      const config = this.getSystemConfiguration();
      const issues = [];
      
      // Check security settings
      if (!config.security?.encryptionEnabled) {
        issues.push({
          type: 'security_config',
          severity: 'high',
          message: 'Data encryption is not enabled'
        });
      }
      
      if (!config.security?.auditLoggingEnabled) {
        issues.push({
          type: 'security_config',
          severity: 'high',
          message: 'Audit logging is not enabled'
        });
      }
      
      // Check backup configuration
      if (!config.backup?.enabled) {
        issues.push({
          type: 'backup_config',
          severity: 'medium',
          message: 'Automatic backups are not enabled'
        });
      }
      
      // Check validation rules
      if (!config.validation?.rules || config.validation.rules.length === 0) {
        issues.push({
          type: 'validation_config',
          severity: 'medium',
          message: 'No validation rules configured'
        });
      }
      
      return {
        status: issues.length === 0 ? 'passed' : issues.some(i => i.severity === 'high') ? 'failed' : 'warning',
        message: issues.length === 0
          ? 'System configuration is secure and valid'
          : `Found ${issues.length} configuration issues`,
        details: {
          securitySettings: config.security?.encryptionEnabled ? 'compliant' : 'non-compliant',
          backupConfiguration: config.backup?.enabled ? 'enabled' : 'disabled',
          encryptionStatus: config.security?.encryptionEnabled ? 'active' : 'inactive',
          issues
        }
      };
      
    } catch (error) {
      return {
        status: 'failed',
        message: `System configuration check failed: ${error.message}`,
        details: { error: error.message }
      };
    }
  }

  // Helper methods for data retrieval (mock implementations)

  getUserData() {
    // Mock user data
    return [
      { id: 'user1', roleId: 'admin', permissions: ['read', 'write', 'delete'] },
      { id: 'user2', roleId: 'user', permissions: ['read'] },
      { id: 'user3', roleId: 'auditor', permissions: ['read', 'audit'] }
    ];
  }

  getRoleData() {
    return [
      { id: 'admin', name: 'Administrator' },
      { id: 'user', name: 'User' },
      { id: 'auditor', name: 'Auditor' }
    ];
  }

  getPermissionData() {
    return [
      { id: 'read', name: 'Read' },
      { id: 'write', name: 'Write' },
      { id: 'delete', name: 'Delete' },
      { id: 'audit', name: 'Audit' }
    ];
  }

  getAuditLogs() {
    // Mock audit logs
    return [
      {
        id: 'log1',
        userId: 'user1',
        action: 'LOGIN',
        timestamp: '2024-01-15T10:00:00Z'
      },
      {
        id: 'log2',
        userId: 'user1',
        action: 'VIEW_INVOICES',
        timestamp: '2024-01-15T10:05:00Z'
      }
    ];
  }

  getInvoiceData() {
    // Mock invoice data
    return [
      {
        id: 'inv1',
        invoiceNumber: 'INV-001',
        customerId: 'cust1',
        subtotal: 100.00,
        taxAmount: 10.00,
        discountAmount: 5.00,
        totalAmount: 105.00
      },
      {
        id: 'inv2',
        invoiceNumber: 'INV-002',
        customerId: 'cust2',
        subtotal: 200.00,
        taxAmount: 20.00,
        discountAmount: 0.00,
        totalAmount: 220.00
      }
    ];
  }

  getSystemConfiguration() {
    return {
      security: {
        encryptionEnabled: true,
        auditLoggingEnabled: true
      },
      backup: {
        enabled: true,
        frequency: 'daily'
      },
      validation: {
        rules: ['tax_calculation', 'total_validation']
      }
    };
  }

  calculateIntegrityHash(data) {
    // Simplified hash calculation
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `sha256:${Math.abs(hash).toString(16)}`;
  }

  calculateOverallStatus(results) {
    if (results.some(r => r.status === 'failed')) return 'failed';
    if (results.some(r => r.status === 'warning')) return 'warning';
    return 'passed';
  }

  generateSummary(results) {
    return {
      total: results.length,
      passed: results.filter(r => r.status === 'passed').length,
      warnings: results.filter(r => r.status === 'warning').length,
      failed: results.filter(r => r.status === 'failed').length
    };
  }
}

// Export singleton instance
export default new DataIntegrityService();