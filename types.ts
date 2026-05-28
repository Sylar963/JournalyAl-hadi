import type { Session, User } from '@supabase/supabase-js';

export type { Session, User };

export type EmotionType = 'confident' | 'composed' | 'anxious' | 'hesitant' | 'frustrated' | 'euphoric' | 'fomo' | 'maxPain';

export type ActiveView = 'journal' | 'trends' | 'reports' | 'history' | 'settings' | 'review';

export type Theme = 'insilico' | 'cscalp' | 'bloomberg';
export type TradeSource = 'manual' | 'bybit' | 'thalex';
export type TradingProvider = 'bybit' | 'hyperliquid' | 'thalex';
export type TradingProviderCapability = 'trade_history' | 'market_data';
export type TradingProviderAvailability = 'active' | 'planned';
export type BybitEnvironment = 'mainnet' | 'testnet';
export type BybitValidationStatus = 'not_connected' | 'pending' | 'valid' | 'invalid' | 'permission_denied';
export type ThalexEnvironment = 'mainnet' | 'testnet';
export type ThalexValidationStatus = 'not_connected' | 'pending' | 'valid' | 'invalid';
export type ThalexInstrumentType = 'option' | 'future' | 'perpetual' | 'combination' | 'unknown';
export type TradePnlSource = 'manual' | 'linked_trades';
export type TradeSide = 'Buy' | 'Sell' | 'Unknown';
export type TradeStatus = 'open' | 'closed' | 'unknown';

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
  status?: TradeStatus;
  markPrice?: number;
  unrealizedPnl?: number;
  liquidationPrice?: number;
  leverage?: number;
  positionValue?: number;
  marginMode?: 'cross' | 'isolated' | 'unknown';
  tradeFingerprint?: string;
  notes?: string;
}

export interface TradingProviderDefinition {
  id: TradingProvider;
  label: string;
  availability: TradingProviderAvailability;
  capabilities: TradingProviderCapability[];
}

export interface TiltMetrics {
  score: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  triggers: string[];
  predictedBehavior?: string;
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
  tiltMetrics?: TiltMetrics;
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
  provider?: TradingProvider;
  apiKey?: string;
  apiSecret?: string;
}

export interface BybitConnection extends TradingConnection {
  provider: 'bybit';
  environment: BybitEnvironment;
}

export interface BybitCredentialInput extends TradingCredentialInput {
  provider?: 'bybit';
  environment: BybitEnvironment;
  apiKey: string;     // required for Bybit
  apiSecret: string;  // required for Bybit
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

export interface TradingCachedPosition {
  provider: TradingProvider;
  symbol: string;
  side: TradeSide;
  status: Extract<TradeStatus, 'open' | 'closed'>;
  quantity: number;
  entryPrice?: number;
  markPrice?: number;
  unrealizedPnl?: number;
  liquidationPrice?: number;
  leverage?: number;
  positionValue?: number;
  marginMode?: 'cross' | 'isolated' | 'unknown';
  updatedAt?: string;
  externalPositionId: string;
  type: TradeDetails['type'];
}

export interface BybitCachedTrade extends TradingCachedTrade {
  provider: 'bybit';
  id: string;
  environment: BybitEnvironment;
  tradeDay: string;
  rawExecution?: Record<string, unknown>;
  rawClosedPnl?: Record<string, unknown> | null;
}

export interface BybitCachedPosition extends TradingCachedPosition {
  provider: 'bybit';
  id: string;
  environment: BybitEnvironment;
  rawPosition?: Record<string, unknown>;
}

export interface TradingTradeCacheResult {
  trades: TradingCachedTrade[];
  positions?: TradingCachedPosition[];
  connection: TradingConnection | null;
  refreshedAt?: string;
  syncError?: string | null;
}

export interface BybitTradeCacheResult extends TradingTradeCacheResult {
  trades: BybitCachedTrade[];
  positions: BybitCachedPosition[];
  connection: BybitConnection | null;
}

// ---- Thalex Types ----

export interface ThalexConnection extends TradingConnection {
  provider: 'thalex';
  environment: ThalexEnvironment;
  keyNameMasked: string;
  keyNameLast4: string;
  validationStatus: ThalexValidationStatus;
}

export interface ThalexCredentialInput extends TradingCredentialInput {
  provider?: 'thalex';
  environment: ThalexEnvironment;
  keyName: string;       // The key name from Thalex (e.g. K123456789)
  privateKeyPem: string; // RSA private key in PEM format
}

export interface ThalexCachedTrade extends TradingCachedTrade {
  provider: 'thalex';
  id: string;
  environment: ThalexEnvironment;
  tradeDay: string;
  instrumentType: ThalexInstrumentType;
  /** Raw object returned by Thalex /private/trade_history */
  rawTrade?: Record<string, unknown>;
}

export interface ThalexCachedPosition extends TradingCachedPosition {
  provider: 'thalex';
  id: string;
  environment: ThalexEnvironment;
  instrumentType: ThalexInstrumentType;
  /** Raw object returned by Thalex /private/portfolio */
  rawPosition?: Record<string, unknown>;
}

export interface ThalexTradeCacheResult extends TradingTradeCacheResult {
  trades: ThalexCachedTrade[];
  positions: ThalexCachedPosition[];
  connection: ThalexConnection | null;
}

// ---- End Thalex Types ----

export interface ReportAnalysis {
    summary: string;
    emotionFrequency: string;
    intensityTrend: string;
    insights: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  alias: string;
  picture?: string; // base64 encoded image
  journalPurpose?: string;
  memoryNotes?: string;
}

export interface AppDataSnapshot {
  entries: Record<string, EmotionEntry>;
  profile: UserProfile;
  quests: Quest[];
  reviews: PerformanceReview[];
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
  [key: string]: unknown;
}

export type BiasView = 'daily' | 'weekly';
export type BiasDirection = 'bullish' | 'bearish' | 'neutral';

export interface DailyBiasWidgetData extends WidgetData {
  view?: BiasView;
  dailyBias?: BiasDirection;
  dailyNotes?: string;
  weeklyBias?: BiasDirection;
  weeklyNotes?: string;
}

export interface ChecklistTask {
  id: number;
  text: string;
  done: boolean;
}

export interface ChecklistWidgetData extends WidgetData {
  tasks?: ChecklistTask[];
}

export interface CorrelationMatrixWidgetData extends WidgetData {
  baseAsset?: string;
  targetAssets?: string[];
}

export interface RoutinePluginComponentProps<TData extends WidgetData = WidgetData> {
  data: TData;
  onUpdate: (data: TData) => void;
  isLocked?: boolean;
}

export interface RoutinePlugin<TData extends WidgetData = WidgetData> {
  id: string;
  title: string;
  description: string;
  defaultSize: { w: number; h: number }; // Grid units
  component: React.ComponentType<RoutinePluginComponentProps<TData>>;
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
  thesis: BiasDirection | null;
  lastUpdated: string;
}

export interface AppBackupPayload {
  version: 1;
  appVersion: string;
  exportedAt: string;
  source: 'local' | 'supabase';
  data: AppDataSnapshot;
  preferences?: {
    theme?: Theme;
  };
  routines?: Record<string, RoutineLayout>;
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
