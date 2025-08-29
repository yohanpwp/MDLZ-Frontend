import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FileUploader from '../../components/FileUploader';
import ValidationEngine from '../../services/ValidationEngine';
import { fileProcessingSlice } from '../../redux/fileProcessingSlice';
import { parseCSV, createMockFile } from '../utils/testHelpers';



describe('Memory Usage Performance Tests', () => {
  let store;
  let initialMemory;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        fileProcessing: fileProcessingSlice.reducer
      }
    });
    
    // Record initial memory usage
    if (performance.memory) {
      initialMemory = performance.memory.usedJSHeapSize;
    }
  });

  afterEach(() => {
    cleanup();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  it('file processing does not cause memory leaks', async () => {
    const generateLargeCSV = (rows) => {
      let csv = 'Invoice Number,Date,Customer,Amount,Tax,Total\n';
      for (let i = 1; i <= rows; i++) {
        csv += `INV-${i.toString().padStart(6, '0')},2024-01-${(i % 28 + 1).toString().padStart(2, '0')},Customer ${i},${(Math.random() * 1000).toFixed(2)},${(Math.random() * 200).toFixed(2)},${(Math.random() * 1200).toFixed(2)}\n`;
      }
      return csv;
    };

    const memorySnapshots = [];

    // Process multiple files sequentially
    for (let fileIndex = 0; fileIndex < 10; fileIndex++) {
      const csvContent = generateLargeCSV(1000);
      const file = new File([csvContent], `test-${fileIndex}.csv`, { type: 'text/csv' });

      // Simulate file processing
      const parsedData = await parseCSV(csvContent);

      store.dispatch({
        type: 'fileProcessing/setProcessedData',
        payload: parsedData
      });

      // Clear the data to simulate processing completion
      store.dispatch({
        type: 'fileProcessing/clearData'
      });

      // Record memory usage
      if (performance.memory) {
        memorySnapshots.push(performance.memory.usedJSHeapSize);
      }

      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
    }

    // Check memory growth pattern
    if (memorySnapshots.length > 0) {
      const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];
      const averageGrowthPerFile = memoryGrowth / 10;

      // Memory growth per file should be minimal (< 1MB)
      expect(averageGrowthPerFile).toBeLessThan(1024 * 1024);
    }
  });

  it('validation engine memory usage remains stable', async () => {
    const validationEngine = new ValidationEngine();
    const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;

    // Process multiple validation batches
    for (let batch = 0; batch < 20; batch++) {
      const testData = [];
      
      // Generate test data
      for (let i = 0; i < 500; i++) {
        testData.push({
          id: i + 1,
          invoiceNumber: `INV-${batch}-${i}`,
          amount: Math.random() * 1000,
          tax: Math.random() * 200,
          total: 0 // Will be calculated
        });
      }

      // Calculate totals
      testData.forEach(item => {
        item.total = item.amount + item.tax;
      });

      // Run validation
      const results = await validationEngine.validateBatch(testData);
      
      // Verify results exist
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);

      // Clear references
      testData.length = 0;
    }

    const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryIncrease = memoryAfter - memoryBefore;

    // Memory increase should be reasonable (< 10MB for 20 batches)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  it('component mounting and unmounting does not leak memory', async () => {
    const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;

    // Mount and unmount components multiple times
    for (let i = 0; i < 50; i++) {
      const { unmount } = render(
        <Provider store={store}>
          <FileUploader />
        </Provider>
      );

      // Simulate some interaction
      store.dispatch({
        type: 'fileProcessing/setUploadProgress',
        payload: Math.random() * 100
      });

      // Unmount component
      unmount();

      // Force cleanup every 10 iterations
      if (i % 10 === 0 && global.gc) {
        global.gc();
      }
    }

    // Final cleanup
    if (global.gc) {
      global.gc();
    }

    const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryIncrease = memoryAfter - memoryBefore;

    // Memory increase should be minimal (< 5MB for 50 mount/unmount cycles)
    expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
  });

  it('large file processing with memory monitoring', async () => {
    const generateVeryLargeCSV = (rows) => {
      const chunks = [];
      const chunkSize = 1000;
      
      chunks.push('Invoice Number,Date,Customer,Amount,Tax,Total\n');
      
      for (let i = 0; i < rows; i += chunkSize) {
        let chunk = '';
        const endIndex = Math.min(i + chunkSize, rows);
        
        for (let j = i; j < endIndex; j++) {
          chunk += `INV-${j.toString().padStart(8, '0')},2024-01-${(j % 28 + 1).toString().padStart(2, '0')},Customer ${j % 1000},${(Math.random() * 1000).toFixed(2)},${(Math.random() * 200).toFixed(2)},${(Math.random() * 1200).toFixed(2)}\n`;
        }
        
        chunks.push(chunk);
      }
      
      return chunks.join('');
    };

    const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Process very large file (10,000 records)
    const largeCSV = generateVeryLargeCSV(10000);
    
    const memoryAfterGeneration = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const generationMemory = memoryAfterGeneration - memoryBefore;

    // Parse the CSV
    const parsedData = await parseCSV(largeCSV);

    const memoryAfterParsing = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const parsingMemory = memoryAfterParsing - memoryAfterGeneration;

    // Verify data was parsed correctly
    expect(parsedData).toHaveLength(10000);

    // Clear references
    parsedData.length = 0;

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    const memoryAfterCleanup = performance.memory ? performance.memory.usedJSHeapSize : 0;

    // Memory should be released after cleanup
    const memoryRetained = memoryAfterCleanup - memoryBefore;
    
    // Retained memory should be minimal (< 20MB)
    expect(memoryRetained).toBeLessThan(20 * 1024 * 1024);

    console.log(`Memory usage - Generation: ${(generationMemory / 1024 / 1024).toFixed(2)}MB, Parsing: ${(parsingMemory / 1024 / 1024).toFixed(2)}MB, Retained: ${(memoryRetained / 1024 / 1024).toFixed(2)}MB`);
  });

  it('concurrent processing memory isolation', async () => {
    const memoryBefore = performance.memory ? performance.memory.usedJSHeapSize : 0;

    // Simulate concurrent processing
    const promises = [];
    
    for (let worker = 0; worker < 5; worker++) {
      const promise = new Promise(async (resolve) => {
        const workerData = [];
        
        // Each worker processes 1000 records
        for (let i = 0; i < 1000; i++) {
          workerData.push({
            id: `${worker}-${i}`,
            data: new Array(100).fill(Math.random())
          });
        }

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Clear worker data
        workerData.length = 0;
        
        resolve(worker);
      });
      
      promises.push(promise);
    }

    // Wait for all workers to complete
    await Promise.all(promises);

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    const memoryAfter = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryIncrease = memoryAfter - memoryBefore;

    // Memory increase should be reasonable for concurrent processing (< 15MB)
    expect(memoryIncrease).toBeLessThan(15 * 1024 * 1024);
  });
});