import React from 'react';
import { History, CheckCircle, Edit, AlertTriangle, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import { Badge } from '../ui/Badge';

const AuditModal = ({ 
  isOpen, 
  onClose, 
  entity = null,
  entityType = 'record',
  auditTrail = []
}) => {
  const getActionIcon = (action) => {
    switch (action.toLowerCase()) {
      case 'created':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'updated':
      case 'modified':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action) => {
    switch (action.toLowerCase()) {
      case 'created':
        return 'success';
      case 'updated':
      case 'modified':
        return 'default';
      case 'deleted':
        return 'destructive';
      case 'warning':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  // Mock audit trail if none provided
  const mockAuditTrail = entity ? [
    {
      id: 1,
      action: 'Created',
      description: `${entityType} record created`,
      user: 'System Admin',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      details: `Initial ${entityType} record creation`
    },
    {
      id: 2,
      action: 'Updated',
      description: 'Contact information updated',
      user: 'John Doe',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      details: 'Email address and phone number modified'
    },
    {
      id: 3,
      action: 'Updated',
      description: 'Status changed',
      user: 'Jane Smith',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      details: 'Status updated to active'
    }
  ] : [];

  const displayAuditTrail = auditTrail.length > 0 ? auditTrail : mockAuditTrail;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entity ? `Audit Trail - ${entity.name || entity.customerName || entity.productName || 'Record'}` : 'Audit Trail'}
      size="lg"
    >
      <div className="p-6">
        {entity && (
          <div className="bg-muted/30 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-foreground mb-2">Record Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">ID:</span>
                <span className="ml-2 font-mono">{entity.id || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 capitalize">{entityType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2">{formatDate(entity.createdAt || new Date())}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Last Modified:</span>
                <span className="ml-2">{formatDate(entity.updatedAt || new Date())}</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <History className="h-4 w-4" />
            Activity Timeline
          </h3>

          {displayAuditTrail.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No audit trail available for this record</p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayAuditTrail.map((entry, index) => (
                <div 
                  key={entry.id || index}
                  className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(entry.action)}
                      <span className="font-medium text-foreground">{entry.description}</span>
                      <Badge variant={getActionColor(entry.action)} size="sm">
                        {entry.action}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  
                  <div className="ml-6 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {entry.details}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {entry.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AuditModal;