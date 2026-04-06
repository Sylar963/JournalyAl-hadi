import { buildTradingIndex, createTradeFingerprint, findDuplicateTrade, getResolvedEntryPnl } from '../services/tradingIndexService';
import type { EmotionEntry, TradeDetails } from '../types';

describe('tradingIndexService', () => {
  it('creates stable trade fingerprints for equivalent trades', () => {
    const fingerprintA = createTradeFingerprint({
      source: 'manual',
      symbol: 'btcusdt',
      type: 'Long Future',
      side: 'Buy',
      executedAt: '2026-04-06T12:00:00.000Z',
      quantity: 1,
      price: 100000,
    });

    const fingerprintB = createTradeFingerprint({
      source: 'manual',
      symbol: 'BTCUSDT',
      type: 'Long Future',
      side: 'Buy',
      executedAt: '2026-04-06T12:00:00.000Z',
      quantity: 1,
      price: 100000,
    });

    expect(fingerprintA).toBe(fingerprintB);
  });

  it('prefers imported Bybit trades when a manual duplicate exists', () => {
    const bybitTrade: TradeDetails = {
      id: 'bybit-1',
      type: 'Long Future',
      symbol: 'BTCUSDT',
      source: 'bybit',
      side: 'Buy',
      quantity: 1,
      price: 100000,
      executedAt: '2026-04-06T12:00:00.000Z',
      closedPnl: 120,
      externalTradeId: 'order-1',
      tradeFingerprint: 'dupe',
    };

    const manualTrade: TradeDetails = {
      id: 'manual-1',
      type: 'Long Future',
      symbol: 'BTCUSDT',
      source: 'manual',
      side: 'Buy',
      quantity: 1,
      price: 100000,
      executedAt: '2026-04-06T12:00:00.000Z',
      pnl: 90,
      tradeFingerprint: 'dupe',
    };

    const entries: EmotionEntry[] = [{
      date: '2026-04-06',
      emotion: 'calm',
      intensity: 5,
      notes: null,
      tradingData: { trades: [manualTrade, bybitTrade] },
    }];

    const indexed = buildTradingIndex(entries);
    expect(indexed[0].trades).toHaveLength(1);
    expect(indexed[0].trades[0].source).toBe('bybit');
    expect(indexed[0].pnl).toBe(120);
  });

  it('falls back to trade-level pnl when entry pnl is empty', () => {
    const entry: EmotionEntry = {
      date: '2026-04-06',
      emotion: 'happy',
      intensity: 8,
      notes: null,
      tradingData: {
        trades: [
          {
            id: 'trade-a',
            type: 'Long Future',
            symbol: 'BTCUSDT',
            source: 'bybit',
            closedPnl: 80,
            externalTradeId: 'order-a',
            tradeFingerprint: 'a',
          },
          {
            id: 'trade-b',
            type: 'Short Future',
            symbol: 'ETHUSDT',
            source: 'manual',
            pnl: -30,
            tradeFingerprint: 'b',
          },
        ],
      },
    };

    expect(getResolvedEntryPnl(entry)).toBe(50);
  });

  it('detects duplicates by external ID or fingerprint', () => {
    const trades: TradeDetails[] = [{
      id: 'existing',
      type: 'Long Future',
      symbol: 'BTCUSDT',
      source: 'bybit',
      externalTradeId: 'order-1',
      tradeFingerprint: 'same',
    }];

    expect(findDuplicateTrade({ externalTradeId: 'order-1' }, trades)).toBeTruthy();
    expect(findDuplicateTrade({ tradeFingerprint: 'same' }, trades)).toBeTruthy();
    expect(findDuplicateTrade({ tradeFingerprint: 'different' }, trades)).toBeUndefined();
  });
});
