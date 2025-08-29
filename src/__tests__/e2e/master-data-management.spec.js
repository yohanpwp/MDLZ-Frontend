import { test, expect } from '@playwright/test';

test.describe('Master Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 1, name: 'Test Admin', role: 'admin' },
        isAuthenticated: true
      }));
    });
    await page.reload();
  });

  test('customer management workflow', async ({ page }) => {
    // Navigate to customers page
    await page.click('[data-testid="nav-customers"]');
    await expect(page).toHaveURL('/customers');

    // Add new customer
    await page.click('[data-testid="add-customer"]');
    await page.fill('[data-testid="customer-name"]', 'Test Customer Ltd');
    await page.fill('[data-testid="customer-email"]', 'test@customer.com');
    await page.fill('[data-testid="customer-phone"]', '+1234567890');
    await page.fill('[data-testid="customer-address"]', '123 Test Street, Test City');
    
    await page.click('[data-testid="save-customer"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Search for customer
    await page.fill('[data-testid="customer-search"]', 'Test Customer');
    await expect(page.locator('[data-testid="customer-row"]')).toContainText('Test Customer Ltd');

    // Edit customer
    await page.click('[data-testid="edit-customer"]');
    await page.fill('[data-testid="customer-name"]', 'Updated Customer Ltd');
    await page.click('[data-testid="save-customer"]');
    await expect(page.locator('[data-testid="customer-row"]')).toContainText('Updated Customer Ltd');

    // Delete customer
    await page.click('[data-testid="delete-customer"]');
    await page.click('[data-testid="confirm-delete"]');
    await expect(page.locator('[data-testid="customer-row"]')).not.toBeVisible();
  });

  test('product management workflow', async ({ page }) => {
    await page.goto('/products');

    // Add new product
    await page.click('[data-testid="add-product"]');
    await page.fill('[data-testid="product-name"]', 'Test Product');
    await page.fill('[data-testid="product-sku"]', 'TEST-001');
    await page.fill('[data-testid="product-price"]', '99.99');
    await page.selectOption('[data-testid="product-category"]', 'electronics');
    
    await page.click('[data-testid="save-product"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Filter products by category
    await page.selectOption('[data-testid="category-filter"]', 'electronics');
    await expect(page.locator('[data-testid="product-row"]')).toContainText('Test Product');

    // Bulk import products
    await page.click('[data-testid="import-products"]');
    
    await page.evaluate(() => {
      const csvContent = `Name,SKU,Price,Category
Product A,PROD-A,50.00,electronics
Product B,PROD-B,75.00,software
Product C,PROD-C,25.00,accessories`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'products.csv', { type: 'text/csv' });
      
      const dt = new DataTransfer();
      dt.items.add(file);
      document.querySelector('[data-testid="import-file"]').files = dt.files;
      document.querySelector('[data-testid="import-file"]').dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.click('[data-testid="confirm-import"]');
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible({ timeout: 10000 });

    // Verify imported products
    await expect(page.locator('[data-testid="product-count"]')).toContainText('4'); // 1 + 3 imported
  });

  test('data export functionality', async ({ page }) => {
    await page.goto('/export-data');

    // Export customers
    await page.check('[data-testid="export-customers"]');
    await page.selectOption('[data-testid="export-format"]', 'excel');
    
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="start-export"]');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/customers.*\.xlsx/);

    // Export with date range filter
    await page.fill('[data-testid="date-from"]', '2024-01-01');
    await page.fill('[data-testid="date-to"]', '2024-12-31');
    await page.check('[data-testid="export-products"]');
    
    const filteredDownloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="start-export"]');
    const filteredDownload = await filteredDownloadPromise;
    expect(filteredDownload.suggestedFilename()).toMatch(/export.*\.xlsx/);
  });

  test('data import validation and rollback', async ({ page }) => {
    await page.goto('/import-data');

    // Import invalid data
    await page.evaluate(() => {
      const invalidCsv = `Name,Email,Phone
Invalid Customer,invalid-email,invalid-phone
,missing-name@test.com,123456789`;
      
      const blob = new Blob([invalidCsv], { type: 'text/csv' });
      const file = new File([blob], 'invalid-customers.csv', { type: 'text/csv' });
      
      const dt = new DataTransfer();
      dt.items.add(file);
      document.querySelector('[data-testid="import-file"]').files = dt.files;
      document.querySelector('[data-testid="import-file"]').dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Check validation errors
    await expect(page.locator('[data-testid="validation-errors"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-count"]')).toContainText(/2/);

    // Fix errors and retry
    await page.click('[data-testid="fix-errors"]');
    await page.fill('[data-testid="fix-email-0"]', 'valid@email.com');
    await page.fill('[data-testid="fix-name-1"]', 'Valid Customer');
    
    await page.click('[data-testid="retry-import"]');
    await expect(page.locator('[data-testid="import-success"]')).toBeVisible();

    // Test rollback functionality
    await page.click('[data-testid="rollback-import"]');
    await page.click('[data-testid="confirm-rollback"]');
    await expect(page.locator('[data-testid="rollback-success"]')).toBeVisible();
  });
});