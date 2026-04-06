import { test, expect } from '@playwright/test';

test('settings shows the Bybit fallback in local mode', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /settings/i }).first().click();
  await expect(page.getByText(/Bybit import is available only in authenticated Supabase mode/i)).toBeVisible();
});
