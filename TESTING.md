# Testing Guide - Invoice Validation System

This document provides comprehensive information about the testing strategy, setup, and execution for the Invoice Validation System.

## Testing Strategy

Our testing approach covers multiple layers to ensure system reliability, performance, and user experience:

### 1. Unit Tests
- **Location**: `src/__tests__/unit/`
- **Purpose**: Test individual components, utilities, and Redux slices
- **Framework**: Vitest + React Testing Library
- **Coverage**: Core business logic, validation algorithms, data transformations

### 2. Integration Tests  
- **Location**: `src/__tests__/integration/`
- **Purpose**: Test component interactions and data flow
- **Framework**: Vitest + React Testing Library
- **Coverage**: File processing workflows, validation pipelines, authentication flows

### 3. End-to-End Tests
- **Location**: `src/__tests__/e2e/`
- **Purpose**: Test complete user journeys and workflows
- **Framework**: Playwright
- **Coverage**: Full application workflows, multi-user scenarios, cross-browser compatibility

### 4. Performance Tests
- **Location**: `src/__tests__/performance/`
- **Purpose**: Validate system performance under various loads
- **Framework**: Vitest + Custom benchmarking utilities
- **Coverage**: Large dataset handling, memory usage, concurrent operations

## Test Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers (for E2E tests)
npx playwright install
```

### Environment Configuration

The testing environment is configured through:
- `vitest.config.js` - Unit and integration tests
- `vitest.performance.config.js` - Performance tests  
- `playwright.config.js` - End-to-end tests

## Running Tests

### Quick Commands

```bash
# Run all unit/integration tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run all E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run performance tests
npm run test:performance

# Run all test suites
npm run test:all
```

### Comprehensive Test Runner

Use the custom test runner for detailed reporting:

```bash
# Run all test suites with detailed reporting
node src/__tests__/test-runner.js

# Run specific test suites
node src/__tests__/test-runner.js unit e2e
node src/__tests__/test-runner.js performance

# Show available options
node src/__tests__/test-runner.js --help
```

## Test Categories

### End-to-End Test Suites

#### 1. Invoice Validation Workflow (`invoice-validation-workflow.spec.js`)
- Complete file upload to validation pipeline
- Large file processing (1000+ invoices)
- Error handling and recovery
- Export functionality

#### 2. Master Data Management (`master-data-management.spec.js`)
- Customer CRUD operations
- Product management workflows
- Data import/export functionality
- Validation and rollback scenarios

#### 3. Report Generation (`report-generation.spec.js`)
- Report creation and customization
- Export in multiple formats (PDF, Excel)
- Scheduled report functionality
- Large dataset export performance

#### 4. Multi-User Scenarios (`multi-user-concurrent.spec.js`)
- Concurrent validation sessions
- Role-based access control
- Data consistency during concurrent operations
- Session management and timeouts

### Performance Test Suites

#### 1. Large Dataset Handling (`large-dataset-handling.test.js`)
- Processing 1000+ invoice records
- Memory usage optimization
- Pagination and filtering performance
- Export performance with large datasets

#### 2. Memory Usage (`memory-usage.test.js`)
- Memory leak detection
- Component lifecycle memory management
- Large file processing memory efficiency
- Concurrent processing memory isolation

#### 3. Concurrent Validation (`concurrent-validation.test.js`)
- Multiple simultaneous validation sessions
- Queue management under load
- Error handling in concurrent scenarios
- Resource scaling validation

#### 4. Benchmarking (`benchmarking.test.js`)
- CSV parsing performance benchmarks
- Validation engine throughput testing
- UI rendering performance
- End-to-end workflow benchmarks

## Performance Thresholds

The system maintains the following performance standards:

### File Processing
- CSV parsing: < 0.5ms per record
- Memory usage: < 1KB per record
- Large file upload: < 30 seconds for 5000 records

### Validation Engine
- Throughput: > 50 records per second
- Memory increase: < 10MB per batch
- Batch processing: < 2 seconds per 1000 records

### UI Performance
- Initial render: < 500ms
- Component rendering: < 2ms per item
- Page navigation: < 200ms

### Concurrent Operations
- Multiple sessions: < 3 seconds total
- Queue processing: < 2 seconds
- Memory isolation: < 15MB increase

## Test Data and Fixtures

### Test Fixtures
- `src/__tests__/fixtures/test-invoices.csv` - Sample invoice data
- `src/__tests__/fixtures/large-invoices.csv` - Large dataset sample

### Generated Test Data
The performance tests use dynamically generated data:
- Invoice records with configurable complexity
- Customer and product datasets
- Validation results with configurable error rates

## Continuous Integration

### GitHub Actions Integration
```yaml
# Example CI configuration
- name: Run Tests
  run: |
    npm run test:run
    npm run test:e2e
    npm run test:performance
```

### Test Reporting
- JSON reports generated in `test-results.json`
- Playwright HTML reports for E2E tests
- Performance metrics logged to console

## Debugging Tests

### E2E Test Debugging
```bash
# Run with headed browser
npx playwright test --headed

# Run with debug mode
npx playwright test --debug

# Run specific test file
npx playwright test invoice-validation-workflow.spec.js
```

### Performance Test Debugging
```bash
# Run with detailed logging
npm run test:performance -- --reporter=verbose

# Run specific performance test
npx vitest run src/__tests__/performance/memory-usage.test.js
```

## Best Practices

### Writing Tests
1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow the AAA pattern
3. **Test Isolation**: Ensure tests don't depend on each other
4. **Mock External Dependencies**: Use mocks for external services
5. **Performance Assertions**: Include performance expectations

### Test Data Management
1. **Use Fixtures**: For consistent test data
2. **Generate Dynamic Data**: For performance tests
3. **Clean Up**: Ensure proper cleanup after tests
4. **Realistic Data**: Use data that reflects real usage

### Performance Testing
1. **Baseline Measurements**: Establish performance baselines
2. **Multiple Iterations**: Run performance tests multiple times
3. **Memory Monitoring**: Track memory usage patterns
4. **Threshold Validation**: Assert against performance thresholds

## Troubleshooting

### Common Issues

#### E2E Tests Failing
- Ensure development server is running (`npm run dev`)
- Check browser compatibility
- Verify test data and fixtures exist

#### Performance Tests Inconsistent
- Run tests multiple times for averages
- Ensure system resources are available
- Check for background processes affecting performance

#### Memory Tests Failing
- Enable garbage collection in test environment
- Increase test timeouts for large datasets
- Monitor system memory availability

### Getting Help
- Check test logs and error messages
- Review test configuration files
- Consult the test runner output for detailed information

## Contributing

When adding new tests:
1. Follow existing test patterns and structure
2. Add appropriate performance assertions
3. Update this documentation for new test categories
4. Ensure tests pass in CI environment

For questions or issues with testing, please refer to the project documentation or create an issue in the repository.