import type { BybitCachedPosition, BybitCachedTrade, EmotionEntry, TradeDetails, TradeSource } from '../types';

export interface IndexedTrade extends TradeDetails {
  source: TradeSource;
  tradeFingerprint: string;
  effectivePnl?: number;
}

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function normalizeTradeTypeFromSide(side?: string): TradeDetails['type'] {
  return side === 'Sell' ? 'Short Future' : 'Long Future';
}

export function createTradeFingerprint(trade: Partial<TradeDetails>): string {
  const source = trade.source ?? 'manual';
  const symbol = (trade.symbol || '').toUpperCase().trim();
  const type = trade.type || normalizeTradeTypeFromSide(trade.side);
  const side = trade.side || 'Unknown';
  const executedAt = trade.executedAt ? new Date(trade.executedAt).toISOString() : '';
  const quantity = toNumber(trade.quantity ?? trade.contracts ?? trade.entryPrice);
  const price = toNumber(trade.price ?? trade.exitPrice ?? trade.entryPrice);

  return [
    source,
    symbol,
    type,
    side,
    executedAt,
    quantity?.toFixed(8) ?? '',
    price?.toFixed(8) ?? '',
  ].join('|');
}

export function normalizeManualTrade(trade: TradeDetails): IndexedTrade {
  const tradeFingerprint = trade.tradeFingerprint || createTradeFingerprint({
    ...trade,
    source: trade.source ?? 'manual',
  });

  return {
    ...trade,
    source: trade.source ?? 'manual',
    tradeFingerprint,
    effectivePnl: toNumber(trade.closedPnl ?? trade.pnl),
  };
}

export function tradeFromCachedBybitTrade(trade: BybitCachedTrade): TradeDetails {
  return {
    id: trade.id,
    type: trade.type,
    symbol: trade.symbol,
    source: 'bybit',
    closedPnl: trade.closedPnl,
    pnl: trade.closedPnl,
    quantity: trade.quantity,
    contracts: trade.quantity,
    price: trade.price,
    fee: trade.fee,
    feeCurrency: trade.feeCurrency,
    externalTradeId: trade.externalTradeId,
    orderId: trade.orderId,
    executedAt: trade.executedAt,
    side: trade.side,
    tradeFingerprint: trade.tradeFingerprint,
    status: trade.closedPnl !== undefined ? 'closed' : 'unknown',
  };
}

export function tradeFromCachedBybitPosition(position: BybitCachedPosition): TradeDetails {
  return {
    id: position.externalPositionId,
    type: position.type,
    symbol: position.symbol,
    source: 'bybit',
    entryPrice: position.entryPrice,
    price: position.entryPrice,
    quantity: position.quantity,
    contracts: position.quantity,
    side: position.side,
    status: position.status,
    executedAt: position.updatedAt,
    externalTradeId: position.externalPositionId,
    orderId: position.externalPositionId,
    markPrice: position.markPrice,
    unrealizedPnl: position.unrealizedPnl,
    liquidationPrice: position.liquidationPrice,
    leverage: position.leverage,
    positionValue: position.positionValue,
    marginMode: position.marginMode,
    tradeFingerprint: createTradeFingerprint({
      source: 'bybit',
      symbol: position.symbol,
      type: position.type,
      side: position.side,
      executedAt: position.updatedAt,
      quantity: position.quantity,
      price: position.entryPrice,
    }),
  };
}

export function findDuplicateTrade(
  candidate: Partial<TradeDetails>,
  existingTrades: TradeDetails[]
): TradeDetails | undefined {
  const candidateExternalId = candidate.externalTradeId;
  const candidateFingerprint = candidate.tradeFingerprint || createTradeFingerprint(candidate);

  return existingTrades.find((trade) => {
    if (candidateExternalId && trade.externalTradeId === candidateExternalId) {
      return true;
    }
    const currentFingerprint = trade.tradeFingerprint || createTradeFingerprint(trade);
    return !!candidateFingerprint && currentFingerprint === candidateFingerprint;
  });
}

export function getEntryTradingIndex(entry: EmotionEntry): IndexedTrade[] {
  const indexed = (entry.tradingData?.trades ?? []).map(normalizeManualTrade);
  const deduped: IndexedTrade[] = [];

  for (const trade of indexed) {
    const existingIndex = deduped.findIndex((existingTrade) => {
      if (trade.externalTradeId && existingTrade.externalTradeId === trade.externalTradeId) {
        return true;
      }

      return existingTrade.tradeFingerprint === trade.tradeFingerprint;
    });

    if (existingIndex === -1) {
      deduped.push(trade);
      continue;
    }

    const existing = deduped[existingIndex];
    if (existing.source === 'bybit') continue;
    if (trade.source === 'bybit') {
      deduped[existingIndex] = trade;
    }
  }

  return deduped;
}

export function getResolvedEntryPnl(entry: EmotionEntry): number | undefined {
  if (typeof entry.pnl === 'number' && Number.isFinite(entry.pnl)) {
    return entry.pnl;
  }

  const indexedTrades = getEntryTradingIndex(entry);
  const total = indexedTrades.reduce((sum, trade) => {
    return typeof trade.effectivePnl === 'number' ? sum + trade.effectivePnl : sum;
  }, 0);

  return indexedTrades.some((trade) => typeof trade.effectivePnl === 'number') ? total : undefined;
}

export function buildTradingIndex(entries: EmotionEntry[]) {
  return entries.map((entry) => {
    const trades = getEntryTradingIndex(entry);
    const pnl = getResolvedEntryPnl(entry);

    return {
      entry,
      trades,
      pnl,
    };
  });
}
