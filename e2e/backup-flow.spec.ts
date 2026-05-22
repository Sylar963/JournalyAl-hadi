import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('backup export downloads current journal data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('emotion-journal-entries', JSON.stringify({
      '2026-01-02': {
        date: '2026-01-02',
        emotion: 'confident',
        intensity: 7,
        notes: 'Back up me',
        tradingData: { trades: [], pnlSource: 'manual' },
      },
    }));
  });

  await page.goto('/');
  await page.getByRole('button', { name: /settings/i }).first().click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export backup/i }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  if (!downloadPath) {
    throw new Error('Expected Playwright to provide a download path.');
  }
  const backupText = await readFile(downloadPath, 'utf8');

  const parsed = JSON.parse(backupText);
  expect(parsed.version).toBe(1);
  expect(parsed.data.entries['2026-01-02'].notes).toBe('Back up me');
});

test('backup import restores journal data and theme', async ({ page }) => {
  const backup = {
    version: 1,
    appVersion: '0.1.0',
    exportedAt: '2026-01-02T00:00:00.000Z',
    source: 'local',
    data: {
      entries: {
        '2026-01-02': {
          date: '2026-01-02',
          emotion: 'maxPain',
          intensity: 9,
          notes: 'Imported backup entry',
          tradingData: { trades: [], pnlSource: 'manual' },
        },
      },
      profile: {
        name: 'Backup User',
        alias: 'backup-user',
        journalPurpose: 'Imported purpose',
      },
      quests: [],
      reviews: [],
    },
    preferences: {
      theme: 'cscalp',
    },
    routines: {},
  };

  await page.goto('/');
  await page.getByRole('button', { name: /settings/i }).first().click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup), 'utf8'),
  });

  await expect(page.getByText(/backup imported/i)).toBeVisible();
  await page.waitForTimeout(1000);

  const restoredState = await page.evaluate(() => ({
    theme: localStorage.getItem('emotion-journal-theme'),
    entries: JSON.parse(localStorage.getItem('emotion-journal-entries') ?? '{}'),
    profile: JSON.parse(localStorage.getItem('emotion-journal-profile') ?? 'null'),
  }));

  expect(restoredState.theme).toBe('cscalp');
  expect(restoredState.entries['2026-01-02'].notes).toBe('Imported backup entry');
  expect(restoredState.profile.name).toBe('Backup User');
});
