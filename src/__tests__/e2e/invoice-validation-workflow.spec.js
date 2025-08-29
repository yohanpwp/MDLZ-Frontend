import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Invoice Validation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Mock authentication for testing
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 1, name: 'Test User', role: 'admin' },
        isAuthenticated: true
      }));
    });
    await page.reload();
  });

  test('complete invoice validation workflow', async ({ page }) => {
    // Navigate to validation page
    await page.click('[data-testid="nav-validation"]');
    await expect(page).toHaveURL('/validation');

    // Upload a test file
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../../fixtures/test-invoices.csv');
    
    // Create test file content if it doesn't exist
    await page.evaluate(() => {
      const csvContent = `Invoice Number,Date,Customer,Amount,Tax,Total
INV-001,2024-01-15,Customer A,100.00,20.00,120.00
INV-002,2024-01-16,Customer B,200.00,40.00,240.00
INV-003,2024-01-17,Customer C,150.00,30.00,180.00`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test-invoices.csv', { type: 'text/csv' });
      
      // Simulate file upload
      const dt = new DataTransfer();
      dt.items.add(file);
      document.querySelector('input[type="file"]').files = dt.files;
      document.querySelector('input[type="file"]').dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Wait for file processing
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 });

    // Start validation process
    await page.click('[data-testid="start-validation"]');
    await expect(page.locator('[data-testid="validation-progress"]')).toBeVisible();

    // Wait for validation completion
    await expect(page.locator('[data-testid="validation-complete"]')).toBeVisible({ timeout: 15000 });

    // Check validation results
    await expect(page.locator('[data-testid="validation-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="discrepancy-count"]')).toContainText(/\d+/);

    // View detailed results
    await page.click('[data-testid="view-details"]');
    await expect(page.locator('[data-testid="results-table"]')).toBeVisible();

    // Filter results by discrepancy type
    await page.selectOption('[data-testid="discrepancy-filter"]', 'tax-mismatch');
    await expect(page.locator('[data-testid="filtered-results"]')).toBeVisible();

    // Export results
    await page.click('[data-testid="export-results"]');
    await page.selectOption('[data-testid="export-format"]', 'pdf');
    
    // Wait for download
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="confirm-export"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/validation-results.*\.pdf/);
  });

  test('handles large file validation', async ({ page }) => {
    await page.goto('/validation');

    // Simulate large file upload
    await page.evaluate(() => {
      // Generate large CSV content (1000+ invoices)
      let csvContent = 'Invoice Number,Date,Customer,Amount,Tax,Total\n';
      for (let i = 1; i <= 1500; i++) {
        const amount = (Math.random() * 1000).toFixed(2);
        const tax = (amount * 0.2).toFixed(2);
        const total = (parseFloat(amount) + parseFloat(tax)).toFixed(2);
        csvContent += `INV-${i.toString().padStart(4, '0')},2024-01-${(i % 28 + 1).toString().padStart(2, '0')},Customer ${String.fromCharCode(65 + (i % 26))},${amount},${tax},${total}\n`;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'large-invoices.csv', { type: 'text/csv' });
      
      const dt = new DataTransfer();
      dt.items.add(file);
      document.querySelector('input[type="file"]').files = dt.files;
      document.querySelector('input[type="file"]').dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Monitor processing performance
    const startTime = Date.now();
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });
    const uploadTime = Date.now() - startTime;

    // Ensure upload completes within reasonable time (< 30 seconds)
    expect(uploadTime).toBeLessThan(30000);

    // Start validation and monitor performance
    const validationStartTime = Date.now();
    await page.click('[data-testid="start-validation"]');
    await expect(page.locator('[data-testid="validation-complete"]')).toBeVisible({ timeout: 60000 });
    const validationTime = Date.now() - validationStartTime;

    // Ensure validation completes within reasonable time (< 60 seconds)
    expect(validationTime).toBeLessThan(60000);

    // Check memory usage indicator
    await expect(page.locator('[data-testid="memory-usage"]')).toBeVisible();
  });

  test('handles validation errors gracefully', async ({ page }) => {
    await page.goto('/validation');

    // Upload malformed file
    await page.evaluate(() => {
      const malformedContent = 'Invalid,CSV,Content\nMissing,Headers\nBad,Data,Format,Extra,Columns';
      const blob = new Blob([malformedContent], { type: 'text/csv' });
      const file = new File([blob], 'malformed.csv', { type: 'text/csv' });
      
      const dt = new DataTransfer();
      dt.items.add(file);
      document.querySelector('input[type="file"]').files = dt.files;
      document.querySelector('input[type="file"]').dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Check error handling
    await expect(page.locator('[data-testid="upload-error"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/invalid file format|parsing error/i);

    // Verify retry option is available
    await expect(page.locator('[data-testid="retry-upload"]')).toBeVisible();
  });
});