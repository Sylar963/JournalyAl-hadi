import type {
  BybitConnection,
  BybitCredentialInput,
  BybitTradeCacheResult,
  ThalexConnection,
  ThalexCredentialInput,
  ThalexTradeCacheResult,
  TradingConnection,
  TradingCredentialInput,
  TradingTradeCacheResult,
  TradingProvider,
  TradingProviderDefinition,
} from '../types';
import {
  deleteBybitConnection,
  getBybitConnection,
  getCachedBybitTradesForDate,
  refreshBybitTradesForDate,
  saveBybitConnection,
  validateBybitConnection,
  deleteThalexConnection,
  getThalexConnection,
  getCachedThalexTradesForDate,
  refreshThalexTradesForDate,
  saveThalexConnection,
  validateThalexConnection,
} from './dataService';

export interface TradingProviderClient<
  TConnection extends TradingConnection = TradingConnection,
  TCredentialInput extends TradingCredentialInput = TradingCredentialInput,
  TTradeCacheResult extends TradingTradeCacheResult = TradingTradeCacheResult,
> {
  definition: TradingProviderDefinition;
  getConnection: () => Promise<TConnection | null>;
  saveConnection: (input: TCredentialInput) => Promise<TConnection>;
  validateConnection: (input: TCredentialInput) => Promise<TConnection>;
  deleteConnection: () => Promise<void>;
  getCachedTradesForDate: (date: string) => Promise<TTradeCacheResult>;
  refreshTradesForDate: (date: string, timezone: string) => Promise<TTradeCacheResult>;
}

export const tradingProviderDefinitions: TradingProviderDefinition[] = [
  {
    id: 'bybit',
    label: 'Bybit',
    availability: 'active',
    capabilities: ['trade_history'],
  },
  {
    id: 'hyperliquid',
    label: 'Hyperliquid',
    availability: 'active',
    capabilities: ['market_data'],
  },
  {
    id: 'thalex',
    label: 'Thalex',
    availability: 'active',
    capabilities: ['trade_history'],
  },
];

const bybitProviderClient: TradingProviderClient<BybitConnection, BybitCredentialInput, BybitTradeCacheResult> = {
  definition: tradingProviderDefinitions[0],
  getConnection: getBybitConnection,
  saveConnection: (input) => saveBybitConnection({ ...input, provider: 'bybit' }),
  validateConnection: (input) => validateBybitConnection({ ...input, provider: 'bybit' }),
  deleteConnection: deleteBybitConnection,
  getCachedTradesForDate: getCachedBybitTradesForDate,
  refreshTradesForDate: refreshBybitTradesForDate,
};

const thalexProviderClient: TradingProviderClient<ThalexConnection, ThalexCredentialInput, ThalexTradeCacheResult> = {
  definition: tradingProviderDefinitions[2],
  getConnection: getThalexConnection,
  saveConnection: (input) => saveThalexConnection({ ...input, provider: 'thalex' }),
  validateConnection: (input) => validateThalexConnection({ ...input, provider: 'thalex' }),
  deleteConnection: deleteThalexConnection,
  getCachedTradesForDate: getCachedThalexTradesForDate,
  refreshTradesForDate: refreshThalexTradesForDate,
};

const providerClients: Partial<Record<TradingProvider, TradingProviderClient>> = {
  bybit: bybitProviderClient,
  thalex: thalexProviderClient,
};

export function getTradingProviderClient(provider: 'bybit'): TradingProviderClient<BybitConnection, BybitCredentialInput, BybitTradeCacheResult>;
export function getTradingProviderClient(provider: 'thalex'): TradingProviderClient<ThalexConnection, ThalexCredentialInput, ThalexTradeCacheResult>;
export function getTradingProviderClient(provider: TradingProvider): TradingProviderClient {
  const client = providerClients[provider];
  if (!client) {
    throw new Error(`${provider} integration is not implemented yet.`);
  }
  return client;
}
