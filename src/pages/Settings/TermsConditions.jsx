import { FileCheck, Calendar } from 'lucide-react';
import Button from '../../components/ui/Button';

const TermsConditions = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Terms & Conditions</h1>
        <p className="text-muted-foreground">
          Legal terms and conditions for using the Invoice Validation System
        </p>
      </div>

      {/* Document info */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileCheck className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">Invoice Validation System Terms of Use</h2>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last updated: January 1, 2024
            </div>
          </div>
        </div>
        
        <div className="prose max-w-none">
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

          <h3 className="text-lg font-semibold mb-3">7. Contact Information</h3>
          <p className="text-muted-foreground mb-4">
            For questions about these terms or the Invoice Validation System, please contact our support team at support@invoicevalidation.com.
          </p>
        </div>

        <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
          <Button>Accept Terms</Button>
          <Button variant="outline">Download PDF</Button>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;