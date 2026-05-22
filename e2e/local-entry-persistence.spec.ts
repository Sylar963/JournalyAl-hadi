import { test, expect } from '@playwright/test';

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

test('local mode persists a saved entry across reloads', async ({ page }) => {
  const todayKey = getTodayKey();

  await page.goto('/');
  await page.getByRole('button', { name: /log confident/i }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/notes/i).fill('Persistence test entry');
  await dialog.getByRole('button', { name: /^save$/i }).click();
  await expect(page.getByText(/entry saved/i)).toBeVisible();

  await page.waitForTimeout(2200);

  const storedEntry = await page.evaluate((dateKey) => {
    const raw = localStorage.getItem('emotion-journal-entries');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed[dateKey] ?? null;
  }, todayKey);

  expect(storedEntry).toMatchObject({
    emotion: 'confident',
    notes: 'Persistence test entry',
  });

  await page.reload();

  const reloadedEntry = await page.evaluate((dateKey) => {
    const raw = localStorage.getItem('emotion-journal-entries');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed[dateKey] ?? null;
  }, todayKey);

  expect(reloadedEntry).toMatchObject({
    emotion: 'confident',
    notes: 'Persistence test entry',
  });
});
