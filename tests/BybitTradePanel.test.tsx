import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BybitTradePanel from '../components/BybitTradePanel';
import { I18nProvider } from '../hooks/useI18n';

vi.mock('../services/dataService', () => ({
  getBybitConnection: vi.fn(),
  getCachedBybitTradesForDate: vi.fn(),
  refreshBybitTradesForDate: vi.fn(),
}));

import { getBybitConnection, getCachedBybitTradesForDate, refreshBybitTradesForDate } from '../services/dataService';

const mockedGetBybitConnection = vi.mocked(getBybitConnection);
const mockedGetCachedBybitTradesForDate = vi.mocked(getCachedBybitTradesForDate);
const mockedRefreshBybitTradesForDate = vi.mocked(refreshBybitTradesForDate);

function renderPanel(overrides: Partial<React.ComponentProps<typeof BybitTradePanel>> = {}) {
  return render(
    <I18nProvider>
      <BybitTradePanel
        date="2026-04-06"
        isToday
        isBybitAvailable
        selectedTrades={[]}
        onSelectTrade={vi.fn()}
        {...overrides}
      />
    </I18nProvider>
  );
}

describe('BybitTradePanel', () => {
  beforeEach(() => {
    mockedGetBybitConnection.mockReset();
    mockedGetCachedBybitTradesForDate.mockReset();
    mockedRefreshBybitTradesForDate.mockReset();
  });

  it('shows the unavailable fallback outside Supabase mode', () => {
    renderPanel({ isBybitAvailable: false });
    expect(screen.getByText(/Bybit import is available only in authenticated Supabase mode/i)).toBeInTheDocument();
  });

  it('loads cached trades and links a trade once', async () => {
    const onSelectTrade = vi.fn();
    mockedGetBybitConnection.mockResolvedValue({
      environment: 'mainnet',
      apiKeyMasked: 'ABCD****WXYZ',
      apiKeyLast4: 'WXYZ',
      validationStatus: 'valid',
      permissionSnapshot: {},
    });
    mockedGetCachedBybitTradesForDate.mockResolvedValue({
      connection: {
        environment: 'mainnet',
        apiKeyMasked: 'ABCD****WXYZ',
        apiKeyLast4: 'WXYZ',
        validationStatus: 'valid',
        permissionSnapshot: {},
      },
      trades: [{
        id: '1',
        environment: 'mainnet',
        tradeDay: '2026-04-06',
        externalTradeId: 'order-1',
        orderId: 'order-1',
        symbol: 'BTCUSDT',
        side: 'Buy',
        executedAt: '2026-04-06T12:00:00.000Z',
        quantity: 1,
        price: 100000,
        closedPnl: 50,
        type: 'Long Future',
        tradeFingerprint: 'abc',
      }],
    });
    mockedRefreshBybitTradesForDate.mockResolvedValue({
      connection: {
        environment: 'mainnet',
        apiKeyMasked: 'ABCD****WXYZ',
        apiKeyLast4: 'WXYZ',
        validationStatus: 'valid',
        permissionSnapshot: {},
        lastSyncAt: '2026-04-06T12:00:00.000Z',
      },
      trades: [{
        id: '1',
        environment: 'mainnet',
        tradeDay: '2026-04-06',
        externalTradeId: 'order-1',
        orderId: 'order-1',
        symbol: 'BTCUSDT',
        side: 'Buy',
        executedAt: '2026-04-06T12:00:00.000Z',
        quantity: 1,
        price: 100000,
        closedPnl: 50,
        type: 'Long Future',
        tradeFingerprint: 'abc',
      }],
    });

    renderPanel({ onSelectTrade });

    await waitFor(() => {
      expect(screen.getByText('BTCUSDT')).toBeInTheDocument();
    });

    expect(mockedRefreshBybitTradesForDate).toHaveBeenCalledWith('2026-04-06', expect.any(String));

    fireEvent.click(screen.getByRole('button', { name: /link trade/i }));
    expect(onSelectTrade).toHaveBeenCalledTimes(1);
  });
});
