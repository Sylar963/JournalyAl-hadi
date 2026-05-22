import React, { useEffect, useRef, useState } from 'react';
import { type BybitEnvironment, type BybitValidationStatus, type ThalexEnvironment, type ThalexValidationStatus, type Theme } from '../types';
import { THEMES_CONFIG } from '../constants';
import { getTradingProviderClient } from '../services/tradingProviderRegistry';
import { bulkRefreshBybitTrades, bulkCreateEntriesWithTrades, deleteCurrentAccount } from '../services/dataService';
import { BYBIT_SETUP_SQL, getBybitSchemaErrorMessage, THALEX_SETUP_SQL, getThalexSchemaErrorMessage } from '../services/supabaseService';
import { useI18n } from '../hooks/useI18n';
import { TranslationKey } from '../utils/translations';
import { createAppBackup, isAppBackupPayload, restoreAppBackup } from '../services/backupService';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  isBybitAvailable: boolean;
  isThalexAvailable: boolean;
  canManageAccount: boolean;
  onAccountDeleted: () => Promise<void>;
}

const validationClasses: Record<BybitValidationStatus, string> = {
  not_connected: 'bg-white/10 text-gray-300',
  pending: 'bg-amber-500/10 text-amber-300',
  valid: 'bg-green-500/10 text-green-300',
  invalid: 'bg-red-500/10 text-red-300',
  permission_denied: 'bg-red-500/10 text-red-300',
};

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange, isBybitAvailable, isThalexAvailable, canManageAccount, onAccountDeleted }) => {
  const { t } = useI18n();
  const bybitClient = getTradingProviderClient('bybit');
  const thalexClient = getTradingProviderClient('thalex');
  const importInputRef = useRef<HTMLInputElement>(null);
  const [environment, setEnvironment] = useState<BybitEnvironment>('mainnet');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [status, setStatus] = useState<BybitValidationStatus>('not_connected');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [lastValidatedAt, setLastValidatedAt] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkImportProgress, setBulkImportProgress] = useState<string>('');
  const [bulkImportStart, setBulkImportStart] = useState('');
  const [bulkImportEnd, setBulkImportEnd] = useState('');
  const [bulkImportResults, setBulkImportResults] = useState<{ date: string; trades: number; pnl: number; created: boolean }[]>([]);
  const [copiedSetupSql, setCopiedSetupSql] = useState(false);

  // --- Thalex state ---
  const [thalexEnvironment, setThalexEnvironment] = useState<ThalexEnvironment>('mainnet');
  const [thalexKeyName, setThalexKeyName] = useState('');
  const [thalexPrivateKey, setThalexPrivateKey] = useState('');
  const [thalexStatus, setThalexStatus] = useState<ThalexValidationStatus>('not_connected');
  const [thalexFeedback, setThalexFeedback] = useState<string | null>(null);
  const [thalexMaskedKey, setThalexMaskedKey] = useState<string | null>(null);
  const [thalexLastValidated, setThalexLastValidated] = useState<string | null>(null);
  const [thalexLastSync, setThalexLastSync] = useState<string | null>(null);
  const [isThalexLoading, setIsThalexLoading] = useState(false);
  const [isThalexSaving, setIsThalexSaving] = useState(false);
  const [isThalexTesting, setIsThalexTesting] = useState(false);
  const [isThalexDeleting, setIsThalexDeleting] = useState(false);
  const [copiedThalexSetupSql, setCopiedThalexSetupSql] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [accountFeedback, setAccountFeedback] = useState<string | null>(null);

  const shouldShowSetupSql = feedback === getBybitSchemaErrorMessage();
  const shouldShowThalexSetupSql = thalexFeedback === getThalexSchemaErrorMessage();

  const handleCopySetupSql = async () => {
    await navigator.clipboard.writeText(BYBIT_SETUP_SQL.trim());
    setCopiedSetupSql(true);
    setTimeout(() => setCopiedSetupSql(false), 2000);
  };

  const handleCopyThalexSetupSql = async () => {
    await navigator.clipboard.writeText(THALEX_SETUP_SQL.trim());
    setCopiedThalexSetupSql(true);
    setTimeout(() => setCopiedThalexSetupSql(false), 2000);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadConnection() {
      if (!isBybitAvailable) return;
      setIsLoading(true);
      try {
        const connection = await bybitClient.getConnection();
        if (!connection || cancelled) return;
        setEnvironment(connection.environment);
        setStatus(connection.validationStatus);
        setMaskedKey(connection.apiKeyMasked);
        setLastValidatedAt(connection.lastValidatedAt);
        setLastSyncAt(connection.lastSyncAt);
      } catch (error) {
        if (!cancelled) {
          setFeedback(error instanceof Error ? error.message : t('bybit.error.load'));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadConnection();

    return () => {
      cancelled = true;
    };
  }, [bybitClient, isBybitAvailable, t]);

  async function handleSaveConnection() {
    setIsSaving(true);
    setFeedback(null);
    try {
      const connection = await bybitClient.saveConnection({
        environment,
        apiKey,
        apiSecret,
      });
      setStatus(connection.validationStatus);
      setMaskedKey(connection.apiKeyMasked);
      setLastValidatedAt(connection.lastValidatedAt);
      setLastSyncAt(connection.lastSyncAt);
      setApiKey('');
      setApiSecret('');
      setFeedback(t('bybit.connect_success'));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('bybit.error.save'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTestConnection() {
    setIsTesting(true);
    setFeedback(null);
    try {
      const connection = await bybitClient.validateConnection({
        environment,
        apiKey,
        apiSecret,
      });
      setStatus(connection.validationStatus);
      setFeedback(connection.validationStatus === 'valid' ? t('bybit.test_success') : t('bybit.permission_required'));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('bybit.error.validate'));
    } finally {
      setIsTesting(false);
    }
  }

  async function handleDeleteConnection() {
    setIsDeleting(true);
    setFeedback(null);
    try {
      await bybitClient.deleteConnection();
      setStatus('not_connected');
      setMaskedKey(null);
      setLastValidatedAt(undefined);
      setLastSyncAt(undefined);
      setApiKey('');
      setApiSecret('');
      setFeedback(t('bybit.disconnect_success'));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t('bybit.error.delete'));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleBulkImport() {
    if (!bulkImportStart || !bulkImportEnd) {
      setFeedback('Please select start and end dates');
      return;
    }
    setIsBulkImporting(true);
    setBulkImportProgress('Importing trades and creating entries...');
    setBulkImportResults([]);
    setFeedback(null);
    try {
      const results = await bulkCreateEntriesWithTrades(bulkImportStart, bulkImportEnd, Intl.DateTimeFormat().resolvedOptions().timeZone);
      setBulkImportResults(results);
      const totalTrades = results.reduce((s, r) => s + r.tradesCount, 0);
      const totalPnl = results.reduce((s, r) => s + r.pnl, 0);
      const createdCount = results.filter(r => r.created).length;
      setBulkImportProgress(`Done! ${createdCount} entries created, ${totalTrades} trades, PnL: $${totalPnl.toFixed(2)}`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Bulk import failed');
    } finally {
      setIsBulkImporting(false);
    }
  }

  // --- Thalex handlers ---
  useEffect(() => {
    let cancelled = false;
    async function loadThalexConnection() {
      if (!isThalexAvailable) return;
      setIsThalexLoading(true);
      try {
        const connection = await thalexClient.getConnection();
        if (!connection || cancelled) return;
        setThalexEnvironment(connection.environment);
        setThalexStatus(connection.validationStatus);
        setThalexMaskedKey(connection.keyNameMasked);
        setThalexLastValidated(connection.lastValidatedAt ?? null);
        setThalexLastSync(connection.lastSyncAt ?? null);
      } catch (error) {
        if (!cancelled) setThalexFeedback(error instanceof Error ? error.message : 'Failed to load Thalex connection.');
      } finally {
        if (!cancelled) setIsThalexLoading(false);
      }
    }
    void loadThalexConnection();
    return () => { cancelled = true; };
  }, [thalexClient, isThalexAvailable]);

  async function handleThalexSaveConnection() {
    setIsThalexSaving(true);
    setThalexFeedback(null);
    try {
      const connection = await thalexClient.saveConnection({ environment: thalexEnvironment, keyName: thalexKeyName, privateKeyPem: thalexPrivateKey });
      setThalexStatus(connection.validationStatus);
      setThalexMaskedKey(connection.keyNameMasked);
      setThalexLastValidated(connection.lastValidatedAt ?? null);
      setThalexKeyName('');
      setThalexPrivateKey('');
      setThalexFeedback('Thalex connected successfully.');
    } catch (error) {
      setThalexFeedback(error instanceof Error ? error.message : 'Failed to save Thalex credentials.');
    } finally {
      setIsThalexSaving(false);
    }
  }

  async function handleThalexTestConnection() {
    setIsThalexTesting(true);
    setThalexFeedback(null);
    try {
      const connection = await thalexClient.validateConnection({ environment: thalexEnvironment, keyName: thalexKeyName, privateKeyPem: thalexPrivateKey });
      setThalexStatus(connection.validationStatus);
      setThalexFeedback('Thalex credentials are valid! ✓');
    } catch (error) {
      setThalexFeedback(error instanceof Error ? error.message : 'Thalex validation failed.');
    } finally {
      setIsThalexTesting(false);
    }
  }

  async function handleThalexDeleteConnection() {
    setIsThalexDeleting(true);
    setThalexFeedback(null);
    try {
      await thalexClient.deleteConnection();
      setThalexStatus('not_connected');
      setThalexMaskedKey(null);
      setThalexLastValidated(null);
      setThalexLastSync(null);
      setThalexFeedback('Thalex disconnected.');
    } catch (error) {
      setThalexFeedback(error instanceof Error ? error.message : 'Failed to disconnect Thalex.');
    } finally {
      setIsThalexDeleting(false);
    }
  }

  async function handleExportBackup() {
    setIsExportingBackup(true);
    setBackupFeedback(null);

    try {
      const backup = await createAppBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `delta-journal-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      setBackupFeedback('Backup exported successfully.');
    } catch (error) {
      setBackupFeedback(error instanceof Error ? error.message : 'Failed to export backup.');
    } finally {
      setIsExportingBackup(false);
    }
  }

  async function handleImportBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingBackup(true);
    setBackupFeedback(null);

    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      if (!isAppBackupPayload(parsed)) {
        throw new Error('Choose a valid Delta Journal backup file.');
      }

      await restoreAppBackup(parsed);
      setBackupFeedback('Backup imported. Reloading your workspace...');
      window.setTimeout(() => window.location.reload(), 600);
    } catch (error) {
      setBackupFeedback(error instanceof Error ? error.message : 'Failed to import backup.');
    } finally {
      event.target.value = '';
      setIsImportingBackup(false);
    }
  }

  async function handleDeleteAccount() {
    setAccountFeedback(null);

    if (deleteConfirmation !== 'DELETE') {
      setAccountFeedback('Type DELETE to confirm account deletion.');
      return;
    }

    setIsDeletingAccount(true);

    try {
      await deleteCurrentAccount();
      await onAccountDeleted();
      window.location.replace('/');
    } catch (error) {
      setAccountFeedback(error instanceof Error ? error.message : 'Failed to delete the account.');
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <div className="space-y-6 animate-content-entry">
      <div>
        <p className="journal-kicker">Workspace Configuration</p>
        <h1 className="text-2xl font-semibold text-[var(--text-main)] mt-1">{t('settings.title')}</h1>
      </div>

      <div className="journal-panel p-6 rounded-2xl">
        <p className="journal-kicker mb-2">Visual System</p>
        <h2 className="text-lg font-semibold text-[var(--text-main)] mb-4">{t('settings.appearance_title')}</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">{t('settings.appearance_subtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES_CONFIG.map((theme) => {
            const isActive = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`relative p-4 rounded-xl border transition-all duration-200 focus:outline-none ${
                  isActive
                    ? 'border-[var(--panel-border-strong)] bg-[var(--surface-3)]'
                    : 'bg-[var(--surface-2)] border-[var(--panel-border)] hover:border-[var(--panel-border-strong)]'
                }`}
                aria-pressed={isActive}
              >
                <h3 className="font-semibold text-[var(--text-main)]">{t(`theme.${theme.id}` as TranslationKey)}</h3>
                <div className="flex items-center space-x-2 mt-3">
                  <div className={`w-6 h-6 rounded-full ${theme.colors.background}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.primary}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.secondary}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.accent}`}></div>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[var(--accent-primary)] rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="journal-panel p-6 rounded-2xl space-y-4">
        <div>
          <p className="journal-kicker mb-2">Backup &amp; Restore</p>
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Protect your journal data</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Export a JSON backup before major changes or when moving to a new device. Local mode now persists in this browser, but backups are still the safest option.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleExportBackup()}
            disabled={isExportingBackup || isImportingBackup}
            className="journal-button-primary rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExportingBackup ? 'Exporting...' : 'Export Backup'}
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={isExportingBackup || isImportingBackup}
            className="journal-button-secondary rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImportingBackup ? 'Importing...' : 'Import Backup'}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => void handleImportBackup(event)}
          />
        </div>

        {backupFeedback && (
          <div className="rounded-xl journal-panel-muted p-4 text-sm text-[var(--text-main)]">
            {backupFeedback}
          </div>
        )}
      </div>

      <div className="journal-panel p-6 rounded-2xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="journal-kicker mb-1">Broker Connectivity</p>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">{t('bybit.settings_title')}</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">{t('bybit.settings_subtitle')}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium journal-metric ${validationClasses[status]}`}>
            {t(`bybit.status.${status}` as TranslationKey)}
          </span>
        </div>

        {!isBybitAvailable ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            {t('bybit.unavailable')}
          </div>
        ) : (
          <>
            {maskedKey && (
              <div className="rounded-xl journal-panel-muted p-4 text-sm text-[var(--text-muted)]">
                <p>{t('bybit.connected_key')}: <span className="font-mono text-[var(--text-main)]">{maskedKey}</span></p>
                {lastValidatedAt && <p className="mt-1 journal-metric">{t('bybit.last_validated')}: {new Date(lastValidatedAt).toLocaleString()}</p>}
                {lastSyncAt && <p className="mt-1 journal-metric">{t('bybit.last_sync')}: {new Date(lastSyncAt).toLocaleString()}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-[var(--text-muted)]">
                <span className="block mb-2">{t('bybit.environment')}</span>
                <select
                  value={environment}
                  onChange={(event) => setEnvironment(event.target.value as BybitEnvironment)}
                  className="journal-input w-full rounded-xl p-3"
                >
                  <option value="mainnet">{t('bybit.environment.mainnet')}</option>
                  <option value="testnet">{t('bybit.environment.testnet')}</option>
                </select>
              </label>

              <label className="text-sm text-[var(--text-muted)]">
                <span className="block mb-2">{t('bybit.api_key')}</span>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={t('bybit.api_key_placeholder')}
                  autoComplete="off"
                  spellCheck={false}
                  className="journal-input w-full rounded-xl p-3"
                />
              </label>
            </div>

            <label className="text-sm text-[var(--text-muted)] block">
              <span className="block mb-2">{t('bybit.api_secret')}</span>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(event) => setApiSecret(event.target.value)}
                  placeholder={t('bybit.api_secret_placeholder')}
                  autoComplete="off"
                  spellCheck={false}
                  className="journal-input w-full rounded-xl p-3"
                />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleTestConnection()}
                disabled={!apiKey || !apiSecret || isTesting || isSaving || isLoading}
                className="journal-button-secondary px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? t('bybit.testing') : t('bybit.test')}
              </button>
              <button
                type="button"
                onClick={() => void handleSaveConnection()}
                disabled={!apiKey || !apiSecret || isSaving || isTesting || isLoading}
                className="journal-button-primary px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? t('bybit.connecting') : t('bybit.connect')}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConnection()}
                disabled={!maskedKey || isDeleting || isSaving || isTesting}
                className="journal-button-danger px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? t('bybit.disconnecting') : t('bybit.disconnect')}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t journal-divider">
              <p className="journal-kicker mb-2">Backfill</p>
              <h3 className="text-sm font-medium text-[var(--text-main)] mb-3">Bulk Import History</h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">Pull all Bybit trades for a date range. Creates journal entries with trades filled in.</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="text-xs text-[var(--text-muted)]">
                  <span className="block mb-1">Start Date</span>
                  <input
                    type="date"
                    value={bulkImportStart}
                    onChange={(e) => setBulkImportStart(e.target.value)}
                    className="journal-input w-full rounded-lg p-2 text-xs journal-metric"
                  />
                </label>
                <label className="text-xs text-[var(--text-muted)]">
                  <span className="block mb-1">End Date</span>
                  <input
                    type="date"
                    value={bulkImportEnd}
                    onChange={(e) => setBulkImportEnd(e.target.value)}
                    className="journal-input w-full rounded-lg p-2 text-xs journal-metric"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => void handleBulkImport()}
                disabled={!bulkImportStart || !bulkImportEnd || isBulkImporting}
                className="journal-button-secondary w-full px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkImporting ? 'Importing...' : 'Import All Trades'}
              </button>
              {bulkImportProgress && (
                <p className="mt-2 text-xs text-green-400">{bulkImportProgress}</p>
              )}
              {bulkImportResults.length > 0 && (
                <div className="mt-3 max-h-32 overflow-auto rounded-lg journal-panel-muted text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="text-[var(--text-muted)] border-b border-[var(--panel-border)]">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-right">Trades</th>
                        <th className="p-2 text-right">PnL</th>
                        <th className="p-2 text-center">Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkImportResults.slice(0, 10).map(r => (
                        <tr key={r.date} className="border-b border-[var(--panel-border)]">
                          <td className="p-2 text-[var(--text-main)] journal-metric">{r.date}</td>
                          <td className="p-2 text-right text-[var(--text-main)] journal-metric">{r.trades}</td>
                          <td className={`p-2 text-right ${r.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{r.pnl >= 0 ? '+' : ''}{r.pnl.toFixed(2)}</td>
                          <td className={`p-2 text-center ${r.created ? 'text-green-400' : 'text-gray-500'}`}>{r.created ? '✓' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkImportResults.length > 10 && (
                    <p className="p-2 text-center text-gray-500 text-xs">+ {bulkImportResults.length - 10} more days</p>
                  )}
                </div>
              )}
            </div>

            {feedback && (
              <div className="rounded-xl journal-panel-muted p-4 text-sm text-[var(--text-main)]">
                {feedback}
              </div>
            )}

            {shouldShowSetupSql && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-amber-200">Run this SQL in Supabase SQL Editor, then refresh the app.</p>
                  <button
                    type="button"
                    onClick={() => void handleCopySetupSql()}
                    className="journal-button-secondary px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    {copiedSetupSql ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="max-h-72 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-gray-200 journal-metric">
                  <code>{BYBIT_SETUP_SQL.trim()}</code>
                </pre>
              </div>
            )}
          </>
        )}
      </div>

      {/* Thalex Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Thalex Options
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">Options &amp; Futures</span>
            </h2>
            <p className="text-sm text-gray-400 mt-1">Connect via RSA key pair to pull your options &amp; futures history.</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            thalexStatus === 'valid' ? 'bg-green-500/10 text-green-300' :
            thalexStatus === 'pending' ? 'bg-amber-500/10 text-amber-300' :
            thalexStatus === 'invalid' ? 'bg-red-500/10 text-red-300' :
            'bg-white/10 text-gray-300'
          }`}>
            {thalexStatus === 'valid' ? 'Connected' : thalexStatus === 'pending' ? 'Pending' : thalexStatus === 'invalid' ? 'Invalid' : 'Not Connected'}
          </span>
        </div>

        {!isThalexAvailable ? (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
            Thalex integration requires Supabase. Configure your Supabase environment variables to enable this feature.
          </div>
        ) : (
          <>
            {thalexMaskedKey && (
              <div className="rounded-xl border border-[color:var(--glass-border)] bg-white/5 p-4 text-sm text-gray-300">
                <p>Key: <span className="font-mono text-white">{thalexMaskedKey}</span></p>
                {thalexLastValidated && <p className="mt-1 text-gray-400">Last validated: {new Date(thalexLastValidated).toLocaleString()}</p>}
                {thalexLastSync && <p className="mt-1 text-gray-400">Last sync: {new Date(thalexLastSync).toLocaleString()}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-300">
                <span className="block mb-2">Environment</span>
                <select
                  value={thalexEnvironment}
                  onChange={(e) => setThalexEnvironment(e.target.value as ThalexEnvironment)}
                  className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-xl p-3 text-white"
                >
                  <option value="mainnet">Mainnet</option>
                  <option value="testnet">Testnet</option>
                </select>
              </label>

              <label className="text-sm text-gray-300">
                <span className="block mb-2">Key Name <span className="text-gray-500 text-xs">(e.g. K123456789)</span></span>
                <input
                  type="text"
                  value={thalexKeyName}
                  onChange={(e) => setThalexKeyName(e.target.value)}
                  placeholder="K123456789"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-xl p-3 text-white font-mono"
                />
              </label>
            </div>

            <label className="text-sm text-gray-300 block">
              <span className="block mb-2">RSA Private Key <span className="text-gray-500 text-xs">(PEM format — -----BEGIN PRIVATE KEY-----)</span></span>
              <textarea
                value={thalexPrivateKey}
                onChange={(e) => setThalexPrivateKey(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                rows={5}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-xl p-3 text-white font-mono text-xs resize-none"
              />
            </label>

            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-200">
              <strong>How to get credentials:</strong> Log into Thalex → Account Settings → API Keys → Create key pair. Copy the key name and private key (shown only once). Use RS256 algorithm when generating the key.
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleThalexTestConnection()}
                disabled={!thalexKeyName || !thalexPrivateKey || isThalexTesting || isThalexSaving}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isThalexTesting ? 'Testing...' : 'Test'}
              </button>
              <button
                type="button"
                onClick={() => void handleThalexSaveConnection()}
                disabled={!thalexKeyName || !thalexPrivateKey || isThalexSaving || isThalexTesting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-600 to-violet-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isThalexSaving ? 'Connecting...' : 'Connect'}
              </button>
              <button
                type="button"
                onClick={() => void handleThalexDeleteConnection()}
                disabled={!thalexMaskedKey || isThalexDeleting || isThalexSaving}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/15 text-red-300 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isThalexDeleting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>

            {thalexFeedback && (
              <div className="rounded-xl border border-[color:var(--glass-border)] bg-black/20 p-4 text-sm text-gray-200">
                {thalexFeedback}
              </div>
            )}

            {shouldShowThalexSetupSql && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-amber-200">Run this SQL in Supabase SQL Editor, then refresh the app.</p>
                  <button
                    type="button"
                    onClick={() => void handleCopyThalexSetupSql()}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black/30 text-white border border-white/10"
                  >
                    {copiedThalexSetupSql ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-gray-200">
                  <code>{THALEX_SETUP_SQL.trim()}</code>
                </pre>
              </div>
            )}
          </>
        )}
      </div>

      <div className="journal-panel p-6 rounded-2xl space-y-4">
        <div>
          <p className="journal-kicker mb-2">Data Mode</p>
          <h2 className="text-lg font-semibold text-[var(--text-main)]">Current persistence</h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {canManageAccount
              ? 'Your authenticated data is stored in Supabase and follows your account.'
              : 'Local mode now persists on this device using browser storage. Broker sync, AI, and account tools still require Supabase-backed mode.'}
          </p>
        </div>
      </div>

      {canManageAccount && (
        <div className="journal-panel p-6 rounded-2xl space-y-4 border border-red-500/20">
          <div>
            <p className="journal-kicker mb-2 text-red-300">Danger Zone</p>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">Delete account</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              This permanently deletes your journal entries, reviews, quests, broker connections, and account record from Supabase.
            </p>
          </div>

          <label className="block text-sm text-[var(--text-muted)]">
            <span className="mb-2 block">Type DELETE to confirm</span>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              className="journal-input w-full rounded-xl p-3 journal-metric"
            />
          </label>

          <button
            type="button"
            onClick={() => void handleDeleteAccount()}
            disabled={isDeletingAccount}
            className="journal-button-danger rounded-xl px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeletingAccount ? 'Deleting account...' : 'Delete Account Permanently'}
          </button>

          {accountFeedback && (
            <div className="rounded-xl journal-panel-muted p-4 text-sm text-[var(--text-main)]">
              {accountFeedback}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsView;
