// Web Worker for background validation processing
// This worker handles CPU-intensive validation calculations

// Validation calculation functions
const calculateTax = (amount, taxRate) => {
  return Math.round((amount * taxRate / 100) * 100) / 100;
};

const calculateTotal = (amount, taxAmount, discountAmount = 0) => {
  return Math.round((amount + taxAmount - discountAmount) * 100) / 100;
};

const validateInvoiceRecord = (record) => {
  const results = [];
  
  // Validate tax calculation
  const expectedTax = calculateTax(record.amount, record.taxRate || 0);
  if (Math.abs(record.taxAmount - expectedTax) > 0.01) {
    results.push({
      recordId: record.id,
      field: 'taxAmount',
      originalValue: record.taxAmount,
      calculatedValue: expectedTax,
      discrepancy: Math.abs(record.taxAmount - expectedTax),
      severity: Math.abs(record.taxAmount - expectedTax) > 10 ? 'high' : 'medium'
    });
  }
  
  // Validate total calculation
  const expectedTotal = calculateTotal(record.amount, record.taxAmount, record.discountAmount || 0);
  if (Math.abs(record.totalAmount - expectedTotal) > 0.01) {
    results.push({
      recordId: record.id,
      field: 'totalAmount',
      originalValue: record.totalAmount,
      calculatedValue: expectedTotal,
      discrepancy: Math.abs(record.totalAmount - expectedTotal),
      severity: Math.abs(record.totalAmount - expectedTotal) > 50 ? 'high' : 'medium'
    });
  }
  
  return results;
};

const processValidationBatch = (records) => {
  const validationResults = [];
  let processedCount = 0;
  
  for (const record of records) {
    const recordResults = validateInvoiceRecord(record);
    validationResults.push(...recordResults);
    processedCount++;
    
    // Send progress updates every 100 records
    if (processedCount % 100 === 0) {
      self.postMessage({
        type: 'progress',
        processed: processedCount,
        total: records.length,
        percentage: Math.round((processedCount / records.length) * 100)
      });
    }
  }
  
  return {
    results: validationResults,
    summary: {
      totalRecords: records.length,
      validRecords: records.length - validationResults.length,
      invalidRecords: validationResults.length,
      totalDiscrepancies: validationResults.length,
      highSeverityCount: validationResults.filter(r => r.severity === 'high').length
    }
  };
};

// Worker message handler
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  try {
    switch (type) {
      case 'validate':
        const result = processValidationBatch(data.records);
        self.postMessage({
          type: 'complete',
          data: result
        });
        break;
        
      case 'ping':
        self.postMessage({ type: 'pong' });
        break;
        
      default:
        self.postMessage({
          type: 'error',
          error: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};