import { test, expect } from '@playwright/test';

function getTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

test('today entry can be updated and deleted', async ({ page }) => {
  const todayKey = getTodayKey();

  await page.goto('/');
  await page.getByRole('button', { name: /log confident/i }).click();
  let dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/notes/i).fill('Original entry');
  await dialog.getByRole('button', { name: /^save$/i }).click();
  await page.waitForTimeout(2200);

  await page.getByRole('button', { name: /log frustrated/i }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/notes/i).fill('Updated entry');
  await dialog.getByRole('button', { name: /^save$/i }).click();
  await page.waitForTimeout(2200);

  const updatedEntry = await page.evaluate((dateKey) => {
    const raw = localStorage.getItem('emotion-journal-entries');
    if (!raw) return null;
    return JSON.parse(raw)[dateKey] ?? null;
  }, todayKey);

  expect(updatedEntry).toMatchObject({
    emotion: 'frustrated',
    notes: 'Updated entry',
  });

  await page.getByRole('button', { name: /log frustrated/i }).click();
  dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: /^delete$/i }).click();
  await page.waitForTimeout(200);

  const deletedEntry = await page.evaluate((dateKey) => {
    const raw = localStorage.getItem('emotion-journal-entries');
    if (!raw) return null;
    return JSON.parse(raw)[dateKey] ?? null;
  }, todayKey);

  expect(deletedEntry).toBeNull();
});
