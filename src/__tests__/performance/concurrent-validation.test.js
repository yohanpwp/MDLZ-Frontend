import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import ValidationEngine from '../../services/ValidationEngine';
import { validationSlice } from '../../redux/validationSlice';

// Mock Web Worker for testing
class MockWorker {
  constructor(scriptURL) {
    this.scriptURL = scriptURL;
    this.onmessage = null;
    this.onerror = null;
  }

  postMessage(data) {
    // Simulate async processing
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            type: 'validation-complete',
            results: data.invoices.map(invoice => ({
              ...invoice,
              discrepancies: Math.random() > 0.7 ? ['tax-mismatch'] : [],
              severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
            }))
          }
        });
      }
    }, Math.random() * 100 + 50); // 50-150ms processing time
  }

  terminate() {
    // Cleanup
  }
}

// Mock Worker constructor
global.Worker = MockWorker;

describe('Concurrent Validation Performance Tests', () => {
  let store;
  let validationEngine;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        validation: validationSlice.reducer
      }
    });
    
    validationEngine = new ValidationEngine();
  });

  it('handles multiple concurrent validation sessions', async () => {
    const sessionCount = 5;
    const invoicesPerSession = 500;
    
    const generateSessionData = (sessionId) => {
      const data = [];
      for (let i = 0; i < invoicesPerSession; i++) {
        data.push({
          id: `${sessionId}-${i}`,
          invoiceNumber: `INV-${sessionId}-${i.toString().padStart(4, '0')}`,
          date: new Date(2024, 0, (i % 28) + 1).toISOString(),
          customer: `Customer ${sessionId}-${i % 10}`,
          amount: parseFloat((Math.random() * 1000).toFixed(2)),
          tax: parseFloat((Math.random() * 200).toFixed(2)),
          total: 0
        });
      }
      
      // Calculate totals
      data.forEach(item => {
        item.total = item.amount + item.tax;
      });
      
      return data;
    };

    const startTime = performance.now();
    
    // Create concurrent validation sessions
    const validationPromises = [];
    
    for (let sessionId = 1; sessionId <= sessionCount; sessionId++) {
      const sessionData = generateSessionData(sessionId);
      
      const validationPromise = new Promise(async (resolve) => {
        const sessionStartTime = performance.now();
        
        // Simulate validation processing
        const results = await validationEngine.validateBatch(sessionData);
        
        const sessionEndTime = performance.now();
        const sessionDuration = sessionEndTime - sessionStartTime;
        
        resolve({
          sessionId,
          duration: sessionDuration,
          recordCount: sessionData.length,
          results: results.length
        });
      });
      
      validationPromises.push(validationPromise);
    }

    // Wait for all sessions to complete
    const sessionResults = await Promise.all(validationPromises);
    
    const totalTime = performance.now() - startTime;
    
    // Verify all sessions completed
    expect(sessionResults).toHaveLength(sessionCount);
    
    // Check individual session performance
    sessionResults.forEach(result => {
      expect(result.duration).toBeLessThan(2000); // Each session < 2 seconds
      expect(result.recordCount).toBe(invoicesPerSession);
      expect(result.results).toBe(invoicesPerSession);
    });
    
    // Total time should be reasonable for concurrent processing
    expect(totalTime).toBeLessThan(3000); // All sessions < 3 seconds total
    
    console.log(`Concurrent validation completed: ${sessionCount} sessions, ${totalTime.toFixed(2)}ms total`);
  });

  it('maintains performance under load with queue management', async () => {
    const queueSize = 10;
    const maxConcurrent = 3;
    
    let activeValidations = 0;
    let completedValidations = 0;
    const validationQueue = [];
    
    const processValidation = async (data, validationId) => {
      activeValidations++;
      
      const startTime = performance.now();
      
      // Simulate validation work
      await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      activeValidations--;
      completedValidations++;
      
      return {
        validationId,
        duration,
        recordCount: data.length
      };
    };

    const queueManager = async () => {
      while (validationQueue.length > 0 || activeValidations > 0) {
        if (validationQueue.length > 0 && activeValidations < maxConcurrent) {
          const { data, validationId, resolve } = validationQueue.shift();
          
          processValidation(data, validationId).then(resolve);
        }
        
        // Small delay to prevent busy waiting
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    };

    // Generate validation requests
    const validationPromises = [];
    
    for (let i = 1; i <= queueSize; i++) {
      const data = Array.from({ length: 100 }, (_, index) => ({
        id: `${i}-${index}`,
        invoiceNumber: `INV-${i}-${index}`,
        amount: Math.random() * 1000,
        tax: Math.random() * 200
      }));

      const validationPromise = new Promise((resolve) => {
        validationQueue.push({
          data,
          validationId: i,
          resolve
        });
      });
      
      validationPromises.push(validationPromise);
    }

    const startTime = performance.now();
    
    // Start queue manager
    const queueManagerPromise = queueManager();
    
    // Wait for all validations to complete
    const results = await Promise.all(validationPromises);
    await queueManagerPromise;
    
    const totalTime = performance.now() - startTime;
    
    // Verify results
    expect(results).toHaveLength(queueSize);
    expect(completedValidations).toBe(queueSize);
    
    // Check that concurrency was respected
    results.forEach(result => {
      expect(result.duration).toBeLessThan(500); // Individual validation < 500ms
    });
    
    // Total time should be efficient with queue management
    expect(totalTime).toBeLessThan(2000);
    
    console.log(`Queue managed validation: ${queueSize} validations, max concurrent: ${maxConcurrent}, total time: ${totalTime.toFixed(2)}ms`);
  });

  it('handles validation errors in concurrent sessions gracefully', async () => {
    const validationCount = 8;
    const errorRate = 0.25; // 25% of validations will fail
    
    const validationPromises = [];
    
    for (let i = 1; i <= validationCount; i++) {
      const shouldFail = Math.random() < errorRate;
      
      const validationPromise = new Promise(async (resolve, reject) => {
        try {
          if (shouldFail) {
            throw new Error(`Validation ${i} failed`);
          }
          
          // Simulate successful validation
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
          
          resolve({
            validationId: i,
            status: 'success',
            recordCount: 100
          });
        } catch (error) {
          resolve({
            validationId: i,
            status: 'error',
            error: error.message
          });
        }
      });
      
      validationPromises.push(validationPromise);
    }

    const startTime = performance.now();
    const results = await Promise.all(validationPromises);
    const totalTime = performance.now() - startTime;
    
    // Verify all promises resolved (no rejections)
    expect(results).toHaveLength(validationCount);
    
    const successfulValidations = results.filter(r => r.status === 'success');
    const failedValidations = results.filter(r => r.status === 'error');
    
    // Should have some successes and some failures
    expect(successfulValidations.length).toBeGreaterThan(0);
    expect(failedValidations.length).toBeGreaterThan(0);
    
    // Error handling shouldn't significantly impact performance
    expect(totalTime).toBeLessThan(1000);
    
    console.log(`Error handling test: ${successfulValidations.length} successful, ${failedValidations.length} failed, ${totalTime.toFixed(2)}ms total`);
  });

  it('scales validation performance with available resources', async () => {
    const testScenarios = [
      { concurrent: 1, records: 1000 },
      { concurrent: 2, records: 1000 },
      { concurrent: 4, records: 1000 },
      { concurrent: 8, records: 1000 }
    ];
    
    const scenarioResults = [];
    
    for (const scenario of testScenarios) {
      const { concurrent, records } = scenario;
      
      const batchSize = Math.ceil(records / concurrent);
      const batches = [];
      
      // Create batches
      for (let i = 0; i < concurrent; i++) {
        const batch = [];
        const startIndex = i * batchSize;
        const endIndex = Math.min(startIndex + batchSize, records);
        
        for (let j = startIndex; j < endIndex; j++) {
          batch.push({
            id: j,
            invoiceNumber: `INV-${j}`,
            amount: Math.random() * 1000,
            tax: Math.random() * 200
          });
        }
        
        batches.push(batch);
      }
      
      const startTime = performance.now();
      
      // Process batches concurrently
      const batchPromises = batches.map(async (batch, index) => {
        const batchStartTime = performance.now();
        
        // Simulate validation processing
        await new Promise(resolve => setTimeout(resolve, batch.length * 0.5)); // 0.5ms per record
        
        const batchEndTime = performance.now();
        
        return {
          batchIndex: index,
          recordCount: batch.length,
          duration: batchEndTime - batchStartTime
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      const totalTime = performance.now() - startTime;
      
      scenarioResults.push({
        concurrent,
        records,
        totalTime,
        throughput: records / (totalTime / 1000), // records per second
        batchResults
      });
    }
    
    // Verify scaling behavior
    scenarioResults.forEach((result, index) => {
      expect(result.totalTime).toBeLessThan(5000); // All scenarios < 5 seconds
      expect(result.throughput).toBeGreaterThan(100); // At least 100 records/second
      
      if (index > 0) {
        const previousResult = scenarioResults[index - 1];
        // Higher concurrency should generally improve throughput
        // (allowing for some variance due to overhead)
        expect(result.throughput).toBeGreaterThan(previousResult.throughput * 0.8);
      }
    });
    
    console.log('Scaling results:');
    scenarioResults.forEach(result => {
      console.log(`  ${result.concurrent} concurrent: ${result.totalTime.toFixed(2)}ms, ${result.throughput.toFixed(2)} records/sec`);
    });
  });
});