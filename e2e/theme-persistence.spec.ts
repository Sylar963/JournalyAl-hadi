import { test, expect } from '@playwright/test';

test('selected theme persists after reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /settings/i }).first().click();
  await page.getByRole('button', { name: /bloomberg/i }).click();

  await expect(page.getByRole('button', { name: /bloomberg/i })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('button', { name: /settings/i }).first().click();

  await expect(page.getByRole('button', { name: /bloomberg/i })).toHaveAttribute('aria-pressed', 'true');

  const savedTheme = await page.evaluate(() => localStorage.getItem('emotion-journal-theme'));
  expect(savedTheme).toBe('bloomberg');
});
