import { test, expect } from '@playwright/test';

test.describe('Multi-User and Concurrent Access', () => {
  test('concurrent validation sessions', async ({ browser }) => {
    // Create multiple browser contexts for different users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    // Setup different users
    await page1.goto('/');
    await page1.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 1, name: 'User 1', role: 'validator' },
        isAuthenticated: true
      }));
    });
    await page1.reload();

    await page2.goto('/');
    await page2.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 2, name: 'User 2', role: 'validator' },
        isAuthenticated: true
      }));
    });
    await page2.reload();

    await page3.goto('/');
    await page3.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 3, name: 'User 3', role: 'manager' },
        isAuthenticated: true
      }));
    });
    await page3.reload();

    // Navigate all users to validation page
    await Promise.all([
      page1.goto('/validation'),
      page2.goto('/validation'),
      page3.goto('/validation')
    ]);

    // Simulate concurrent file uploads
    const uploadPromises = [
      page1.evaluate(() => {
        const csvContent = `Invoice Number,Date,Customer,Amount,Tax,Total
INV-U1-001,2024-01-15,Customer A,100.00,20.00,120.00
INV-U1-002,2024-01-16,Customer B,200.00,40.00,240.00`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], 'user1-invoices.csv', { type: 'text/csv' });
        
        const dt = new DataTransfer();
        dt.items.add(file);
        document.querySelector('input[type="file"]').files = dt.files;
        document.querySelector('input[type="file"]').dispatchEvent(new Event('change', { bubbles: true }));
      }),
      
      page2.evaluate(() => {
        const csvContent = `Invoice Number,Date,Customer,Amount,Tax,Total
INV-U2-001,2024-01-17,Customer C,150.00,30.00,180.00
INV-U2-002,2024-01-18,Customer D,250.00,50.00,300.00`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], 'user2-invoices.csv', { type: 'text/csv' });
        
        const dt = new DataTransfer();
        dt.items.add(file);
        document.querySelector('input[type="file"]').files = dt.files;
        document.querySelector('input[type="file"]').dispatchEvent(new Event('change', { bubbles: true }));
      }),

      page3.evaluate(() => {
        const csvContent = `Invoice Number,Date,Customer,Amount,Tax,Total
INV-U3-001,2024-01-19,Customer E,300.00,60.00,360.00
INV-U3-002,2024-01-20,Customer F,400.00,80.00,480.00`;
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const file = new File([blob], 'user3-invoices.csv', { type: 'text/csv' });
        
        const dt = new DataTransfer();
        dt.items.add(file);
        document.querySelector('input[type="file"]').files = dt.files;
        document.querySelector('input[type="file"]').dispatchEvent(new Event('change', { bubbles: true }));
      })
    ];

    await Promise.all(uploadPromises);

    // Wait for all uploads to complete
    await Promise.all([
      expect(page1.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 }),
      expect(page2.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 }),
      expect(page3.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 10000 })
    ]);

    // Start concurrent validations
    await Promise.all([
      page1.click('[data-testid="start-validation"]'),
      page2.click('[data-testid="start-validation"]'),
      page3.click('[data-testid="start-validation"]')
    ]);

    // Wait for all validations to complete
    await Promise.all([
      expect(page1.locator('[data-testid="validation-complete"]')).toBeVisible({ timeout: 30000 }),
      expect(page2.locator('[data-testid="validation-complete"]')).toBeVisible({ timeout: 30000 }),
      expect(page3.locator('[data-testid="validation-complete"]')).toBeVisible({ timeout: 30000 })
    ]);

    // Verify each user sees their own results
    await expect(page1.locator('[data-testid="validation-summary"]')).toContainText('INV-U1');
    await expect(page2.locator('[data-testid="validation-summary"]')).toContainText('INV-U2');
    await expect(page3.locator('[data-testid="validation-summary"]')).toContainText('INV-U3');

    // Manager (User 3) should be able to see all validations in dashboard
    await page3.goto('/dashboard');
    await expect(page3.locator('[data-testid="active-sessions"]')).toContainText('3');

    await context1.close();
    await context2.close();
    await context3.close();
  });

  test('role-based access control in concurrent sessions', async ({ browser }) => {
    const adminContext = await browser.newContext();
    const userContext = await browser.newContext();

    const adminPage = await adminContext.newPage();
    const userPage = await userContext.newPage();

    // Setup admin user
    await adminPage.goto('/');
    await adminPage.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 1, name: 'Admin User', role: 'admin' },
        isAuthenticated: true
      }));
    });
    await adminPage.reload();

    // Setup regular user
    await userPage.goto('/');
    await userPage.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 2, name: 'Regular User', role: 'user' },
        isAuthenticated: true
      }));
    });
    await userPage.reload();

    // Admin can access user management
    await adminPage.goto('/users');
    await expect(adminPage.locator('[data-testid="user-management"]')).toBeVisible();

    // Regular user cannot access user management
    await userPage.goto('/users');
    await expect(userPage.locator('[data-testid="access-denied"]')).toBeVisible();

    // Both can access validation (but with different permissions)
    await Promise.all([
      adminPage.goto('/validation'),
      userPage.goto('/validation')
    ]);

    // Admin sees admin controls
    await expect(adminPage.locator('[data-testid="admin-controls"]')).toBeVisible();
    
    // User doesn't see admin controls
    await expect(userPage.locator('[data-testid="admin-controls"]')).not.toBeVisible();

    // Test concurrent data modification
    await adminPage.goto('/customers');
    await userPage.goto('/customers');

    // Admin adds customer
    await adminPage.click('[data-testid="add-customer"]');
    await adminPage.fill('[data-testid="customer-name"]', 'Concurrent Test Customer');
    await adminPage.click('[data-testid="save-customer"]');

    // User should see the new customer after refresh
    await userPage.reload();
    await expect(userPage.locator('[data-testid="customer-list"]')).toContainText('Concurrent Test Customer');

    // User tries to delete (should be prevented)
    await userPage.click('[data-testid="delete-customer"]');
    await expect(userPage.locator('[data-testid="permission-denied"]')).toBeVisible();

    await adminContext.close();
    await userContext.close();
  });

  test('data consistency during concurrent operations', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    // Setup both users as managers
    await Promise.all([
      page1.goto('/'),
      page2.goto('/')
    ]);

    await page1.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 1, name: 'Manager 1', role: 'manager' },
        isAuthenticated: true
      }));
    });

    await page2.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 2, name: 'Manager 2', role: 'manager' },
        isAuthenticated: true
      }));
    });

    await Promise.all([
      page1.reload(),
      page2.reload()
    ]);

    // Both navigate to products page
    await Promise.all([
      page1.goto('/products'),
      page2.goto('/products')
    ]);

    // Concurrent product additions
    await Promise.all([
      (async () => {
        await page1.click('[data-testid="add-product"]');
        await page1.fill('[data-testid="product-name"]', 'Product Manager 1');
        await page1.fill('[data-testid="product-sku"]', 'MGR1-001');
        await page1.click('[data-testid="save-product"]');
      })(),
      
      (async () => {
        await page2.click('[data-testid="add-product"]');
        await page2.fill('[data-testid="product-name"]', 'Product Manager 2');
        await page2.fill('[data-testid="product-sku"]', 'MGR2-001');
        await page2.click('[data-testid="save-product"]');
      })()
    ]);

    // Wait for both operations to complete
    await Promise.all([
      expect(page1.locator('[data-testid="success-message"]')).toBeVisible(),
      expect(page2.locator('[data-testid="success-message"]')).toBeVisible()
    ]);

    // Refresh both pages and verify data consistency
    await Promise.all([
      page1.reload(),
      page2.reload()
    ]);

    // Both pages should show both products
    await Promise.all([
      expect(page1.locator('[data-testid="product-list"]')).toContainText('Product Manager 1'),
      expect(page1.locator('[data-testid="product-list"]')).toContainText('Product Manager 2'),
      expect(page2.locator('[data-testid="product-list"]')).toContainText('Product Manager 1'),
      expect(page2.locator('[data-testid="product-list"]')).toContainText('Product Manager 2')
    ]);

    await context1.close();
    await context2.close();
  });

  test('session management and timeout handling', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth', JSON.stringify({
        user: { id: 1, name: 'Test User', role: 'user' },
        isAuthenticated: true,
        sessionExpiry: Date.now() + 5000 // 5 seconds from now
      }));
    });
    await page.reload();

    // Start a validation process
    await page.goto('/validation');
    
    // Upload file
    await page.evaluate(() => {
      const csvContent = `Invoice Number,Date,Customer,Amount,Tax,Total
INV-001,2024-01-15,Customer A,100.00,20.00,120.00`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'test.csv', { type: 'text/csv' });
      
      const dt = new DataTransfer();
      dt.items.add(file);
      document.querySelector('input[type="file"]').files = dt.files;
      document.querySelector('input[type="file"]').dispatchEvent(new Event('change', { bubbles: true }));
    });

    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

    // Wait for session to expire
    await page.waitForTimeout(6000);

    // Try to start validation (should redirect to login)
    await page.click('[data-testid="start-validation"]');
    await expect(page.locator('[data-testid="session-expired"]')).toBeVisible();

    // Verify redirect to login
    await expect(page).toHaveURL('/login');

    await context.close();
  });
});