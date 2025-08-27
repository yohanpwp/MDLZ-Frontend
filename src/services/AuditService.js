/**
 * AuditService - Handles audit logging and compliance features
 * 
 * This service provides methods for logging user activities, system events,
 * and maintaining audit trails for compliance requirements.
 */
class AuditService {
  constructor() {
    this.auditLogKey = 'invoice_validation_audit_log';
    this.maxLogEntries = 10000; // Keep last 10,000 entries
  }

  /**
   * Log a user action or system event
   * @param {Object} logEntry - Audit log entry
   * @returns {Promise<void>}
   */
  async logEvent(logEntry) {
    try {
      const auditLogs = this.getAuditLogs();
      
      const newEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        sessionId: this.getCurrentSessionId(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        ...logEntry
      };

      auditLogs.unshift(newEntry);

      // Keep only the most recent entries
      if (auditLogs.length > this.maxLogEntries) {
        auditLogs.splice(this.maxLogEntries);
      }

      localStorage.setItem(this.auditLogKey, JSON.stringify(auditLogs));
      
      // In production, this would also send to a secure audit server
      console.log('Audit Event:', newEntry);
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Get audit logs with filtering
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered audit logs
   */
  getAuditLogs(filters = {}) {
    try {
      let logs = JSON.parse(localStorage.getItem(this.auditLogKey) || '[]');

      // Apply filters
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }

      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }

      if (filters.module) {
        logs = logs.filter(log => log.module === filters.module);
      }

      if (filters.startDate) {
        logs = logs.filter(log => 
          new Date(log.timestamp) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        logs = logs.filter(log => 
          new Date(log.timestamp) <= new Date(filters.endDate)
        );
      }

      if (filters.severity) {
        logs = logs.filter(log => log.severity === filters.severity);
      }

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 100;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      return {
        logs: logs.slice(startIndex, endIndex),
        total: logs.length,
        totalPages: Math.ceil(logs.length / limit)
      };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return { logs: [], total: 0, totalPages: 0 };
    }
  }

  /**
   * Log user authentication events
   * @param {string} userId - User ID
   * @param {string} action - Authentication action (LOGIN, LOGOUT, FAILED_LOGIN)
   * @param {Object} details - Additional details
   */
  async logAuthEvent(userId, action, details = {}) {
    await this.logEvent({
      userId,
      action,
      module: 'authentication',
      severity: action === 'FAILED_LOGIN' ? 'warning' : 'info',
      details: JSON.stringify(details),
      description: this.getAuthEventDescription(action, details)
    });
  }

  /**
   * Log user management events
   * @param {string} adminUserId - Admin user performing the action
   * @param {string} action - Management action
   * @param {string} targetUserId - Target user ID
   * @param {Object} details - Additional details
   */
  async logUserManagementEvent(adminUserId, action, targetUserId, details = {}) {
    await this.logEvent({
      userId: adminUserId,
      action,
      module: 'user_management',
      severity: this.getUserManagementSeverity(action),
      targetUserId,
      details: JSON.stringify(details),
      description: this.getUserManagementDescription(action, targetUserId, details)
    });
  }

  /**
   * Log data access events
   * @param {string} userId - User ID
   * @param {string} action - Data action
   * @param {Object} details - Additional details
   */
  async logDataAccessEvent(userId, action, details = {}) {
    await this.logEvent({
      userId,
      action,
      module: 'data_access',
      severity: 'info',
      details: JSON.stringify(details),
      description: this.getDataAccessDescription(action, details)
    });
  }

  /**
   * Log system configuration changes
   * @param {string} userId - User ID
   * @param {string} action - Configuration action
   * @param {Object} details - Additional details
   */
  async logConfigurationEvent(userId, action, details = {}) {
    await this.logEvent({
      userId,
      action,
      module: 'configuration',
      severity: 'warning',
      details: JSON.stringify(details),
      description: this.getConfigurationDescription(action, details)
    });
  }

  /**
   * Log security events
   * @param {string} userId - User ID (if applicable)
   * @param {string} action - Security action
   * @param {Object} details - Additional details
   */
  async logSecurityEvent(userId, action, details = {}) {
    await this.logEvent({
      userId,
      action,
      module: 'security',
      severity: 'critical',
      details: JSON.stringify(details),
      description: this.getSecurityDescription(action, details)
    });
  }

  /**
   * Export audit logs for compliance
   * @param {Object} filters - Export filters
   * @returns {Promise<Blob>} CSV blob of audit logs
   */
  async exportAuditLogs(filters = {}) {
    try {
      const { logs } = this.getAuditLogs(filters);
      
      const headers = [
        'Timestamp',
        'User ID',
        'Action',
        'Module',
        'Severity',
        'Description',
        'IP Address',
        'Session ID',
        'Details'
      ];

      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          log.timestamp,
          log.userId || '',
          log.action,
          log.module,
          log.severity,
          `"${log.description || ''}"`,
          log.ipAddress || '',
          log.sessionId || '',
          `"${log.details || ''}"`
        ].join(','))
      ].join('\n');

      return new Blob([csvContent], { type: 'text/csv' });
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   * @param {Object} filters - Filter criteria
   * @returns {Object} Audit statistics
   */
  getAuditStatistics(filters = {}) {
    try {
      const { logs } = this.getAuditLogs(filters);
      
      const stats = {
        totalEvents: logs.length,
        eventsByModule: {},
        eventsByAction: {},
        eventsBySeverity: {},
        eventsLast24Hours: 0,
        eventsLast7Days: 0,
        eventsLast30Days: 0
      };

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      logs.forEach(log => {
        const logDate = new Date(log.timestamp);
        
        // Count by module
        stats.eventsByModule[log.module] = (stats.eventsByModule[log.module] || 0) + 1;
        
        // Count by action
        stats.eventsByAction[log.action] = (stats.eventsByAction[log.action] || 0) + 1;
        
        // Count by severity
        stats.eventsBySeverity[log.severity] = (stats.eventsBySeverity[log.severity] || 0) + 1;
        
        // Count by time periods
        if (logDate >= last24Hours) stats.eventsLast24Hours++;
        if (logDate >= last7Days) stats.eventsLast7Days++;
        if (logDate >= last30Days) stats.eventsLast30Days++;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get audit statistics:', error);
      return {
        totalEvents: 0,
        eventsByModule: {},
        eventsByAction: {},
        eventsBySeverity: {},
        eventsLast24Hours: 0,
        eventsLast7Days: 0,
        eventsLast30Days: 0
      };
    }
  }

  // Private helper methods

  /**
   * Get current session ID
   * @private
   */
  getCurrentSessionId() {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get client IP address (mock implementation)
   * @private
   */
  async getClientIP() {
    // In a real implementation, this would call an API to get the client IP
    return '192.168.1.100';
  }

  /**
   * Get authentication event description
   * @private
   */
  getAuthEventDescription(action, details) {
    switch (action) {
      case 'LOGIN':
        return `User logged in successfully`;
      case 'LOGOUT':
        return `User logged out`;
      case 'FAILED_LOGIN':
        return `Failed login attempt: ${details.reason || 'Invalid credentials'}`;
      case 'PASSWORD_CHANGE':
        return `User changed password`;
      case 'ACCOUNT_LOCKED':
        return `User account locked due to multiple failed attempts`;
      default:
        return `Authentication event: ${action}`;
    }
  }

  /**
   * Get user management event description
   * @private
   */
  getUserManagementDescription(action, targetUserId, details) {
    switch (action) {
      case 'CREATE_USER':
        return `Created user account: ${targetUserId}`;
      case 'UPDATE_USER':
        return `Updated user account: ${targetUserId}`;
      case 'DELETE_USER':
        return `Deleted user account: ${targetUserId}`;
      case 'UPDATE_USER_ROLE':
        return `Changed user role: ${targetUserId} to ${details.newRole}`;
      case 'UPDATE_USER_PERMISSIONS':
        return `Updated permissions for user: ${targetUserId}`;
      case 'ACTIVATE_USER':
        return `Activated user account: ${targetUserId}`;
      case 'DEACTIVATE_USER':
        return `Deactivated user account: ${targetUserId}`;
      default:
        return `User management event: ${action} for ${targetUserId}`;
    }
  }

  /**
   * Get data access event description
   * @private
   */
  getDataAccessDescription(action, details) {
    switch (action) {
      case 'VIEW_INVOICES':
        return `Viewed invoice data: ${details.count || 'unknown'} records`;
      case 'EXPORT_DATA':
        return `Exported data: ${details.type || 'unknown'} format`;
      case 'IMPORT_DATA':
        return `Imported data: ${details.recordCount || 'unknown'} records`;
      case 'VALIDATE_INVOICES':
        return `Validated invoices: ${details.count || 'unknown'} records`;
      case 'GENERATE_REPORT':
        return `Generated report: ${details.reportType || 'unknown'}`;
      default:
        return `Data access event: ${action}`;
    }
  }

  /**
   * Get configuration event description
   * @private
   */
  getConfigurationDescription(action, details) {
    switch (action) {
      case 'UPDATE_SYSTEM_SETTINGS':
        return `Updated system settings: ${details.setting || 'unknown'}`;
      case 'UPDATE_VALIDATION_RULES':
        return `Updated validation rules`;
      case 'UPDATE_NOTIFICATION_SETTINGS':
        return `Updated notification settings`;
      default:
        return `Configuration event: ${action}`;
    }
  }

  /**
   * Get security event description
   * @private
   */
  getSecurityDescription(action, details) {
    switch (action) {
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
        return `Unauthorized access attempt to: ${details.resource || 'unknown'}`;
      case 'SUSPICIOUS_ACTIVITY':
        return `Suspicious activity detected: ${details.description || 'unknown'}`;
      case 'SESSION_TERMINATED':
        return `Session terminated: ${details.reason || 'unknown'}`;
      case 'PERMISSION_DENIED':
        return `Permission denied for action: ${details.action || 'unknown'}`;
      default:
        return `Security event: ${action}`;
    }
  }

  /**
   * Get user management event severity
   * @private
   */
  getUserManagementSeverity(action) {
    const criticalActions = ['DELETE_USER', 'UPDATE_USER_ROLE'];
    const warningActions = ['CREATE_USER', 'UPDATE_USER_PERMISSIONS', 'DEACTIVATE_USER'];
    
    if (criticalActions.includes(action)) return 'critical';
    if (warningActions.includes(action)) return 'warning';
    return 'info';
  }
}

// Export singleton instance
export default new AuditService();