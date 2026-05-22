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

  getLastKnownLayout: (): RoutineLayout | null => {
      try {
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
  },

  exportLayouts: (): Record<string, RoutineLayout> => {
    const layouts: Record<string, RoutineLayout> = {};

    try {
      const store = getPrimaryStore();
      for (let index = 0; index < store.length; index += 1) {
        const key = store.key(index);
        if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;

        const stored = store.getItem(key);
        if (!stored) continue;

        layouts[key.slice(STORAGE_KEY_PREFIX.length)] = JSON.parse(stored) as RoutineLayout;
      }
    } catch (error) {
      console.error('Failed to export routine layouts', error);
    }

    return layouts;
  },

  replaceAllLayouts: (layouts: Record<string, RoutineLayout>): void => {
    try {
      const store = getPrimaryStore();
      const keysToDelete: string[] = [];

      for (let index = 0; index < store.length; index += 1) {
        const key = store.key(index);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach((key) => store.removeItem(key));
      Object.entries(layouts).forEach(([key, layout]) => {
        store.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(layout));
      });
    } catch (error) {
      console.error('Failed to import routine layouts', error);
    }
  }
};
