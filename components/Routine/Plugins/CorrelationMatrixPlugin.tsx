import React, { useState, useEffect, useMemo } from 'react';
import { CorrelationMatrixWidgetData } from '../../../types';
import {
  CORRELATION_CRYPTO_ASSETS,
  getAssetCorrelations,
  getCorrelationAssetOptions,
} from '../../../services/hyperliquidService';
import type { CorrelationAssetOption } from '../../../services/hyperliquidService';
import { getErrorMessage } from '../../../utils/errorHelpers';

const DEFAULT_BASE_ASSET = 'ETH';
const DEFAULT_TARGET_ASSETS = ['SOL', 'LINK', 'AVAX', 'SP500', 'XYZ100'];
const DEFAULT_ASSET_OPTIONS = {
  crypto: CORRELATION_CRYPTO_ASSETS.map((symbol) => ({ symbol, name: symbol })),
  stocks: [] as CorrelationAssetOption[],
};

const CorrelationMatrixPlugin: React.FC<{ data: CorrelationMatrixWidgetData; onUpdate: (data: CorrelationMatrixWidgetData) => void }> = ({ data, onUpdate }) => {
  const [pairs, setPairs] = useState<{ symbol: string; name: string; correlation: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetOptions, setAssetOptions] = useState(DEFAULT_ASSET_OPTIONS);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [stockSearch, setStockSearch] = useState('');
  const baseAsset = data.baseAsset ?? DEFAULT_BASE_ASSET;
  const targetAssets = (data.targetAssets ?? DEFAULT_TARGET_ASSETS).filter((symbol) => symbol !== baseAsset);
  const targetAssetsKey = targetAssets.join('|');
  const selectedTargetSet = useMemo(() => new Set(targetAssets), [targetAssetsKey]);
  const cryptoTargetCount = targetAssets.filter((symbol) => assetOptions.crypto.some((asset) => asset.symbol === symbol)).length;
  const filteredStockOptions = useMemo(() => {
    const search = stockSearch.trim().toUpperCase();
    if (!search) {
      return assetOptions.stocks;
    }

    return assetOptions.stocks.filter((asset) => (
      asset.symbol.includes(search) || asset.name.toUpperCase().includes(search)
    ));
  }, [assetOptions.stocks, stockSearch]);

  useEffect(() => {
    let isActive = true;

    getCorrelationAssetOptions().then((nextOptions) => {
      if (!isActive) {
        return;
      }

      setAssetOptions(nextOptions);
      setOptionsError(null);
    }).catch((err: unknown) => {
      if (!isActive) {
        return;
      }

      setOptionsError(getErrorMessage(err));
    });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (targetAssets.length === 0) {
      setPairs([]);
      setError(null);
      setLoading(false);
      return;
    }

    let isActive = true;
    setLoading(true);

    getAssetCorrelations(baseAsset, targetAssets).then(nextPairs => {
      if (!isActive) {
        return;
      }

      setPairs(nextPairs);
      setError(null);
      setLoading(false);
    }).catch((err: unknown) => {
      if (!isActive) {
        return;
      }

      setError(getErrorMessage(err));
      setLoading(false);
    });

    return () => {
      isActive = false;
    };
  }, [baseAsset, targetAssetsKey]);

  const updateBaseAsset = (nextBaseAsset: string) => {
    onUpdate({
      baseAsset: nextBaseAsset,
      targetAssets: targetAssets.filter((symbol) => symbol !== nextBaseAsset),
    });
  };

  const toggleTargetAsset = (symbol: string) => {
    const nextTargetAssets = selectedTargetSet.has(symbol)
      ? targetAssets.filter((targetSymbol) => targetSymbol !== symbol)
      : [...targetAssets, symbol];

    onUpdate({ baseAsset, targetAssets: nextTargetAssets });
  };

  const addStockTarget = () => {
    const nextSymbol = stockSearch.trim().toUpperCase();
    const asset = assetOptions.stocks.find((option) => option.symbol === nextSymbol);

    if (!asset || asset.symbol === baseAsset || selectedTargetSet.has(asset.symbol)) {
      return;
    }

    onUpdate({ baseAsset, targetAssets: [...targetAssets, asset.symbol] });
    setStockSearch('');
  };

  const correlationContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-b border-white/5 pb-1">
            <span>Asset</span>
            <span className="text-right">Corr ({baseAsset})</span>
            <span className="text-right">Status</span>
          </div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="grid grid-cols-3 gap-2 items-center">
              <div className="h-4 bg-white/10 rounded animate-pulse" />
              <div className="h-4 bg-white/10 rounded animate-pulse ml-auto" />
              <div className="h-1.5 bg-white/10 rounded animate-pulse" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm font-medium text-red-300">Correlation data is unavailable right now.</p>
          <p className="mt-1 text-xs text-red-200/80">{error}</p>
        </div>
      );
    }

    if (pairs.length === 0) {
      return (
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-gray-400">
          Select crypto or stock tickers to see their 30-day correlation against {baseAsset}.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-b border-white/5 pb-1">
          <span>Asset</span>
          <span className="text-right">Corr ({baseAsset})</span>
          <span className="text-right">Status</span>
        </div>

        {pairs.map(pair => (
          <div key={pair.symbol} className="grid grid-cols-3 gap-2 items-center text-sm">
            <div>
              <div className="font-bold text-white/90">{pair.symbol}</div>
              <div className="text-[10px] text-gray-500 truncate">{pair.name}</div>
            </div>
            <div className={`text-right ${pair.correlation > 0.8 ? 'text-green-400' : pair.correlation < -0.3 ? 'text-red-400' : 'text-gray-400'}`}>
              {pair.correlation.toFixed(2)}
            </div>
            <div className="text-right">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${pair.correlation > 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                  style={{ width: `${Math.abs(pair.correlation) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-white/5 bg-black/20 p-3">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="correlation-base-asset" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Base crypto
          </label>
          <span className="text-[10px] text-gray-600">30D candles</span>
        </div>
        <select
          id="correlation-base-asset"
          value={baseAsset}
          onChange={(event) => updateBaseAsset(event.target.value)}
          className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-white/25"
        >
          {assetOptions.crypto.map((asset) => (
            <option key={asset.symbol} value={asset.symbol} className="bg-gray-950 text-white">
              {asset.symbol} · {asset.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Crypto in play</p>
          <p className="text-[10px] text-gray-600">{cryptoTargetCount} selected</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {assetOptions.crypto.map((asset) => {
            const isSelected = selectedTargetSet.has(asset.symbol);
            const isBase = asset.symbol === baseAsset;

            return (
              <button
                key={asset.symbol}
                type="button"
                onClick={() => !isBase && toggleTargetAsset(asset.symbol)}
                disabled={isBase}
                aria-pressed={isSelected}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${
                  isBase
                    ? 'cursor-not-allowed border-white/5 bg-white/5 text-gray-600'
                    : isSelected
                      ? 'border-blue-400/40 bg-blue-500/15 text-blue-200'
                      : 'border-white/10 bg-white/[0.03] text-gray-500 hover:border-white/25 hover:text-gray-200'
                }`}
              >
                {asset.symbol}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="correlation-stock-search" className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Stocks / XYZ markets
          </label>
          <span className="text-[10px] text-gray-600">{assetOptions.stocks.length} available</span>
        </div>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            addStockTarget();
          }}
        >
          <input
            id="correlation-stock-search"
            list="correlation-stock-options"
            value={stockSearch}
            onChange={(event) => setStockSearch(event.target.value.toUpperCase())}
            placeholder="Type AAPL, TSLA, NVDA..."
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-white/25"
          />
          <datalist id="correlation-stock-options">
            {filteredStockOptions.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>{asset.name}</option>
            ))}
          </datalist>
          <button
            type="submit"
            className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
          >
            Add
          </button>
        </form>
        {optionsError && (
          <p className="text-[11px] text-yellow-300/80">Using fallback XYZ list: {optionsError}</p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {targetAssets.filter((symbol) => assetOptions.stocks.some((asset) => asset.symbol === symbol)).map((symbol) => (
            <button
              key={symbol}
              type="button"
              onClick={() => toggleTargetAsset(symbol)}
              className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200"
              aria-label={`Remove ${symbol} from correlation matrix`}
            >
              {symbol} ×
            </button>
          ))}
        </div>
      </div>

      {correlationContent()}
    </div>
  );
};

export const correlationMatrixConfig = {
    id: 'correlation-matrix',
    title: 'plugin.correlation.title',
    description: 'plugin.correlation.desc',
    defaultSize: { w: 1, h: 3 },
    component: CorrelationMatrixPlugin,
    icon: <span className="text-lg">🔗</span>
};

export default CorrelationMatrixPlugin;
