import React, { useEffect, useMemo, useState } from 'react';
import { findDuplicateTrade, tradeFromCachedBybitPosition, tradeFromCachedBybitTrade } from '../services/tradingIndexService';
import { getTradingProviderClient } from '../services/tradingProviderRegistry';
import type { BybitCachedPosition, BybitCachedTrade, BybitConnection, TradeDetails } from '../types';
import { useI18n } from '../hooks/useI18n';

interface BybitTradePanelProps {
  date: string;
  isToday: boolean;
  isBybitAvailable: boolean;
  selectedTrades: TradeDetails[];
  onSelectTrade: (trade: TradeDetails) => void;
  onCacheChange?: (trades: BybitCachedTrade[]) => void;
  onPositionCacheChange?: (positions: BybitCachedPosition[]) => void;
  onError?: (message: string | null) => void;
}

const STALE_AFTER_MS = 15 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 60 * 1000;

const BybitTradePanel: React.FC<BybitTradePanelProps> = ({
  date,
  isToday,
  isBybitAvailable,
  selectedTrades,
  onSelectTrade,
  onCacheChange,
  onPositionCacheChange,
  onError,
}) => {
  const { t } = useI18n();
  const bybitClient = getTradingProviderClient('bybit');
  const [connection, setConnection] = useState<BybitConnection | null>(null);
  const [trades, setTrades] = useState<BybitCachedTrade[]>([]);
  const [positions, setPositions] = useState<BybitCachedPosition[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCooldownUntil, setRefreshCooldownUntil] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isBybitAvailable || !isToday) {
        setConnection(null);
        setTrades([]);
        setPositions([]);
        onCacheChange?.([]);
        onPositionCacheChange?.([]);
        return;
      }

      setIsLoading(true);
      onError?.(null);
      try {
        const [nextConnection, cached] = await Promise.all([
          bybitClient.getConnection(),
          bybitClient.getCachedTradesForDate(date),
        ]);

        if (cancelled) return;
        const resolvedConnection = cached.connection ?? nextConnection;
        setConnection(resolvedConnection);
        setTrades(cached.trades);
        setPositions(cached.positions ?? []);
        onCacheChange?.(cached.trades);
        onPositionCacheChange?.(cached.positions ?? []);

        const isStale = !resolvedConnection?.lastSyncAt
          || Date.now() - new Date(resolvedConnection.lastSyncAt).getTime() > STALE_AFTER_MS;

        if ((cached.trades.length === 0 || isStale) && resolvedConnection?.validationStatus === 'valid') {
          await handleRefresh(true, resolvedConnection);
        }
      } catch (error) {
        if (cancelled) return;
        onError?.(error instanceof Error ? error.message : t('bybit.error.load'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [bybitClient, date, isBybitAvailable, isToday, onCacheChange, onError, onPositionCacheChange, t]);

  useEffect(() => {
    if (!isBybitAvailable || !isToday || connection?.validationStatus !== 'valid') {
      return;
    }

    const intervalId = window.setInterval(() => {
      void handleRefresh(true);
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [connection, isBybitAvailable, isToday]);

  const filteredTrades = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return trades;
    return trades.filter((trade) =>
      trade.symbol.toLowerCase().includes(term)
      || trade.orderId.toLowerCase().includes(term)
      || trade.externalTradeId.toLowerCase().includes(term)
    );
  }, [search, trades]);

  const filteredPositions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return positions;
    return positions.filter((position) =>
      position.symbol.toLowerCase().includes(term)
      || position.externalPositionId.toLowerCase().includes(term)
    );
  }, [positions, search]);

  async function handleRefresh(isBackground = false, connectionOverride?: BybitConnection | null) {
    const activeConnection = connectionOverride ?? connection;
    if (!isBybitAvailable || !isToday || !activeConnection || activeConnection.validationStatus !== 'valid') return;
    if (!isBackground && Date.now() < refreshCooldownUntil) return;

    setIsRefreshing(true);
    if (!isBackground) {
      setRefreshCooldownUntil(Date.now() + REFRESH_COOLDOWN_MS);
    }
    onError?.(null);

    try {
      const refreshed = await bybitClient.refreshTradesForDate(date, Intl.DateTimeFormat().resolvedOptions().timeZone);
      setConnection(refreshed.connection);
      setTrades(refreshed.trades);
      setPositions(refreshed.positions ?? []);
      onCacheChange?.(refreshed.trades);
      onPositionCacheChange?.(refreshed.positions ?? []);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : t('bybit.error.refresh'));
    } finally {
      setIsRefreshing(false);
    }
  }

  function handleSelectTrade(trade: BybitCachedTrade) {
    const normalized = tradeFromCachedBybitTrade(trade);
    const duplicate = findDuplicateTrade(normalized, selectedTrades);
    if (duplicate) {
      onError?.(t('bybit.error.duplicate_link'));
      return;
    }

    onError?.(null);
    onSelectTrade(normalized);
  }

  function handleSelectPosition(position: BybitCachedPosition) {
    const normalized = tradeFromCachedBybitPosition(position);
    const duplicate = findDuplicateTrade(normalized, selectedTrades);
    if (duplicate) {
      onError?.(t('bybit.error.duplicate_link'));
      return;
    }

    onError?.(null);
    onSelectTrade(normalized);
  }

  if (!isBybitAvailable) {
    return (
      <div className="bg-white/5 p-4 rounded-xl border border-[color:var(--glass-border)] text-sm text-gray-400">
        {t('bybit.unavailable')}
      </div>
    );
  }

  if (!isToday) {
    return (
      <div className="bg-white/5 p-4 rounded-xl border border-[color:var(--glass-border)] text-sm text-gray-400">
        {t('bybit.today_only')}
      </div>
    );
  }

  const secondsRemaining = Math.max(0, Math.ceil((refreshCooldownUntil - Date.now()) / 1000));

  return (
    <div className="bg-white/5 p-4 rounded-xl border border-[color:var(--glass-border)] space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-medium text-sm">{t('bybit.panel_title')}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {connection
              ? `${t('bybit.connection')}: ${connection.apiKeyMasked} • ${connection.environment}`
              : t('bybit.not_connected')}
          </p>
          {connection?.lastSyncAt && (
            <p className="text-xs text-gray-500 mt-1">
              {t('bybit.last_sync')}: {new Date(connection.lastSyncAt).toLocaleString()}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={!connection || connection.validationStatus !== 'valid' || isRefreshing || secondsRemaining > 0}
          className="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRefreshing ? t('bybit.refreshing') : secondsRemaining > 0 ? `${t('bybit.refresh')} (${secondsRemaining}s)` : t('bybit.refresh')}
        </button>
      </div>

      {!connection && !isLoading && (
        <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          {t('bybit.connect_prompt')}
        </div>
      )}

      {connection && connection.validationStatus !== 'valid' && (
        <div className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          {connection.validationStatus === 'permission_denied' ? t('bybit.permission_required') : t('bybit.validation_required')}
        </div>
      )}

      <div>
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('bybit.search_placeholder')}
          className="w-full bg-black/40 border border-[color:var(--glass-border)] rounded-lg p-2.5 text-sm text-white"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">{t('bybit.executions_title')}</h4>
          <span className="text-[11px] text-gray-500">{filteredTrades.length}</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="text-sm text-gray-400">{t('bybit.loading')}</div>
          ) : filteredTrades.length === 0 ? (
            <div className="text-sm text-gray-400">{t('bybit.empty')}</div>
          ) : (
            filteredTrades.map((trade) => {
              const duplicate = !!findDuplicateTrade(tradeFromCachedBybitTrade(trade), selectedTrades);
              const pnlValue = trade.closedPnl;

              return (
                <div key={trade.externalTradeId} className="rounded-xl border border-[color:var(--glass-border)] bg-black/20 p-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${trade.side === 'Sell' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                          {trade.side}
                        </span>
                        <span className="font-semibold text-white text-sm">{trade.symbol}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(trade.executedAt).toLocaleTimeString()} • {trade.quantity} @ {trade.price}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">{trade.orderId}</p>
                    </div>
                    <div className="text-right space-y-2">
                      {typeof pnlValue === 'number' && (
                        <div className={`text-sm font-mono ${pnlValue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnlValue >= 0 ? '+' : ''}{pnlValue.toFixed(2)}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSelectTrade(trade)}
                        disabled={duplicate}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {duplicate ? t('bybit.linked') : t('bybit.link_trade')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/80">{t('bybit.positions_title')}</h4>
          <span className="text-[11px] text-gray-500">{filteredPositions.length}</span>
        </div>

        {filteredPositions.length === 0 ? (
          <div className="rounded-xl border border-[color:var(--glass-border)] bg-black/20 p-3 text-sm text-gray-400">
            {t('bybit.positions_empty')}
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {filteredPositions.map((position) => {
              const duplicate = !!findDuplicateTrade(tradeFromCachedBybitPosition(position), selectedTrades);
              const pnlValue = position.unrealizedPnl;

              return (
                <div
                  key={position.externalPositionId}
                  className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top_left,rgba(6,182,212,0.18),transparent_45%),rgba(255,255,255,0.03)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded ${position.side === 'Sell' ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                          {position.side}
                        </span>
                        <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-200">
                          {t('bybit.status_open')}
                        </span>
                        <span className="font-semibold text-white text-sm">{position.symbol}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 sm:grid-cols-3">
                        <div className="rounded-lg bg-black/20 px-3 py-2">
                          <div className="text-gray-500">{t('bybit.entry_price')}</div>
                          <div className="font-mono text-white">{position.entryPrice?.toFixed(4) ?? '--'}</div>
                        </div>
                        <div className="rounded-lg bg-black/20 px-3 py-2">
                          <div className="text-gray-500">{t('bybit.mark_price')}</div>
                          <div className="font-mono text-white">{position.markPrice?.toFixed(4) ?? '--'}</div>
                        </div>
                        <div className="rounded-lg bg-black/20 px-3 py-2">
                          <div className="text-gray-500">{t('bybit.liquidation_price')}</div>
                          <div className="font-mono text-amber-200">{position.liquidationPrice?.toFixed(4) ?? '--'}</div>
                        </div>
                        <div className="rounded-lg bg-black/20 px-3 py-2">
                          <div className="text-gray-500">{t('bybit.position_size')}</div>
                          <div className="font-mono text-white">{position.quantity}</div>
                        </div>
                        <div className="rounded-lg bg-black/20 px-3 py-2">
                          <div className="text-gray-500">{t('bybit.leverage_short')}</div>
                          <div className="font-mono text-white">{position.leverage ? `${position.leverage}x` : '--'}</div>
                        </div>
                        <div className="rounded-lg bg-black/20 px-3 py-2">
                          <div className="text-gray-500">{t('bybit.margin_mode')}</div>
                          <div className="font-medium text-white capitalize">{position.marginMode ?? 'unknown'}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-gray-500">
                        {position.updatedAt ? `${t('bybit.updated')}: ${new Date(position.updatedAt).toLocaleString()}` : position.externalPositionId}
                      </div>
                    </div>

                    <div className="min-w-[112px] text-right space-y-2">
                      <div className={`text-sm font-mono ${typeof pnlValue === 'number' && pnlValue < 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {typeof pnlValue === 'number'
                          ? `${pnlValue >= 0 ? '+' : ''}${pnlValue.toFixed(2)}`
                          : '--'}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-500">{t('bybit.unrealized_pnl')}</div>
                      <button
                        type="button"
                        onClick={() => handleSelectPosition(position)}
                        disabled={duplicate}
                        className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-cyan-500/10 text-cyan-100 border border-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {duplicate ? t('bybit.linked') : t('bybit.register_snapshot')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BybitTradePanel;
