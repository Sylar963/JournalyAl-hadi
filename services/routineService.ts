import { RoutineLayout } from '../types';

const STORAGE_KEY_PREFIX = 'journaly_routine_';

function getPrimaryStore(): Storage {
  return localStorage;
}

function getLegacyStore(): Storage {
  return sessionStorage;
}

function getStoredValue(key: string): string | null {
  const stored = getPrimaryStore().getItem(key);
  if (stored !== null) {
    return stored;
  }

  const legacyStored = getLegacyStore().getItem(key);
  if (legacyStored !== null) {
    getPrimaryStore().setItem(key, legacyStored);
  }

  return legacyStored;
}

export const routineService = {
  getLayout: (date: string): RoutineLayout | null => {
    try {
      const stored = getStoredValue(`${STORAGE_KEY_PREFIX}${date}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load routine layout', error);
      return null;
    }
  },

  saveLayout: (date: string, layout: RoutineLayout): void => {
    try {
      getPrimaryStore().setItem(`${STORAGE_KEY_PREFIX}${date}`, JSON.stringify(layout));
    } catch (error) {
      console.error('Failed to save routine layout', error);
    }
  },

  // Helper to maintain "Previous Day's Layout" as a template for today
  getLastKnownLayout: (): RoutineLayout | null => {
     try {
       // Naive implementation: iterate keys or store a separate 'template' key
       // For now, we'll store a dedicated 'template' key whenever a layout is saved
       const template = getStoredValue(`${STORAGE_KEY_PREFIX}template`);
       return template ? JSON.parse(template) : null; 
     } catch (error) {
       return null;
     }
  },

  saveTemplate: (layout: RoutineLayout): void => {
    try {
        getPrimaryStore().setItem(`${STORAGE_KEY_PREFIX}template`, JSON.stringify(layout));
    } catch (error) {
        console.error('Failed to save routine template', error);
    }
  }
};
