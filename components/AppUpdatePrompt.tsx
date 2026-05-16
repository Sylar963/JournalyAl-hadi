import React, { useEffect, useState } from 'react';
import { useI18n } from '../hooks/useI18n';

interface AppUpdatePromptProps {
  enabled?: boolean;
  currentVersion?: string;
  pollIntervalMs?: number;
  onReload?: () => void;
}

interface VersionPayload {
  version?: string;
}

const DEFAULT_POLL_INTERVAL_MS = 60_000;

const AppUpdatePrompt: React.FC<AppUpdatePromptProps> = ({
  enabled = import.meta.env.PROD,
  currentVersion = __APP_VERSION__,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  onReload = () => window.location.reload(),
}) => {
  const { t } = useI18n();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!enabled || updateAvailable) {
      return;
    }

    let isDisposed = false;

    const checkForUpdate = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as VersionPayload;
        if (!isDisposed && payload.version && payload.version !== currentVersion) {
          setUpdateAvailable(true);
        }
      } catch {
        // Ignore transient network failures and try again on the next poll.
      }
    };

    void checkForUpdate();

    const intervalId = window.setInterval(() => {
      void checkForUpdate();
    }, pollIntervalMs);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isDisposed = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentVersion, enabled, pollIntervalMs, updateAvailable]);

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 top-4 z-[80] flex justify-center pointer-events-none">
      <div
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-[var(--panel-border-strong)] bg-[color:var(--surface-1)]/95 p-4 shadow-[0_18px_48px_rgba(0,0,0,0.35)] backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent-primary)] shadow-[0_0_14px_var(--accent-primary)]" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
              {t('update.banner.badge')}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
              {t('update.banner.title')}
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t('update.banner.body')}
            </p>
          </div>
          <button
            type="button"
            onClick={onReload}
            className="shrink-0 rounded-xl border border-[var(--panel-border-strong)] bg-[var(--surface-3)] px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition-colors hover:bg-[var(--surface-2)]"
          >
            {t('update.banner.reload')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppUpdatePrompt;
