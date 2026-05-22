import { AppBackupPayload, Theme } from '../types';
import { exportUserData, importUserData, isUsingSupabase } from './dataService';
import { routineService } from './routineService';

const THEME_STORAGE_KEY = 'emotion-journal-theme';

function readThemePreference(): Theme | undefined {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    if (theme === 'insilico' || theme === 'cscalp' || theme === 'bloomberg') {
      return theme;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

function writeThemePreference(theme?: Theme) {
  if (!theme) return;

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore unavailable storage in private browsing contexts.
  }
}

export async function createAppBackup(): Promise<AppBackupPayload> {
  const data = await exportUserData();

  return {
    version: 1,
    appVersion: __APP_VERSION__,
    exportedAt: new Date().toISOString(),
    source: isUsingSupabase ? 'supabase' : 'local',
    data,
    preferences: {
      theme: readThemePreference(),
    },
    routines: routineService.exportLayouts(),
  };
}

export function isAppBackupPayload(value: unknown): value is AppBackupPayload {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<AppBackupPayload>;
  return candidate.version === 1 && !!candidate.data && typeof candidate.exportedAt === 'string';
}

export async function restoreAppBackup(backup: AppBackupPayload): Promise<void> {
  if (!isAppBackupPayload(backup)) {
    throw new Error('This backup file is not valid for Delta Journal.');
  }

  await importUserData(backup.data);
  routineService.replaceAllLayouts(backup.routines ?? {});
  writeThemePreference(backup.preferences?.theme);
}
