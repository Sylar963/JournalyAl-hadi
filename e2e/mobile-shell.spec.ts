import { test, expect } from '@playwright/test';

test('mobile shell stays within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');

  await expect(page.getByRole('button', { name: 'New Entry' })).toBeVisible();
  await expect(page.getByRole('button', { name: /journal/i }).first()).toBeVisible();

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasHorizontalOverflow).toBe(false);
});
