import type { Session, User } from '@supabase/supabase-js';

export type { Session, User };

export type EmotionType = 'happy' | 'calm' | 'anxious' | 'sad' | 'angry';

export type ActiveView = 'journal' | 'trends' | 'reports' | 'history' | 'settings' | 'review';

export type Theme = 'twilight' | 'sunrise' | 'cyberpunk' | 'forest';
export type TradeSource = 'manual' | 'bybit';
export type TradingProvider = 'bybit' | 'hyperliquid';
export type TradingProviderCapability = 'trade_history' | 'market_data';
export type TradingProviderAvailability = 'active' | 'planned';
export type BybitEnvironment = 'mainnet' | 'testnet';
export type BybitValidationStatus = 'not_connected' | 'pending' | 'valid' | 'invalid' | 'permission_denied';
export type TradePnlSource = 'manual' | 'linked_trades';
export type TradeSide = 'Buy' | 'Sell' | 'Unknown';

export interface ThemeConfig {
  id: Theme;
  label: string;
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
  };
}


export interface TradeDetails {
  id: string;
  type: 'Long Future' | 'Short Future' | 'BTO Call' | 'BTO Put' | 'STC Call' | 'STC Put' | 'STO Call' | 'STO Put' | 'BTC Call' | 'BTC Put';
  symbol: string;
  source?: TradeSource;
  pnl?: number;
  closedPnl?: number;
  entryPrice?: number;
  exitPrice?: number;
  contracts?: number;
  quantity?: number;
  price?: number;
  fee?: number;
  feeCurrency?: string;
  externalTradeId?: string;
  orderId?: string;
  executedAt?: string;
  side?: TradeSide;
  tradeFingerprint?: string;
  notes?: string;
}

export interface TradingProviderDefinition {
  id: TradingProvider;
  label: string;
  availability: TradingProviderAvailability;
  capabilities: TradingProviderCapability[];
}

export interface EmotionEntry {
  date: string; // YYYY-MM-DD
  emotion: EmotionType;
  intensity: number; // 1-10
  notes: string | null;
  imageUrl?: string; // base64 encoded image
  pnl?: number;
  tradingData?: {
    trades: TradeDetails[];
    pnlSource?: TradePnlSource;
  };
}

export interface TradingConnection {
  provider: TradingProvider;
  apiKeyMasked: string;
  apiKeyLast4: string;
  validationStatus: BybitValidationStatus;
  permissionSnapshot: Record<string, unknown> | null;
  lastValidatedAt?: string;
  lastSyncAt?: string;
  syncStatus?: 'idle' | 'syncing' | 'ready' | 'error';
  syncError?: string | null;
}

export interface TradingCredentialInput {
  provider: TradingProvider;
  apiKey: string;
  apiSecret: string;
}

export interface BybitConnection extends TradingConnection {
  provider: 'bybit';
  environment: BybitEnvironment;
}

export interface BybitCredentialInput extends Omit<TradingCredentialInput, 'provider'> {
  provider?: 'bybit';
  environment: BybitEnvironment;
}

export interface TradingCachedTrade {
  provider: TradingProvider;
  symbol: string;
  externalTradeId: string;
  orderId: string;
  side: TradeSide;
  executedAt: string;
  quantity: number;
  price: number;
  fee?: number;
  feeCurrency?: string;
  closedPnl?: number;
  type: TradeDetails['type'];
  tradeFingerprint: string;
}

export interface BybitCachedTrade extends TradingCachedTrade {
  provider: 'bybit';
  id: string;
  environment: BybitEnvironment;
  tradeDay: string;
  rawExecution?: Record<string, unknown>;
  rawClosedPnl?: Record<string, unknown> | null;
}

export interface TradingTradeCacheResult {
  trades: TradingCachedTrade[];
  connection: TradingConnection | null;
  refreshedAt?: string;
  syncError?: string | null;
}

export interface BybitTradeCacheResult extends TradingTradeCacheResult {
  trades: BybitCachedTrade[];
  connection: BybitConnection | null;
}

export interface ReportAnalysis {
    summary: string;
    emotionFrequency: string;
    intensityTrend: string;
    insights: string;
}

export interface UserProfile {
  name: string;
  alias: string;
  picture?: string; // base64 encoded image
  journalPurpose?: string;
}

export interface MonthlySummary {
    year: number;
    month: number; // 0-11
    totalEntries: number;
    mostFrequent: EmotionType | 'N/A';
    avgIntensity: number;
    emotionCounts: Record<EmotionType, number>;
}

export interface Quest {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

// Pre-Market Routine Types

export interface WidgetData {
  [key: string]: any;
}

export interface RoutinePlugin {
  id: string;
  title: string;
  description: string;
  defaultSize: { w: number; h: number }; // Grid units
  component: React.ComponentType<{ data: any; onUpdate: (data: any) => void; isLocked?: boolean }>;
  icon?: React.ReactNode;
}

export interface RoutineLayoutItem {
  i: string; // Plugin ID instance
  x: number;
  y: number;
  w: number;
  h: number;
  pluginId: string;
  data: WidgetData;
}

export interface RoutineLayout {
  items: RoutineLayoutItem[];
  thesis: 'bullish' | 'bearish' | 'neutral' | null;
  lastUpdated: string;
}

// Performance Review Types
export interface ReviewQuestion {
  id: string;
  text: string;
  type: 'text' | 'textarea';
  placeholder?: string;
}

export interface ReviewSection {
  id: string;
  title: string;
  description?: string;
  questions: ReviewQuestion[];
}

export interface ReviewAnswer {
  questionId: string;
  answer: string;
}

export interface PerformanceReview {
  id?: string;
  year: number;
  userId: string;
  sections: {
    sectionId: string;
    answers: ReviewAnswer[];
  }[];
  createdAt?: string;
  updatedAt?: string;
}
