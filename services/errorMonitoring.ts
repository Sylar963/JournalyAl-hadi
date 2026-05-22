import * as Sentry from '@sentry/react';
import { SENTRY_DSN } from '../config';

let monitoringEnabled = false;

export function initErrorMonitoring() {
  if (!SENTRY_DSN || typeof window === 'undefined' || monitoringEnabled) {
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: true,
    release: __APP_VERSION__,
    environment: import.meta.env.MODE,
  });

  monitoringEnabled = true;
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!monitoringEnabled) {
    return;
  }

  Sentry.captureException(error, context ? { extra: context } : undefined);
}
