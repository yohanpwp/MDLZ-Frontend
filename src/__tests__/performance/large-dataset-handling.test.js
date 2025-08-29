import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ValidationDashboard from '../../components/ValidationDashboard';
import { validationSlice } from '../../redux/validationSlice';

// Mock large dataset
const generateLargeDataset = (size) => {
  const dataset = [];
  for (let i = 1; i <= size; i++) {
    dataset.push({
      id: i,
      invoiceNumber: `INV-${i.toString().padStart(6, '0')}`,
      date: new Date(2024, 0, (i % 28) + 1).toISOString(),
      customer: `Customer ${String.fromCharCode(65 + (i % 26))}`,
      amount: parseFloat((Math.random() * 1000).toFixed(2)),
      tax: parseFloat((Math.random() * 200).toFixed(2)),
      total: 0, // Will be calculated
      discrepancies: Math.random() > 0.7 ? ['tax-mismatch'] : [],
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
    });
  }
  
  // Calculate totals
  dataset.forEach(item => {
    item.total = item.amount + item.tax;
  });
  
  return dataset;
};

describe('Large Dataset Performance Tests', () => {
  let store;
  
  beforeEach(() => {
    store = configureStore({
      reducer: {
        validation: validationSlice.reducer
      }
    });
  });

  it('handles 1000 invoices within performance threshold', async () => {
    const startTime = performance.now();
    const largeDataset = generateLargeDataset(1000);
    const generationTime = performance.now() - startTime;
    
    // Dataset generation should be fast (< 100ms)
    expect(generationTime).toBeLessThan(100);
    
    // Test data processing
    const processingStartTime = performance.now();
    
    store.dispatch({
      type: 'validation/setResults',
      payload: largeDataset
    });
    
    const processingTime = performance.now() - processingStartTime;
    
    // Redux state update should be fast (< 50ms)
    expect(processingTime).toBeLessThan(50);
    
    // Test component rendering performance
    const renderStartTime = performance.now();
    
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );
    
    const renderTime = performance.now() - renderStartTime;
    
    // Initial render should complete within 500ms
    expect(renderTime).toBeLessThan(500);
    
    // Verify data is displayed
    await waitFor(() => {
      expect(screen.getByTestId('total-invoices')).toHaveTextContent('1000');
    }, { timeout: 1000 });
  });

  it('handles 5000 invoices with acceptable performance', async () => {
    const largeDataset = generateLargeDataset(5000);
    
    const startTime = performance.now();
    
    store.dispatch({
      type: 'validation/setResults',
      payload: largeDataset
    });
    
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('total-invoices')).toHaveTextContent('5000');
    }, { timeout: 3000 });
    
    const totalTime = performance.now() - startTime;
    
    // Should handle 5000 records within 3 seconds
    expect(totalTime).toBeLessThan(3000);
  });

  it('memory usage stays within acceptable limits', async () => {
    const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    
    // Process multiple large datasets sequentially
    for (let i = 0; i < 5; i++) {
      const dataset = generateLargeDataset(1000);
      
      store.dispatch({
        type: 'validation/setResults',
        payload: dataset
      });
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
    
    const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (< 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });

  it('pagination performance with large datasets', async () => {
    const largeDataset = generateLargeDataset(10000);
    
    store.dispatch({
      type: 'validation/setResults',
      payload: largeDataset
    });
    
    const { rerender } = render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );
    
    // Test pagination navigation performance
    const paginationStartTime = performance.now();
    
    // Simulate page changes
    for (let page = 1; page <= 10; page++) {
      store.dispatch({
        type: 'validation/setCurrentPage',
        payload: page
      });
      
      rerender(
        <Provider store={store}>
          <ValidationDashboard />
        </Provider>
      );
    }
    
    const paginationTime = performance.now() - paginationStartTime;
    
    // Pagination should be responsive (< 200ms for 10 page changes)
    expect(paginationTime).toBeLessThan(200);
  });

  it('filtering performance with large datasets', async () => {
    const largeDataset = generateLargeDataset(5000);
    
    store.dispatch({
      type: 'validation/setResults',
      payload: largeDataset
    });
    
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );
    
    // Test filtering performance
    const filterStartTime = performance.now();
    
    // Apply severity filter
    store.dispatch({
      type: 'validation/setFilter',
      payload: { type: 'severity', value: 'high' }
    });
    
    const filterTime = performance.now() - filterStartTime;
    
    // Filtering should be fast (< 100ms)
    expect(filterTime).toBeLessThan(100);
    
    // Verify filtered results
    await waitFor(() => {
      const filteredCount = screen.getByTestId('filtered-count');
      expect(parseInt(filteredCount.textContent)).toBeLessThan(5000);
    });
  });

  it('sorting performance with large datasets', async () => {
    const largeDataset = generateLargeDataset(3000);
    
    store.dispatch({
      type: 'validation/setResults',
      payload: largeDataset
    });
    
    render(
      <Provider store={store}>
        <ValidationDashboard />
      </Provider>
    );
    
    // Test sorting performance
    const sortStartTime = performance.now();
    
    // Sort by amount (descending)
    store.dispatch({
      type: 'validation/setSorting',
      payload: { field: 'amount', direction: 'desc' }
    });
    
    const sortTime = performance.now() - sortStartTime;
    
    // Sorting should be reasonably fast (< 200ms)
    expect(sortTime).toBeLessThan(200);
  });

  it('export performance with large datasets', async () => {
    const largeDataset = generateLargeDataset(2000);
    
    // Mock export function
    const mockExport = vi.fn().mockImplementation((data) => {
      // Simulate export processing time
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(`Exported ${data.length} records`);
        }, data.length * 0.1); // 0.1ms per record
      });
    });
    
    const exportStartTime = performance.now();
    const result = await mockExport(largeDataset);
    const exportTime = performance.now() - exportStartTime;
    
    // Export should complete within reasonable time (< 1 second for 2000 records)
    expect(exportTime).toBeLessThan(1000);
    expect(result).toBe('Exported 2000 records');
  });
});