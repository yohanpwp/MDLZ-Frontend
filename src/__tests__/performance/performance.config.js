// Performance testing configuration and utilities

export const PERFORMANCE_THRESHOLDS = {
  // File processing thresholds
  csvParsing: {
    maxTimePerRecord: 0.5, // milliseconds
    maxMemoryPerRecord: 1024, // bytes
  },
  
  // Validation thresholds
  validation: {
    minThroughput: 50, // records per second
    maxMemoryIncrease: 10 * 1024 * 1024, // 10MB
    maxValidationTime: 2000, // 2 seconds per batch
  },
  
  // UI rendering thresholds
  rendering: {
    maxRenderTime: 500, // milliseconds
    maxTimePerItem: 2, // milliseconds per rendered item
  },
  
  // Concurrent processing thresholds
  concurrent: {
    maxSessionTime: 3000, // 3 seconds for multiple sessions
    maxQueueTime: 2000, // 2 seconds for queue processing
  },
  
  // Memory usage thresholds
  memory: {
    maxLeakPerOperation: 1024 * 1024, // 1MB
    maxRetainedMemory: 20 * 1024 * 1024, // 20MB
    maxConcurrentMemory: 15 * 1024 * 1024, // 15MB
  },
  
  // Export thresholds
  export: {
    maxTimePerRecord: 0.1, // milliseconds
    maxExportTime: 30000, // 30 seconds for large exports
  }
};

export const TEST_DATA_SIZES = {
  small: 100,
  medium: 500,
  large: 1000,
  xlarge: 2500,
  xxlarge: 5000,
  stress: 10000
};

export class PerformanceMonitor {
  constructor(testName) {
    this.testName = testName;
    this.measurements = [];
    this.startTime = null;
    this.startMemory = null;
  }

  start() {
    this.startTime = performance.now();
    this.startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
  }

  end() {
    if (!this.startTime) {
      throw new Error('Performance monitor not started');
    }

    const endTime = performance.now();
    const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

    const measurement = {
      duration: endTime - this.startTime,
      memoryDelta: endMemory - this.startMemory,
      timestamp: new Date().toISOString()
    };

    this.measurements.push(measurement);
    
    // Reset for next measurement
    this.startTime = null;
    this.startMemory = null;

    return measurement;
  }

  getStats() {
    if (this.measurements.length === 0) {
      return null;
    }

    const durations = this.measurements.map(m => m.duration);
    const memoryDeltas = this.measurements.map(m => m.memoryDelta);

    return {
      testName: this.testName,
      measurements: this.measurements.length,
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        total: durations.reduce((a, b) => a + b, 0)
      },
      memory: {
        min: Math.min(...memoryDeltas),
        max: Math.max(...memoryDeltas),
        avg: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
        total: memoryDeltas.reduce((a, b) => a + b, 0)
      }
    };
  }

  logResults() {
    const stats = this.getStats();
    if (!stats) {
      console.log(`No measurements recorded for ${this.testName}`);
      return;
    }

    console.log(`\n=== Performance Results: ${stats.testName} ===`);
    console.log(`Measurements: ${stats.measurements}`);
    console.log(`Duration: ${stats.duration.avg.toFixed(2)}ms avg (${stats.duration.min.toFixed(2)}-${stats.duration.max.toFixed(2)}ms)`);
    console.log(`Memory: ${(stats.memory.avg / 1024 / 1024).toFixed(2)}MB avg delta`);
    console.log(`Total Time: ${stats.duration.total.toFixed(2)}ms`);
  }
}

export function generateTestData(type, size, options = {}) {
  switch (type) {
    case 'invoices':
      return generateInvoiceData(size, options);
    case 'customers':
      return generateCustomerData(size, options);
    case 'products':
      return generateProductData(size, options);
    case 'validation-results':
      return generateValidationResults(size, options);
    default:
      throw new Error(`Unknown test data type: ${type}`);
  }
}

function generateInvoiceData(size, options = {}) {
  const data = [];
  const { includeDiscrepancies = true, complexCalculations = false } = options;

  for (let i = 1; i <= size; i++) {
    const amount = parseFloat((Math.random() * 1000).toFixed(2));
    const taxRate = complexCalculations ? (0.15 + Math.random() * 0.1) : 0.2;
    const tax = parseFloat((amount * taxRate).toFixed(2));
    const discount = complexCalculations ? Math.random() * 0.1 : 0;
    const discountAmount = parseFloat((amount * discount).toFixed(2));
    const total = parseFloat((amount + tax - discountAmount).toFixed(2));

    data.push({
      id: i,
      invoiceNumber: `INV-${i.toString().padStart(6, '0')}`,
      date: new Date(2024, 0, (i % 28) + 1).toISOString(),
      customer: `Customer ${String.fromCharCode(65 + (i % 26))}`,
      amount,
      tax,
      discount: complexCalculations ? discount : 0,
      discountAmount: complexCalculations ? discountAmount : 0,
      total,
      currency: complexCalculations ? ['USD', 'EUR', 'GBP'][i % 3] : 'USD',
      paymentTerms: complexCalculations ? ['NET30', 'NET60', 'COD'][i % 3] : 'NET30',
      ...(includeDiscrepancies && {
        discrepancies: Math.random() > 0.7 ? ['tax-mismatch', 'amount-mismatch'][Math.floor(Math.random() * 2)] : [],
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
      })
    });
  }

  return data;
}

function generateCustomerData(size, options = {}) {
  const data = [];
  
  for (let i = 1; i <= size; i++) {
    data.push({
      id: i,
      name: `Customer ${i}`,
      email: `customer${i}@example.com`,
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      address: `${i} Test Street, Test City, TC ${i.toString().padStart(5, '0')}`,
      createdAt: new Date(2024, 0, (i % 28) + 1).toISOString()
    });
  }

  return data;
}

function generateProductData(size, options = {}) {
  const categories = ['Electronics', 'Software', 'Hardware', 'Services', 'Accessories'];
  const data = [];
  
  for (let i = 1; i <= size; i++) {
    data.push({
      id: i,
      name: `Product ${i}`,
      sku: `PROD-${i.toString().padStart(4, '0')}`,
      price: parseFloat((Math.random() * 500).toFixed(2)),
      category: categories[i % categories.length],
      description: `Description for product ${i}`,
      createdAt: new Date(2024, 0, (i % 28) + 1).toISOString()
    });
  }

  return data;
}

function generateValidationResults(size, options = {}) {
  const { errorRate = 0.3 } = options;
  const data = [];
  
  for (let i = 1; i <= size; i++) {
    const hasError = Math.random() < errorRate;
    
    data.push({
      id: i,
      invoiceNumber: `INV-${i.toString().padStart(6, '0')}`,
      status: hasError ? 'invalid' : 'valid',
      discrepancies: hasError ? ['tax-mismatch', 'amount-mismatch', 'date-invalid'][Math.floor(Math.random() * 3)] : [],
      severity: hasError ? ['medium', 'high'][Math.floor(Math.random() * 2)] : 'low',
      validatedAt: new Date().toISOString()
    });
  }

  return data;
}

export function assertPerformance(measurement, thresholds, context = '') {
  const contextStr = context ? ` (${context})` : '';
  
  if (thresholds.maxDuration && measurement.duration > thresholds.maxDuration) {
    throw new Error(`Performance threshold exceeded${contextStr}: ${measurement.duration.toFixed(2)}ms > ${thresholds.maxDuration}ms`);
  }
  
  if (thresholds.maxMemoryDelta && measurement.memoryDelta > thresholds.maxMemoryDelta) {
    throw new Error(`Memory threshold exceeded${contextStr}: ${(measurement.memoryDelta / 1024 / 1024).toFixed(2)}MB > ${(thresholds.maxMemoryDelta / 1024 / 1024).toFixed(2)}MB`);
  }
  
  if (thresholds.minThroughput && measurement.throughput && measurement.throughput < thresholds.minThroughput) {
    throw new Error(`Throughput threshold not met${contextStr}: ${measurement.throughput.toFixed(2)} < ${thresholds.minThroughput}`);
  }
}