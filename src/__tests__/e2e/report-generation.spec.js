import { test, expect } from '@playwright/test';

test.describe('Report Generation and Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 1, name: 'Test User', role: 'manager' },
        isAuthenticated: true
      }));
      
      // Mock validation data for reports
      localStorage.setItem('validationResults', JSON.stringify([
        {
          id: 1,
          invoiceNumber: 'INV-001',
          discrepancies: ['tax-mismatch'],
          severity: 'high',
          date: '2024-01-15'
        },
        {
          id: 2,
          invoiceNumber: 'INV-002',
          discrepancies: ['amount-mismatch'],
          severity: 'medium',
          date: '2024-01-16'
        }
      ]));
    });
    await page.reload();
  });

  test('generate validation summary report', async ({ page }) => {
    await page.goto('/reports');

    // Select report type
    await page.selectOption('[data-testid="report-type"]', 'validation-summary');
    
    // Set date range
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-01-31');

    // Configure report options
    await page.check('[data-testid="include-charts"]');
    await page.check('[data-testid="include-details"]');
    await page.selectOption('[data-testid="group-by"]', 'severity');

    // Generate report preview
    await page.click('[data-testid="generate-preview"]');
    await expect(page.locator('[data-testid="report-preview"]')).toBeVisible({ timeout: 10000 });

    // Verify report content
    await expect(page.locator('[data-testid="total-invoices"]')).toContainText('2');
    await expect(page.locator('[data-testid="high-severity"]')).toContainText('1');
    await expect(page.locator('[data-testid="medium-severity"]')).toContainText('1');

    // Export as PDF
    const pdfDownloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf"]');
    const pdfDownload = await pdfDownloadPromise;
    expect(pdfDownload.suggestedFilename()).toMatch(/validation-summary.*\.pdf/);

    // Export as Excel
    const excelDownloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-excel"]');
    const excelDownload = await excelDownloadPromise;
    expect(excelDownload.suggestedFilename()).toMatch(/validation-summary.*\.xlsx/);
  });

  test('generate discrepancy analysis report', async ({ page }) => {
    await page.goto('/reports');

    await page.selectOption('[data-testid="report-type"]', 'discrepancy-analysis');
    
    // Filter by discrepancy type
    await page.selectOption('[data-testid="discrepancy-filter"]', 'tax-mismatch');
    
    // Set severity filter
    await page.selectOption('[data-testid="severity-filter"]', 'high');

    await page.click('[data-testid="generate-preview"]');
    await expect(page.locator('[data-testid="report-preview"]')).toBeVisible();

    // Verify filtered results
    await expect(page.locator('[data-testid="filtered-count"]')).toContainText('1');
    await expect(page.locator('[data-testid="discrepancy-chart"]')).toBeVisible();

    // Test drill-down functionality
    await page.click('[data-testid="drill-down-tax-mismatch"]');
    await expect(page.locator('[data-testid="detailed-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoice-details"]')).toContainText('INV-001');
  });

  test('schedule automated reports', async ({ page }) => {
    await page.goto('/reports/schedule');

    // Create new scheduled report
    await page.click('[data-testid="create-schedule"]');
    await page.fill('[data-testid="schedule-name"]', 'Weekly Validation Report');
    await page.selectOption('[data-testid="report-type"]', 'validation-summary');
    await page.selectOption('[data-testid="frequency"]', 'weekly');
    await page.selectOption('[data-testid="day-of-week"]', 'monday');
    await page.fill('[data-testid="time"]', '09:00');

    // Add recipients
    await page.fill('[data-testid="recipients"]', 'manager@company.com,admin@company.com');
    
    // Set report format
    await page.selectOption('[data-testid="format"]', 'pdf');

    await page.click('[data-testid="save-schedule"]');
    await expect(page.locator('[data-testid="schedule-success"]')).toBeVisible();

    // Verify schedule appears in list
    await expect(page.locator('[data-testid="schedule-list"]')).toContainText('Weekly Validation Report');

    // Test schedule modification
    await page.click('[data-testid="edit-schedule"]');
    await page.selectOption('[data-testid="frequency"]', 'daily');
    await page.click('[data-testid="save-schedule"]');
    await expect(page.locator('[data-testid="schedule-updated"]')).toBeVisible();
  });

  test('export large datasets performance', async ({ page }) => {
    await page.goto('/reports');

    // Mock large dataset
    await page.evaluate(() => {
      const largeDataset = [];
      for (let i = 1; i <= 5000; i++) {
        largeDataset.push({
          id: i,
          invoiceNumber: `INV-${i.toString().padStart(4, '0')}`,
          discrepancies: ['tax-mismatch', 'amount-mismatch'][i % 2],
          severity: ['high', 'medium', 'low'][i % 3],
          date: `2024-01-${(i % 28 + 1).toString().padStart(2, '0')}`
        });
      }
      localStorage.setItem('validationResults', JSON.stringify(largeDataset));
    });

    await page.selectOption('[data-testid="report-type"]', 'detailed-export');
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-01-31');

    // Monitor export performance
    const startTime = Date.now();
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-excel"]');
    
    // Check progress indicator
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible();
    
    const download = await downloadPromise;
    const exportTime = Date.now() - startTime;

    // Verify export completes within reasonable time (< 30 seconds for 5000 records)
    expect(exportTime).toBeLessThan(30000);
    expect(download.suggestedFilename()).toMatch(/detailed-export.*\.xlsx/);

    // Verify progress completion
    await expect(page.locator('[data-testid="export-complete"]')).toBeVisible();
  });

  test('report customization and templates', async ({ page }) => {
    await page.goto('/reports/templates');

    // Create custom template
    await page.click('[data-testid="create-template"]');
    await page.fill('[data-testid="template-name"]', 'Custom Validation Template');
    
    // Configure template sections
    await page.check('[data-testid="include-executive-summary"]');
    await page.check('[data-testid="include-trend-analysis"]');
    await page.check('[data-testid="include-recommendations"]');
    
    // Customize chart types
    await page.selectOption('[data-testid="chart-type-severity"]', 'pie');
    await page.selectOption('[data-testid="chart-type-trends"]', 'line');

    // Set branding options
    await page.fill('[data-testid="company-logo-url"]', '/assets/company-logo.png');
    await page.fill('[data-testid="report-footer"]', 'Confidential - Internal Use Only');

    await page.click('[data-testid="save-template"]');
    await expect(page.locator('[data-testid="template-saved"]')).toBeVisible();

    // Use custom template for report generation
    await page.goto('/reports');
    await page.selectOption('[data-testid="template"]', 'Custom Validation Template');
    await page.click('[data-testid="generate-preview"]');

    // Verify custom elements appear
    await expect(page.locator('[data-testid="executive-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="trend-analysis"]')).toBeVisible();
    await expect(page.locator('[data-testid="pie-chart"]')).toBeVisible();
  });
});