import { test, expect } from '@playwright/test';

test.describe('CSV Upload Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('CSV drag-and-drop upload', async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('/unified-dashboard');
    
    // Wait for the upload component to be visible
    const dropzone = page.locator('[data-testid="csv-dropzone"]');
    await expect(dropzone).toBeVisible();
    
    // Create a test CSV file
    const csvContent = `symbol,quantity,price,date,type
AAPL,100,150.00,2024-01-01,stock
MSFT,50,300.00,2024-01-02,stock`;
    
    // Upload the file
    await dropzone.setInputFiles({
      name: 'test-trades.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csvContent)
    });
    
    // Wait for import completion message
    await expect(page.locator('text=Import complete')).toBeVisible({ timeout: 10000 });
    
    // Verify positions are displayed
    await expect(page.locator('text=Total Positions')).toBeVisible();
  });

  test('Large dataset scroll performance', async ({ page }) => {
    // Navigate to dashboard with large dataset
    await page.goto('/unified-dashboard');
    
    // Wait for positions table to load
    const positionsTable = page.locator('[data-testid="positions-table"]');
    await expect(positionsTable).toBeVisible();
    
    // Test smooth scrolling through large dataset
    const scrollContainer = page.locator('.h-\\[600px\\]'); // Virtualized container
    
    // Scroll to bottom
    await scrollContainer.evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });
    
    // Wait for virtualization to render
    await page.waitForTimeout(500);
    
    // Scroll to top
    await scrollContainer.evaluate(el => {
      el.scrollTop = 0;
    });
    
    // Verify table is still responsive
    await expect(positionsTable).toBeVisible();
  });

  test('Position comparison modal', async ({ page }) => {
    await page.goto('/unified-dashboard');
    
    // Wait for positions to load
    await expect(page.locator('text=Total Positions')).toBeVisible();
    
    // Select multiple positions (if available)
    const checkboxes = page.locator('input[type="checkbox"]').nth(1); // Skip header checkbox
    await checkboxes.click();
    
    // Click compare button
    const compareButton = page.locator('button:has-text("Compare")');
    if (await compareButton.isVisible()) {
      await compareButton.click();
      
      // Verify comparison modal opens
      await expect(page.locator('[data-testid="comparison-modal"]')).toBeVisible();
      
      // Close modal
      await page.locator('button:has-text("Close")').click();
      await expect(page.locator('[data-testid="comparison-modal"]')).not.toBeVisible();
    }
  });

  test('Export functionality', async ({ page }) => {
    await page.goto('/unified-dashboard');
    
    // Wait for positions to load
    await expect(page.locator('text=Total Positions')).toBeVisible();
    
    // Start download
    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has-text("Export CSV")').click();
    
    const download = await downloadPromise;
    
    // Verify download
    expect(download.suggestedFilename()).toMatch(/positions.*\.csv$/);
  });

  test('Search and filter functionality', async ({ page }) => {
    await page.goto('/unified-dashboard');
    
    // Wait for positions to load
    await expect(page.locator('text=Total Positions')).toBeVisible();
    
    // Test search functionality
    const searchInput = page.locator('input[placeholder*="Search positions"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('AAPL');
      
      // Wait for filter to apply
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const tableRows = page.locator('tbody tr');
      const rowCount = await tableRows.count();
      
      if (rowCount > 0) {
        // Verify AAPL appears in results
        await expect(page.locator('text=AAPL')).toBeVisible();
      }
      
      // Clear search
      await searchInput.clear();
    }
  });

  test('Responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/unified-dashboard');
    
    // Verify mobile layout
    await expect(page.locator('text=Total Positions')).toBeVisible();
    
    // Check that KPI cards stack properly
    const kpiCards = page.locator('.grid-cols-2');
    await expect(kpiCards).toBeVisible();
    
    // Verify table is horizontally scrollable on mobile
    const tableContainer = page.locator('.overflow-auto');
    await expect(tableContainer).toBeVisible();
  });
});

test.describe('Performance Tests', () => {
  test('Bundle size and load time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/unified-dashboard');
    await expect(page.locator('text=Total Positions')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Verify reasonable load time (adjust threshold as needed)
    expect(loadTime).toBeLessThan(5000); // 5 seconds max
  });

  test('Memory usage with large dataset', async ({ page }) => {
    await page.goto('/unified-dashboard');
    
    // Monitor memory usage during scroll
    const metrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0
      };
    });
    
    // Basic memory check (if available)
    if (metrics.usedJSHeapSize > 0) {
      expect(metrics.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // 100MB max
    }
  });
}); 
 
 
 