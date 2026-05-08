import React, { useEffect, useState } from 'react';
import { type BybitEnvironment, type BybitValidationStatus, type ThalexEnvironment, type ThalexValidationStatus, type Theme } from '../types';
import { THEMES_CONFIG } from '../constants';
import { getTradingProviderClient } from '../services/tradingProviderRegistry';
import { bulkRefreshBybitTrades, bulkCreateEntriesWithTrades } from '../services/dataService';
import { BYBIT_SETUP_SQL, getBybitSchemaErrorMessage, THALEX_SETUP_SQL, getThalexSchemaErrorMessage } from '../services/supabaseService';
import { useI18n } from '../hooks/useI18n';
import { TranslationKey } from '../utils/translations';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  isBybitAvailable: boolean;
  isThalexAvailable: boolean;
}

const validationClasses: Record<BybitValidationStatus, string> = {
  not_connected: 'bg-white/10 text-gray-300',
  pending: 'bg-amber-500/10 text-amber-300',
  valid: 'bg-green-500/10 text-green-300',
  invalid: 'bg-red-500/10 text-red-300',
  permission_denied: 'bg-red-500/10 text-red-300',
};

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange, isBybitAvailable, isThalexAvailable }) => {
  const { t } = useI18n();
  const bybitClient = getTradingProviderClient('bybit');
  const thalexClient = getTradingProviderClient('thalex');
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

  return (
    <div className="space-y-6 animate-content-entry">
      <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>

      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">{t('settings.appearance_title')}</h2>
        <p className="text-sm text-gray-400 mb-6">{t('settings.appearance_subtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES_CONFIG.map((theme) => {
            const isActive = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`relative p-4 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--accent-primary)] ${
                  isActive
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-white/5 border-[color:var(--glass-border)] hover:bg-white/10 hover:border-white/20'
                }`}
                aria-pressed={isActive}
              >
                <h3 className="font-semibold text-white">{t(`theme.${theme.id}` as TranslationKey)}</h3>
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

      <div className="glass-panel p-6 rounded-2xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{t('bybit.settings_title')}</h2>
            <p className="text-sm text-gray-400 mt-1">{t('bybit.settings_subtitle')}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${validationClasses[status]}`}>
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
              <div className="rounded-xl border border-[color:var(--glass-border)] bg-white/5 p-4 text-sm text-gray-300">
                <p>{t('bybit.connected_key')}: <span className="font-mono text-white">{maskedKey}</span></p>
                {lastValidatedAt && <p className="mt-1 text-gray-400">{t('bybit.last_validated')}: {new Date(lastValidatedAt).toLocaleString()}</p>}
                {lastSyncAt && <p className="mt-1 text-gray-400">{t('bybit.last_sync')}: {new Date(lastSyncAt).toLocaleString()}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="text-sm text-gray-300">
                <span className="block mb-2">{t('bybit.environment')}</span>
                <select
                  value={environment}
                  onChange={(event) => setEnvironment(event.target.value as BybitEnvironment)}
                  className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-xl p-3 text-white"
                >
                  <option value="mainnet">{t('bybit.environment.mainnet')}</option>
                  <option value="testnet">{t('bybit.environment.testnet')}</option>
                </select>
              </label>

              <label className="text-sm text-gray-300">
                <span className="block mb-2">{t('bybit.api_key')}</span>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={t('bybit.api_key_placeholder')}
                  className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-xl p-3 text-white"
                />
              </label>
            </div>

            <label className="text-sm text-gray-300 block">
              <span className="block mb-2">{t('bybit.api_secret')}</span>
              <input
                type="password"
                value={apiSecret}
                onChange={(event) => setApiSecret(event.target.value)}
                placeholder={t('bybit.api_secret_placeholder')}
                className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-xl p-3 text-white"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleTestConnection()}
                disabled={!apiKey || !apiSecret || isTesting || isSaving || isLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? t('bybit.testing') : t('bybit.test')}
              </button>
              <button
                type="button"
                onClick={() => void handleSaveConnection()}
                disabled={!apiKey || !apiSecret || isSaving || isTesting || isLoading}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? t('bybit.connecting') : t('bybit.connect')}
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteConnection()}
                disabled={!maskedKey || isDeleting || isSaving || isTesting}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/15 text-red-300 border border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? t('bybit.disconnecting') : t('bybit.disconnect')}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-[color:var(--glass-border)]">
              <h3 className="text-sm font-medium text-white mb-3">Bulk Import History</h3>
              <p className="text-xs text-gray-400 mb-3">Pull all Bybit trades for a date range. Creates journal entries with trades filled in.</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <label className="text-xs text-gray-300">
                  <span className="block mb-1">Start Date</span>
                  <input
                    type="date"
                    value={bulkImportStart}
                    onChange={(e) => setBulkImportStart(e.target.value)}
                    className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-lg p-2 text-white text-xs"
                  />
                </label>
                <label className="text-xs text-gray-300">
                  <span className="block mb-1">End Date</span>
                  <input
                    type="date"
                    value={bulkImportEnd}
                    onChange={(e) => setBulkImportEnd(e.target.value)}
                    className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-lg p-2 text-white text-xs"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => void handleBulkImport()}
                disabled={!bulkImportStart || !bulkImportEnd || isBulkImporting}
                className="w-full px-4 py-2 rounded-xl text-sm font-medium bg-blue-600/80 text-white border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkImporting ? 'Importing...' : 'Import All Trades'}
              </button>
              {bulkImportProgress && (
                <p className="mt-2 text-xs text-green-400">{bulkImportProgress}</p>
              )}
              {bulkImportResults.length > 0 && (
                <div className="mt-3 max-h-32 overflow-auto rounded-lg bg-black/30 text-xs">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-400 border-b border-white/10">
                        <th className="p-2 text-left">Date</th>
                        <th className="p-2 text-right">Trades</th>
                        <th className="p-2 text-right">PnL</th>
                        <th className="p-2 text-center">Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkImportResults.slice(0, 10).map(r => (
                        <tr key={r.date} className="border-b border-white/5">
                          <td className="p-2 text-gray-300">{r.date}</td>
                          <td className="p-2 text-right text-gray-300">{r.trades}</td>
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
              <div className="rounded-xl border border-[color:var(--glass-border)] bg-black/20 p-4 text-sm text-gray-200">
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
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-black/30 text-white border border-white/10"
                  >
                    {copiedSetupSql ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
                <pre className="max-h-72 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-gray-200">
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
    </div>
  );
};

export default SettingsView;
