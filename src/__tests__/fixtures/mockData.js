/**
 * Mock data fixtures for testing file processing and validation workflows
 */

export const createMockInvoiceData = (count = 5) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `INV${String(index + 1).padStart(3, '0')}`,
    invoiceNumber: `INV${String(index + 1).padStart(3, '0')}`,
    customerName: `Customer ${String.fromCharCode(65 + index)}`,
    amount: 100.00 + (index * 50),
    taxRate: 10,
    taxAmount: (100.00 + (index * 50)) * 0.1,
    discountAmount: 0.00,
    totalAmount: (100.00 + (index * 50)) * 1.1,
    date: `2024-01-${String(index + 1).padStart(2, '0')}`,
    status: 'processed'
  }));
};

export const createMockValidationResults = (invoiceData) => {
  const totalRecords = invoiceData.length;
  const validRecords = Math.floor(totalRecords * 0.8);
  const invalidRecords = totalRecords - validRecords;
  const totalDiscrepancies = Math.floor(totalRecords * 0.3);

  return {
    success: true,
    summary: {
      totalRecords,
      validRecords,
      invalidRecords,
      totalDiscrepancies,
      criticalCount: Math.floor(totalDiscrepancies * 0.2),
      highSeverityCount: Math.floor(totalDiscrepancies * 0.4),
      mediumSeverityCount: Math.floor(totalDiscrepancies * 0.3),
      lowSeverityCount: Math.floor(totalDiscrepancies * 0.1),
      totalDiscrepancyAmount: totalDiscrepancies * 15.50,
      averageDiscrepancyAmount: 15.50,
      maxDiscrepancyAmount: 50.00
    },
    records: invoiceData.map((record, index) => ({
      ...record,
      validationStatus: index < validRecords ? 'valid' : 'invalid',
      discrepancies: index >= validRecords ? [
        {
          field: 'taxAmount',
          expected: record.amount * (record.taxRate / 100),
          actual: record.taxAmount,
          severity: 'high',
          message: 'Tax calculation mismatch'
        }
      ] : []
    })),
    batchId: `batch_${Date.now()}`,
    validatedAt: new Date().toISOString()
  };
};

export const createMockReportData = (validationResults) => {
  return {
    reportId: `report_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    summary: validationResults.summary,
    details: {
      totalProcessed: validationResults.summary.totalRecords,
      successRate: (validationResults.summary.validRecords / validationResults.summary.totalRecords) * 100,
      discrepancyRate: (validationResults.summary.totalDiscrepancies / validationResults.summary.totalRecords) * 100,
      criticalIssues: validationResults.summary.criticalCount,
      recommendations: [
        'Review high-severity discrepancies immediately',
        'Implement automated tax calculation validation',
        'Update customer data validation rules'
      ]
    },
    records: validationResults.records
  };
};

export const createMockErrorScenarios = () => {
  return {
    fileReadError: new Error('Failed to read file'),
    parseError: new Error('Invalid file format'),
    validationError: new Error('Validation service unavailable'),
    networkError: new Error('Network timeout'),
    exportError: new Error('Export generation failed')
  };
};