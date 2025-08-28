import { useState, useEffect } from 'react';
import { FileCheck, Calendar, Download, Check, AlertTriangle, Shield, Eye } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import Button from '../../components/ui/Button';
import { Alert, AlertDescription } from '../../components/ui/Alert';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring.js';

const TermsConditions = () => {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [viewingHistory, setViewingHistory] = useState([]);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showDataProcessing, setShowDataProcessing] = useState(false);
  
  const { user } = useSelector(state => state.auth);
  const { trackInteraction } = usePerformanceMonitoring('TermsConditions');

  useEffect(() => {
    // Check if user has already accepted terms
    const acceptedTerms = localStorage.getItem(`terms-accepted-${user?.id}`);
    if (acceptedTerms) {
      setHasAccepted(true);
    }

    // Track page view
    const viewTime = new Date().toISOString();
    const history = JSON.parse(localStorage.getItem(`terms-history-${user?.id}`) || '[]');
    history.push({ timestamp: viewTime, action: 'viewed' });
    localStorage.setItem(`terms-history-${user?.id}`, JSON.stringify(history));
    setViewingHistory(history);
  }, [user?.id]);

  const handleAcceptTerms = () => {
    const acceptTime = new Date().toISOString();
    
    // Record acceptance
    localStorage.setItem(`terms-accepted-${user?.id}`, acceptTime);
    
    // Update history
    const history = [...viewingHistory, { timestamp: acceptTime, action: 'accepted' }];
    localStorage.setItem(`terms-history-${user?.id}`, JSON.stringify(history));
    
    setHasAccepted(true);
    setViewingHistory(history);
    
    // Track interaction
    trackInteraction('terms-acceptance', performance.now(), { userId: user?.id });
  };

  const handleDownloadPDF = () => {
    // Track download interaction
    trackInteraction('terms-download', performance.now(), { format: 'pdf' });
    
    // Generate PDF content (simplified for demo)
    const content = document.querySelector('.terms-content').innerText;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'invoice-validation-terms.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Terms & Conditions</h1>
        <p className="text-muted-foreground">
          Legal terms and conditions for using the Invoice Validation System
        </p>
      </div>

      {/* Acceptance Status */}
      {hasAccepted && (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            You have accepted these terms and conditions. Last accepted on{' '}
            {new Date(localStorage.getItem(`terms-accepted-${user?.id}`)).toLocaleDateString()}
          </AlertDescription>
        </Alert>
      )}

      {!hasAccepted && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Please review and accept the terms and conditions to continue using the system.
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Navigation */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Quick Navigation</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPrivacyPolicy(!showPrivacyPolicy)}
          >
            <Shield className="h-4 w-4 mr-1" />
            Privacy Policy
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDataProcessing(!showDataProcessing)}
          >
            <Eye className="h-4 w-4 mr-1" />
            Data Processing
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4 mr-1" />
            Download Terms
          </Button>
        </div>
      </div>

      {/* Document info */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileCheck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Invoice Validation System Terms of Use</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last updated: January 1, 2024 | Version 2.1
            </div>
          </div>
        </div>
        
        <div className="prose max-w-none terms-content">
          <h3 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h3>
          <p className="text-muted-foreground mb-4">
            By accessing and using the Invoice Validation System, you accept and agree to be bound by the terms and provision of this agreement.
          </p>

          <h3 className="text-lg font-semibold mb-3">2. Use License</h3>
          <p className="text-muted-foreground mb-4">
            Permission is granted to temporarily use the Invoice Validation System for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display</li>
            <li>attempt to reverse engineer any software contained in the system</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">3. Data Privacy and Security</h3>
          <p className="text-muted-foreground mb-4">
            We are committed to protecting your privacy and the confidentiality of your financial data. All uploaded invoice and financial information is:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
            <li>Encrypted during transmission and storage</li>
            <li>Accessible only to authorized personnel</li>
            <li>Processed in accordance with applicable data protection laws</li>
            <li>Retained only for the duration necessary for validation purposes</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">4. User Responsibilities</h3>
          <p className="text-muted-foreground mb-4">
            Users of the Invoice Validation System are responsible for:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
            <li>Ensuring the accuracy of uploaded data</li>
            <li>Maintaining the confidentiality of their login credentials</li>
            <li>Using the system only for legitimate business purposes</li>
            <li>Reporting any suspected security breaches immediately</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">5. Limitation of Liability</h3>
          <p className="text-muted-foreground mb-4">
            The Invoice Validation System is provided as a tool to assist in financial document validation. While we strive for accuracy, users should verify all results and maintain independent validation processes. We are not liable for any financial decisions made based solely on system outputs.
          </p>

          <h3 className="text-lg font-semibold mb-3">6. System Availability</h3>
          <p className="text-muted-foreground mb-4">
            We aim to provide continuous system availability but cannot guarantee uninterrupted service. Scheduled maintenance will be communicated in advance when possible.
          </p>

          <h3 className="text-lg font-semibold mb-3">7. Compliance and Regulatory Requirements</h3>
          <p className="text-muted-foreground mb-4">
            This system is designed to comply with:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
            <li>General Data Protection Regulation (GDPR)</li>
            <li>Sarbanes-Oxley Act (SOX) requirements for financial data</li>
            <li>ISO 27001 information security standards</li>
            <li>Local financial reporting regulations</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3">8. Audit Trail and Record Keeping</h3>
          <p className="text-muted-foreground mb-4">
            All system activities are logged for audit purposes, including user actions, data modifications, and system access. These logs are retained for a minimum of 7 years in accordance with financial record-keeping requirements.
          </p>

          <h3 className="text-lg font-semibold mb-3">9. Contact Information</h3>
          <p className="text-muted-foreground mb-4">
            For questions about these terms or the Invoice Validation System, please contact our support team at support@invoicevalidation.com.
          </p>
        </div>

        {/* Privacy Policy Section */}
        {showPrivacyPolicy && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy Policy
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                We collect and process personal data in accordance with applicable privacy laws. This includes:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>User account information (name, email, role)</li>
                <li>System usage data and audit logs</li>
                <li>Financial document metadata (not content)</li>
                <li>Performance and error tracking data</li>
              </ul>
            </div>
          </div>
        )}

        {/* Data Processing Section */}
        {showDataProcessing && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Data Processing Details
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Your financial data is processed as follows:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Data is encrypted in transit using TLS 1.3</li>
                <li>Data is encrypted at rest using AES-256</li>
                <li>Processing occurs in secure, audited data centers</li>
                <li>Access is restricted to authorized personnel only</li>
                <li>Data retention follows legal requirements (7 years minimum)</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
          <Button 
            onClick={handleAcceptTerms}
            disabled={hasAccepted}
            className={hasAccepted ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {hasAccepted ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Terms Accepted
              </>
            ) : (
              'Accept Terms'
            )}
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
        </div>

        {/* Viewing History */}
        {viewingHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="font-semibold mb-3">Your Activity History</h4>
            <div className="space-y-2">
              {viewingHistory.slice(-5).reverse().map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{entry.action === 'accepted' ? 'Accepted terms' : 'Viewed terms'}</span>
                  <span>on {new Date(entry.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermsConditions;