import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import ValidationEngine from "../../services/ValidationEngine";
import { generateReport } from "../../services/ReportService";
import { parseCSV, generateTestCSV, createMockFile } from "../utils/testHelpers";

// Performance benchmarking utilities
class PerformanceBenchmark {
  constructor(name) {
    this.name = name;
    this.measurements = [];
  }

  async measure(fn, iterations = 1) {
    const results = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const startMemory = performance.memory
        ? performance.memory.usedJSHeapSize
        : 0;

      await fn();

      const endTime = performance.now();
      const endMemory = performance.memory
        ? performance.memory.usedJSHeapSize
        : 0;

      results.push({
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        iteration: i + 1,
      });
    }

    this.measurements.push(...results);
    return results;
  }

  getStats() {
    if (this.measurements.length === 0) return null;

    const durations = this.measurements.map((m) => m.duration);
    const memoryDeltas = this.measurements.map((m) => m.memoryDelta);

    return {
      duration: {
        min: Math.min(...durations),
        max: Math.max(...durations),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        median: durations.sort((a, b) => a - b)[
          Math.floor(durations.length / 2)
        ],
      },
      memory: {
        min: Math.min(...memoryDeltas),
        max: Math.max(...memoryDeltas),
        avg: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      },
      iterations: this.measurements.length,
    };
  }
}

describe("Performance Benchmarking Tests", () => {
  let validationEngine;

  beforeEach(() => {
    validationEngine = new ValidationEngine();
  });

  it("benchmarks CSV parsing performance", async () => {
    const benchmark = new PerformanceBenchmark("CSV Parsing");

    const testSizes = [100, 500, 1000, 2500, 5000];
    const results = {};

    for (const size of testSizes) {
      const csvContent = generateTestCSV(size);

      const measurements = await benchmark.measure(async () => {
        await parseCSV(csvContent);
      }, 5); // 5 iterations per size

      const stats = {
        duration: {
          avg:
            measurements.reduce((sum, m) => sum + m.duration, 0) /
            measurements.length,
          min: Math.min(...measurements.map((m) => m.duration)),
          max: Math.max(...measurements.map((m) => m.duration)),
        },
      };

      results[size] = stats;

      // Performance expectations
      expect(stats.duration.avg).toBeLessThan(size * 0.5); // < 0.5ms per record on average
    }

    // Verify linear scaling
    const sizes = Object.keys(results)
      .map(Number)
      .sort((a, b) => a - b);
    for (let i = 1; i < sizes.length; i++) {
      const currentSize = sizes[i];
      const previousSize = sizes[i - 1];
      const sizeRatio = currentSize / previousSize;
      const timeRatio =
        results[currentSize].duration.avg / results[previousSize].duration.avg;

      // Time should scale roughly linearly (within 2x of size ratio)
      expect(timeRatio).toBeLessThan(sizeRatio * 2);
    }

    console.log("CSV Parsing Benchmark Results:");
    Object.entries(results).forEach(([size, stats]) => {
      console.log(
        `  ${size} records: ${stats.duration.avg.toFixed(
          2
        )}ms avg (${stats.duration.min.toFixed(2)}-${stats.duration.max.toFixed(
          2
        )}ms)`
      );
    });
  });

  it("benchmarks validation engine performance", async () => {
    const benchmark = new PerformanceBenchmark("Validation Engine");

    const testCases = [
      { records: 100, complexity: "simple" },
      { records: 500, complexity: "simple" },
      { records: 1000, complexity: "simple" },
      { records: 100, complexity: "complex" },
      { records: 500, complexity: "complex" },
    ];

    const results = {};

    for (const testCase of testCases) {
      const { records, complexity } = testCase;
      const testData = generateValidationTestData(records, complexity);

      const measurements = await benchmark.measure(async () => {
        await validationEngine.validateBatch(testData);
      }, 3);

      const key = `${records}-${complexity}`;
      results[key] = {
        duration: {
          avg:
            measurements.reduce((sum, m) => sum + m.duration, 0) /
            measurements.length,
          min: Math.min(...measurements.map((m) => m.duration)),
          max: Math.max(...measurements.map((m) => m.duration)),
        },
        throughput:
          records /
          (measurements.reduce((sum, m) => sum + m.duration, 0) /
            measurements.length /
            1000),
      };

      // Performance expectations
      expect(results[key].throughput).toBeGreaterThan(50); // At least 50 records/second
    }

    console.log("Validation Engine Benchmark Results:");
    Object.entries(results).forEach(([key, stats]) => {
      console.log(
        `  ${key}: ${stats.duration.avg.toFixed(
          2
        )}ms avg, ${stats.throughput.toFixed(2)} records/sec`
      );
    });
  });

  it("benchmarks report generation performance", async () => {
    const benchmark = new PerformanceBenchmark("Report Generation");

    const reportTypes = ["summary", "detailed", "export"];
    const dataSizes = [100, 500, 1000];

    const results = {};

    for (const reportType of reportTypes) {
      results[reportType] = {};

      for (const dataSize of dataSizes) {
        const testData = generateReportTestData(dataSize);

        const measurements = await benchmark.measure(async () => {
          await generateReport(reportType, testData, {
            format: "json",
            includeCharts: false, // Disable charts for consistent benchmarking
          });
        }, 3);

        results[reportType][dataSize] = {
          duration: {
            avg:
              measurements.reduce((sum, m) => sum + m.duration, 0) /
              measurements.length,
            min: Math.min(...measurements.map((m) => m.duration)),
            max: Math.max(...measurements.map((m) => m.duration)),
          },
        };

        // Performance expectations based on report type
        const expectedMaxTime =
          reportType === "export" ? dataSize * 2 : dataSize * 1;
        expect(results[reportType][dataSize].duration.avg).toBeLessThan(
          expectedMaxTime
        );
      }
    }

    console.log("Report Generation Benchmark Results:");
    Object.entries(results).forEach(([reportType, sizeResults]) => {
      console.log(`  ${reportType}:`);
      Object.entries(sizeResults).forEach(([size, stats]) => {
        console.log(
          `    ${size} records: ${stats.duration.avg.toFixed(2)}ms avg`
        );
      });
    });
  });

  it("benchmarks UI rendering performance", async () => {
    const benchmark = new PerformanceBenchmark("UI Rendering");

    const testSizes = [50, 100, 200, 500];
    const results = {};

    for (const size of testSizes) {
      const testData = generateUITestData(size);

      const measurements = await benchmark.measure(async () => {
        const store = configureStore({
          reducer: {
            validation: (state = { results: testData }, action) => state,
          },
        });

        const { unmount } = render(
          <Provider store={store}>
            <div data-testid="test-container">
              {testData.map((item) => (
                <div key={item.id} data-testid={`item-${item.id}`}>
                  {item.invoiceNumber} - {item.amount}
                </div>
              ))}
            </div>
          </Provider>
        );

        // Wait for rendering to complete
        await screen.findByTestId("test-container");

        unmount();
      }, 3);

      results[size] = {
        duration: {
          avg:
            measurements.reduce((sum, m) => sum + m.duration, 0) /
            measurements.length,
          min: Math.min(...measurements.map((m) => m.duration)),
          max: Math.max(...measurements.map((m) => m.duration)),
        },
      };

      // UI rendering should be fast
      expect(results[size].duration.avg).toBeLessThan(size * 2); // < 2ms per item
    }

    console.log("UI Rendering Benchmark Results:");
    Object.entries(results).forEach(([size, stats]) => {
      console.log(`  ${size} items: ${stats.duration.avg.toFixed(2)}ms avg`);
    });
  });

  it("benchmarks end-to-end workflow performance", async () => {
    const benchmark = new PerformanceBenchmark("End-to-End Workflow");

    const workflowSizes = [100, 500, 1000];
    const results = {};

    for (const size of workflowSizes) {
      const measurements = await benchmark.measure(async () => {
        // Step 1: Generate CSV
        const csvContent = generateTestCSV(size);

        // Step 2: Parse CSV
        const parsedData = await parseCSV(csvContent);

        // Step 3: Validate data
        const validationResults = await validationEngine.validateBatch(
          parsedData
        );

        // Step 4: Generate report
        await generateReport("summary", validationResults, { format: "json" });

        // Verify workflow completed
        expect(parsedData).toHaveLength(size);
        expect(validationResults).toHaveLength(size);
      }, 3);

      results[size] = {
        duration: {
          avg:
            measurements.reduce((sum, m) => sum + m.duration, 0) /
            measurements.length,
          min: Math.min(...measurements.map((m) => m.duration)),
          max: Math.max(...measurements.map((m) => m.duration)),
        },
        throughput:
          size /
          (measurements.reduce((sum, m) => sum + m.duration, 0) /
            measurements.length /
            1000),
      };

      // End-to-end performance expectations
      expect(results[size].throughput).toBeGreaterThan(20); // At least 20 records/second end-to-end
    }

    console.log("End-to-End Workflow Benchmark Results:");
    Object.entries(results).forEach(([size, stats]) => {
      console.log(
        `  ${size} records: ${stats.duration.avg.toFixed(
          2
        )}ms avg, ${stats.throughput.toFixed(2)} records/sec`
      );
    });
  });
});

// Helper functions for generating test data

function generateValidationTestData(records, complexity) {
  const data = [];
  for (let i = 1; i <= records; i++) {
    const amount = Math.random() * 1000;
    const tax =
      complexity === "complex"
        ? amount * (0.15 + Math.random() * 0.1)
        : amount * 0.2;

    data.push({
      id: i,
      invoiceNumber: `INV-${i}`,
      date: new Date(2024, 0, (i % 28) + 1).toISOString(),
      customer: `Customer ${i % (complexity === "complex" ? 50 : 10)}`,
      amount: parseFloat(amount.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      total: parseFloat((amount + tax).toFixed(2)),
      // Add complexity with additional fields
      ...(complexity === "complex" && {
        discount: Math.random() * 0.1,
        currency: ["USD", "EUR", "GBP"][i % 3],
        paymentTerms: ["NET30", "NET60", "COD"][i % 3],
      }),
    });
  }
  return data;
}

function generateReportTestData(records) {
  return Array.from({ length: records }, (_, i) => ({
    id: i + 1,
    invoiceNumber: `INV-${i + 1}`,
    discrepancies: Math.random() > 0.7 ? ["tax-mismatch"] : [],
    severity: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
    amount: Math.random() * 1000,
    date: new Date(2024, 0, (i % 28) + 1).toISOString(),
  }));
}

function generateUITestData(records) {
  return Array.from({ length: records }, (_, i) => ({
    id: i + 1,
    invoiceNumber: `INV-${i + 1}`,
    amount: (Math.random() * 1000).toFixed(2),
    status: ["valid", "invalid", "pending"][i % 3],
  }));
}
