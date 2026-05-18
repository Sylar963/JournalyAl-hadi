import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type BybitCachedPosition, type BybitCachedTrade, type BybitConnection, type BybitCredentialInput, type BybitTradeCacheResult, type EmotionEntry, type UserProfile, type EmotionType, type Quest, type TradeDetails, type PerformanceReview, type ThalexConnection, type ThalexCredentialInput, type ThalexCachedTrade, type ThalexCachedPosition, type ThalexTradeCacheResult, type ThalexEnvironment, type ThalexInstrumentType } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { getErrorMessage, hasErrorCode } from '../utils/errorHelpers';
import { normalizeEmotionValue } from '../utils/emotions';
import { createTradeFingerprint, normalizeEntryTradingData, resolveFutureTradeType, tradeFromCachedBybitPosition, tradeFromCachedBybitTrade } from './tradingIndexService';

export type Database = {
  public: {
    Tables: {
      entries: {
        Row: {
          date: string;
          emotion: string;
          intensity: number;
          notes: string | null;
          user_id: string;
          image_url: string | null;
          pnl: number | null;
          trading_data: EmotionEntry['tradingData'] | null;
        };
        Update: {
          date?: string;
          emotion?: string;
          intensity?: number;
          notes?: string | null;
          user_id?: string;
          image_url?: string | null;
          pnl?: number | null;
          trading_data?: EmotionEntry['tradingData'] | null;
        };
        Insert: {
          date: string;
          emotion: string;
          intensity: number;
          notes?: string | null;
          user_id: string;
          image_url?: string | null;
          pnl?: number | null;
          trading_data?: { trades: TradeDetails[] } | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string; 
          name: string;
          alias: string;
          picture: string | null;
          updated_at: string | null;
          journal_purpose: string | null;
        };
        Insert: {
          id: string; 
          name: string;
          alias: string;
          picture: string | null;
          updated_at: string | null;
          journal_purpose: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          alias?: string;
          picture?: string | null;
          updated_at?: string | null;
          journal_purpose?: string | null;
        };
        Relationships: [];
      };
      quests: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          data: { sections: { sectionId: string; answers: { questionId: string; answer: string }[] }[] };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          data: { sections: { sectionId: string; answers: { questionId: string; answer: string }[] }[] };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year?: number;
          data?: { sections: { sectionId: string; answers: { questionId: string; answer: string }[] }[] };
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bybit_connections: {
        Row: {
          user_id: string;
          environment: 'mainnet' | 'testnet';
          api_key_ciphertext: string;
          api_key_iv: string;
          api_key_masked: string;
          api_key_last4: string;
          secret_ciphertext: string;
          secret_iv: string;
          secret_version: string;
          validation_status: 'not_connected' | 'pending' | 'valid' | 'invalid' | 'permission_denied';
          permission_snapshot: Record<string, unknown> | null;
          last_validated_at: string | null;
          last_sync_at: string | null;
          sync_status: 'idle' | 'syncing' | 'ready' | 'error' | null;
          sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          environment: 'mainnet' | 'testnet';
          api_key_ciphertext: string;
          api_key_iv: string;
          api_key_masked: string;
          api_key_last4: string;
          secret_ciphertext: string;
          secret_iv: string;
          secret_version?: string;
          validation_status?: 'not_connected' | 'pending' | 'valid' | 'invalid' | 'permission_denied';
          permission_snapshot?: Record<string, unknown> | null;
          last_validated_at?: string | null;
          last_sync_at?: string | null;
          sync_status?: 'idle' | 'syncing' | 'ready' | 'error' | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          environment?: 'mainnet' | 'testnet';
          api_key_ciphertext?: string;
          api_key_iv?: string;
          api_key_masked?: string;
          api_key_last4?: string;
          secret_ciphertext?: string;
          secret_iv?: string;
          secret_version?: string;
          validation_status?: 'not_connected' | 'pending' | 'valid' | 'invalid' | 'permission_denied';
          permission_snapshot?: Record<string, unknown> | null;
          last_validated_at?: string | null;
          last_sync_at?: string | null;
          sync_status?: 'idle' | 'syncing' | 'ready' | 'error' | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      bybit_trade_cache: {
        Row: {
          id: string;
          user_id: string;
          environment: 'mainnet' | 'testnet';
          trade_day: string;
          external_trade_id: string;
          order_id: string;
          symbol: string;
          side: 'Buy' | 'Sell' | 'Unknown';
          executed_at: string;
          exec_qty: number;
          exec_price: number;
          exec_fee: number | null;
          fee_currency: string | null;
          closed_pnl: number | null;
          raw_execution: Record<string, unknown> | null;
          raw_closed_pnl: Record<string, unknown> | null;
          trade_fingerprint: string;
          synced_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          environment: 'mainnet' | 'testnet';
          trade_day: string;
          external_trade_id: string;
          order_id: string;
          symbol: string;
          side: 'Buy' | 'Sell' | 'Unknown';
          executed_at: string;
          exec_qty: number;
          exec_price: number;
          exec_fee?: number | null;
          fee_currency?: string | null;
          closed_pnl?: number | null;
          raw_execution?: Record<string, unknown> | null;
          raw_closed_pnl?: Record<string, unknown> | null;
          trade_fingerprint: string;
          synced_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          environment?: 'mainnet' | 'testnet';
          trade_day?: string;
          external_trade_id?: string;
          order_id?: string;
          symbol?: string;
          side?: 'Buy' | 'Sell' | 'Unknown';
          executed_at?: string;
          exec_qty?: number;
          exec_price?: number;
          exec_fee?: number | null;
          fee_currency?: string | null;
          closed_pnl?: number | null;
          raw_execution?: Record<string, unknown> | null;
          raw_closed_pnl?: Record<string, unknown> | null;
          trade_fingerprint?: string;
          synced_at?: string;
        };
        Relationships: [];
      };
      bybit_position_cache: {
        Row: {
          id: string;
          user_id: string;
          environment: 'mainnet' | 'testnet';
          symbol: string;
          side: 'Buy' | 'Sell' | 'Unknown';
          position_status: 'open' | 'closed';
          size: number;
          entry_price: number | null;
          mark_price: number | null;
          unrealized_pnl: number | null;
          liquidation_price: number | null;
          leverage: number | null;
          position_value: number | null;
          margin_mode: 'cross' | 'isolated' | 'unknown';
          external_position_id: string;
          updated_at: string | null;
          raw_position: Record<string, unknown> | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          environment: 'mainnet' | 'testnet';
          symbol: string;
          side: 'Buy' | 'Sell' | 'Unknown';
          position_status?: 'open' | 'closed';
          size: number;
          entry_price?: number | null;
          mark_price?: number | null;
          unrealized_pnl?: number | null;
          liquidation_price?: number | null;
          leverage?: number | null;
          position_value?: number | null;
          margin_mode?: 'cross' | 'isolated' | 'unknown';
          external_position_id: string;
          updated_at?: string | null;
          raw_position?: Record<string, unknown> | null;
          synced_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          environment?: 'mainnet' | 'testnet';
          symbol?: string;
          side?: 'Buy' | 'Sell' | 'Unknown';
          position_status?: 'open' | 'closed';
          size?: number;
          entry_price?: number | null;
          mark_price?: number | null;
          unrealized_pnl?: number | null;
          liquidation_price?: number | null;
          leverage?: number | null;
          position_value?: number | null;
          margin_mode?: 'cross' | 'isolated' | 'unknown';
          external_position_id?: string;
          updated_at?: string | null;
          raw_position?: Record<string, unknown> | null;
          synced_at?: string;
        };
        Relationships: [];
      };
      thalex_connections: {
        Row: {
          user_id: string;
          environment: 'mainnet' | 'testnet';
          key_name: string;
          key_name_masked: string;
          key_name_last4: string;
          private_key_ciphertext: string;
          private_key_iv: string;
          private_key_version: string;
          validation_status: 'not_connected' | 'pending' | 'valid' | 'invalid';
          permission_snapshot: Record<string, unknown> | null;
          last_validated_at: string | null;
          last_sync_at: string | null;
          sync_status: 'idle' | 'syncing' | 'ready' | 'error' | null;
          sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          environment: 'mainnet' | 'testnet';
          key_name: string;
          key_name_masked: string;
          key_name_last4: string;
          private_key_ciphertext: string;
          private_key_iv: string;
          private_key_version?: string;
          validation_status?: 'not_connected' | 'pending' | 'valid' | 'invalid';
          permission_snapshot?: Record<string, unknown> | null;
          last_validated_at?: string | null;
          last_sync_at?: string | null;
          sync_status?: 'idle' | 'syncing' | 'ready' | 'error' | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          environment?: 'mainnet' | 'testnet';
          key_name?: string;
          key_name_masked?: string;
          key_name_last4?: string;
          private_key_ciphertext?: string;
          private_key_iv?: string;
          private_key_version?: string;
          validation_status?: 'not_connected' | 'pending' | 'valid' | 'invalid';
          permission_snapshot?: Record<string, unknown> | null;
          last_validated_at?: string | null;
          last_sync_at?: string | null;
          sync_status?: 'idle' | 'syncing' | 'ready' | 'error' | null;
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      thalex_trade_cache: {
        Row: {
          id: string;
          user_id: string;
          environment: 'mainnet' | 'testnet';
          trade_day: string;
          external_trade_id: string;
          order_id: string;
          instrument_name: string;
          instrument_type: ThalexInstrumentType;
          side: 'Buy' | 'Sell' | 'Unknown';
          executed_at: string;
          quantity: number;
          price: number;
          fee: number | null;
          fee_currency: string | null;
          closed_pnl: number | null;
          trade_fingerprint: string;
          raw_trade: Record<string, unknown> | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          environment: 'mainnet' | 'testnet';
          trade_day: string;
          external_trade_id: string;
          order_id: string;
          instrument_name: string;
          instrument_type?: ThalexInstrumentType;
          side: 'Buy' | 'Sell' | 'Unknown';
          executed_at: string;
          quantity: number;
          price: number;
          fee?: number | null;
          fee_currency?: string | null;
          closed_pnl?: number | null;
          trade_fingerprint: string;
          raw_trade?: Record<string, unknown> | null;
          synced_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          environment?: 'mainnet' | 'testnet';
          trade_day?: string;
          external_trade_id?: string;
          order_id?: string;
          instrument_name?: string;
          instrument_type?: ThalexInstrumentType;
          side?: 'Buy' | 'Sell' | 'Unknown';
          executed_at?: string;
          quantity?: number;
          price?: number;
          fee?: number | null;
          fee_currency?: string | null;
          closed_pnl?: number | null;
          trade_fingerprint?: string;
          raw_trade?: Record<string, unknown> | null;
          synced_at?: string;
        };
        Relationships: [];
      };
      thalex_position_cache: {
        Row: {
          id: string;
          user_id: string;
          environment: 'mainnet' | 'testnet';
          instrument_name: string;
          instrument_type: ThalexInstrumentType;
          position: number;
          side: 'Buy' | 'Sell' | 'Unknown';
          position_status: 'open' | 'closed';
          mark_price: number | null;
          start_price: number | null;
          average_price: number | null;
          unrealised_pnl: number | null;
          realised_pnl: number | null;
          entry_value: number | null;
          iv: number | null;
          index_price: number | null;
          external_position_id: string;
          updated_at: string | null;
          raw_position: Record<string, unknown> | null;
          synced_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          environment: 'mainnet' | 'testnet';
          instrument_name: string;
          instrument_type?: ThalexInstrumentType;
          position: number;
          side: 'Buy' | 'Sell' | 'Unknown';
          position_status?: 'open' | 'closed';
          mark_price?: number | null;
          start_price?: number | null;
          average_price?: number | null;
          unrealised_pnl?: number | null;
          realised_pnl?: number | null;
          entry_value?: number | null;
          iv?: number | null;
          index_price?: number | null;
          external_position_id: string;
          updated_at?: string | null;
          raw_position?: Record<string, unknown> | null;
          synced_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          environment?: 'mainnet' | 'testnet';
          instrument_name?: string;
          instrument_type?: ThalexInstrumentType;
          position?: number;
          side?: 'Buy' | 'Sell' | 'Unknown';
          position_status?: 'open' | 'closed';
          mark_price?: number | null;
          start_price?: number | null;
          average_price?: number | null;
          unrealised_pnl?: number | null;
          realised_pnl?: number | null;
          entry_value?: number | null;
          iv?: number | null;
          index_price?: number | null;
          external_position_id?: string;
          updated_at?: string | null;
          raw_position?: Record<string, unknown> | null;
          synced_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
};

// --- Client Initialization ---
// The supabase client is initialized only if the required environment variables are present.
// This prevents a crash on module load if the app is intended to run in local-only mode.
export const supabase: SupabaseClient<Database> | null =
    (SUPABASE_URL && SUPABASE_ANON_KEY)
        ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
              persistSession: true,
              storageKey: 'dj-supabase-session',
              storage: {
                getItem: (key: string) => {
                  try {
                    return sessionStorage.getItem(key) ?? null;
                  } catch {
                    return null;
                  }
                },
                setItem: (_key: string, _value: string) => {
                  try {
                    sessionStorage.setItem(_key, _value);
                  } catch {
                    // Ignore storage errors (e.g., private browsing)
                  }
                },
                removeItem: (key: string) => {
                  try {
                    sessionStorage.removeItem(key);
                  } catch {
                    // Ignore
                  }
                },
              },
            },
          })
        : null;

export const isSupabaseConfigured = !!supabase;

// ====================================================================================
// SQL SETUP INSTRUCTIONS FOR SUPABASE
// Run the following SQL commands in your Supabase Project's SQL Editor
// to create the necessary tables and policies for the application to function.
// ====================================================================================

export const PROFILES_TABLE_SETUP_SQL = `
-- 1. Create the table for user profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  alias TEXT,
  picture TEXT,
  journal_purpose TEXT,
  updated_at TIMESTAMPTZ
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for profiles
CREATE POLICY "Users can manage their own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
`;

export const ENTRIES_TABLE_SETUP_SQL = `
-- 1. Create the table for journal entries
CREATE TABLE public.entries (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emotion TEXT NOT NULL,
  intensity INT NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  notes TEXT,
  image_url TEXT,
  pnl NUMERIC,
  trading_data JSONB,
  PRIMARY KEY (user_id, date) -- Ensures one entry per user per day and is used for upsert
);

-- 2. Enable Row Level Security
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for entries
CREATE POLICY "Users can manage their own entries"
ON public.entries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`;

export const QUESTS_TABLE_SETUP_SQL = `
-- 1. Create the table for quests
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for RLS
CREATE POLICY "Users can manage their own quests"
ON public.quests FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`;

export const SECURITY_RATE_LIMITS_TABLE_SETUP_SQL = `
-- Shared request throttling used by public and credential-sync edge functions
CREATE TABLE IF NOT EXISTS public.request_limits (
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  window_started_at TIMESTAMPTZ NOT NULL,
  attempt_count INT NOT NULL DEFAULT 1 CHECK (attempt_count >= 1),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (action, actor)
);

ALTER TABLE public.request_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION update_request_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_request_limits_updated_at ON public.request_limits;

CREATE TRIGGER update_request_limits_updated_at
BEFORE UPDATE ON public.request_limits
FOR EACH ROW
EXECUTE FUNCTION update_request_limits_updated_at();
`;

export const BYBIT_CONNECTIONS_TABLE_SETUP_SQL = `
-- 1. Create the table for encrypted Bybit credential metadata
CREATE TABLE IF NOT EXISTS public.bybit_connections (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  environment TEXT NOT NULL CHECK (environment IN ('mainnet', 'testnet')),
  api_key_ciphertext TEXT NOT NULL,
  api_key_iv TEXT NOT NULL,
  api_key_masked TEXT NOT NULL,
  api_key_last4 TEXT NOT NULL,
  secret_ciphertext TEXT NOT NULL,
  secret_iv TEXT NOT NULL,
  secret_version TEXT NOT NULL DEFAULT 'v1',
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('not_connected', 'pending', 'valid', 'invalid', 'permission_denied')),
  permission_snapshot JSONB,
  last_validated_at TIMESTAMPTZ,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'ready', 'error')),
  sync_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bybit_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own bybit connection" ON public.bybit_connections;

CREATE OR REPLACE FUNCTION update_bybit_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bybit_connections_updated_at ON public.bybit_connections;

CREATE TRIGGER update_bybit_connections_updated_at
    BEFORE UPDATE ON public.bybit_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_bybit_connections_updated_at();
`;

export const BYBIT_TRADE_CACHE_TABLE_SETUP_SQL = `
-- 1. Create the cache for normalized Bybit trades
CREATE TABLE IF NOT EXISTS public.bybit_trade_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  environment TEXT NOT NULL CHECK (environment IN ('mainnet', 'testnet')),
  trade_day DATE NOT NULL,
  external_trade_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('Buy', 'Sell', 'Unknown')),
  executed_at TIMESTAMPTZ NOT NULL,
  exec_qty NUMERIC NOT NULL,
  exec_price NUMERIC NOT NULL,
  exec_fee NUMERIC,
  fee_currency TEXT,
  closed_pnl NUMERIC,
  raw_execution JSONB,
  raw_closed_pnl JSONB,
  trade_fingerprint TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, environment, external_trade_id)
);

CREATE INDEX IF NOT EXISTS bybit_trade_cache_user_day_idx
ON public.bybit_trade_cache (user_id, trade_day, executed_at DESC);

ALTER TABLE public.bybit_trade_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own bybit cache" ON public.bybit_trade_cache;

CREATE POLICY "Users can read their own bybit cache"
ON public.bybit_trade_cache FOR SELECT
USING (auth.uid() = user_id);
`;

export const BYBIT_POSITION_CACHE_TABLE_SETUP_SQL = `
-- 1. Create the cache for live Bybit positions
CREATE TABLE IF NOT EXISTS public.bybit_position_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  environment TEXT NOT NULL CHECK (environment IN ('mainnet', 'testnet')),
  symbol TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('Buy', 'Sell', 'Unknown')),
  position_status TEXT NOT NULL DEFAULT 'open' CHECK (position_status IN ('open', 'closed')),
  size NUMERIC NOT NULL,
  entry_price NUMERIC,
  mark_price NUMERIC,
  unrealized_pnl NUMERIC,
  liquidation_price NUMERIC,
  leverage NUMERIC,
  position_value NUMERIC,
  margin_mode TEXT NOT NULL DEFAULT 'unknown' CHECK (margin_mode IN ('cross', 'isolated', 'unknown')),
  external_position_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ,
  raw_position JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, environment, external_position_id)
);

CREATE INDEX IF NOT EXISTS bybit_position_cache_user_env_idx
ON public.bybit_position_cache (user_id, environment, symbol);

ALTER TABLE public.bybit_position_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own bybit positions" ON public.bybit_position_cache;

CREATE POLICY "Users can read their own bybit positions"
ON public.bybit_position_cache FOR SELECT
USING (auth.uid() = user_id);
`;

const clientNotConfiguredError = 'Supabase client is not initialized. Check your environment variables.';
export const BYBIT_SETUP_SQL = `${SECURITY_RATE_LIMITS_TABLE_SETUP_SQL.trim()}\n\n${BYBIT_CONNECTIONS_TABLE_SETUP_SQL.trim()}\n\n${BYBIT_TRADE_CACHE_TABLE_SETUP_SQL.trim()}\n\n${BYBIT_POSITION_CACHE_TABLE_SETUP_SQL.trim()}`;

export function isMissingBybitSchemaError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('relation "public.bybit_connections" does not exist')
        || normalized.includes('relation "public.bybit_trade_cache" does not exist')
        || normalized.includes('relation "public.bybit_position_cache" does not exist')
        || normalized.includes('relation "public.request_limits" does not exist')
        || (normalized.includes('bybit_connections') && normalized.includes('column') && normalized.includes('does not exist'))
        || (normalized.includes('bybit_trade_cache') && normalized.includes('column') && normalized.includes('does not exist'))
        || (normalized.includes('bybit_position_cache') && normalized.includes('column') && normalized.includes('does not exist'))
        || (normalized.includes('request_limits') && normalized.includes('column') && normalized.includes('does not exist'))
        || (normalized.includes('bybit_connections') && normalized.includes('schema cache'))
        || (normalized.includes('bybit_trade_cache') && normalized.includes('schema cache'))
        || (normalized.includes('bybit_position_cache') && normalized.includes('schema cache'))
        || (normalized.includes('request_limits') && normalized.includes('schema cache'));
}

export function getBybitSchemaErrorMessage(): string {
    return 'Bybit security tables are missing in Supabase. Run the SQL from supabase/sql/bybit_setup.sql, then refresh the app.';
}

export const THALEX_SETUP_SQL = `${SECURITY_RATE_LIMITS_TABLE_SETUP_SQL.trim()}

-- ====================================================================================
-- Thalex Integration Tables
-- Run this SQL in your Supabase Project's SQL Editor.
-- ====================================================================================

-- 1. Thalex Connections (stores encrypted RSA key pair metadata)
CREATE TABLE IF NOT EXISTS public.thalex_connections (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  environment      TEXT NOT NULL CHECK (environment IN ('mainnet', 'testnet')),

  -- Key name (e.g. K123456789) — stored plaintext as it is semi-public
  key_name         TEXT NOT NULL,
  key_name_masked  TEXT NOT NULL,
  key_name_last4   TEXT NOT NULL,

  -- RSA private key, AES-GCM encrypted (same key as Bybit uses)
  private_key_ciphertext TEXT NOT NULL,
  private_key_iv         TEXT NOT NULL,
  private_key_version    TEXT NOT NULL DEFAULT 'v1',

  validation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (validation_status IN ('not_connected', 'pending', 'valid', 'invalid')),

  permission_snapshot JSONB,
  last_validated_at   TIMESTAMPTZ,
  last_sync_at        TIMESTAMPTZ,
  sync_status         TEXT DEFAULT 'idle'
    CHECK (sync_status IN ('idle', 'syncing', 'ready', 'error')),
  sync_error          TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.thalex_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own thalex connection" ON public.thalex_connections;
CREATE POLICY "Users can manage their own thalex connection"
ON public.thalex_connections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_thalex_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_thalex_connections_updated_at ON public.thalex_connections;
CREATE TRIGGER update_thalex_connections_updated_at
    BEFORE UPDATE ON public.thalex_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_thalex_connections_updated_at();


-- 2. Thalex Trade Cache (stores normalized historical trades)
CREATE TABLE IF NOT EXISTS public.thalex_trade_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  environment      TEXT NOT NULL CHECK (environment IN ('mainnet', 'testnet')),

  trade_day        DATE NOT NULL,
  external_trade_id TEXT NOT NULL,
  order_id         TEXT NOT NULL,

  instrument_name  TEXT NOT NULL,
  instrument_type  TEXT NOT NULL DEFAULT 'unknown'
    CHECK (instrument_type IN ('option', 'future', 'perpetual', 'combination', 'unknown')),

  side             TEXT NOT NULL CHECK (side IN ('Buy', 'Sell', 'Unknown')),

  executed_at      TIMESTAMPTZ NOT NULL,
  quantity         NUMERIC NOT NULL,
  price            NUMERIC NOT NULL,
  fee              NUMERIC,
  fee_currency     TEXT,
  closed_pnl       NUMERIC,
  trade_fingerprint TEXT NOT NULL,
  raw_trade         JSONB,

  synced_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, environment, external_trade_id)
);

CREATE INDEX IF NOT EXISTS thalex_trade_cache_user_day_idx
ON public.thalex_trade_cache (user_id, trade_day, executed_at DESC);

ALTER TABLE public.thalex_trade_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own thalex cache" ON public.thalex_trade_cache;
CREATE POLICY "Users can read their own thalex cache"
ON public.thalex_trade_cache FOR SELECT
USING (auth.uid() = user_id);


-- 3. Thalex Position Cache (stores current portfolio positions)
CREATE TABLE IF NOT EXISTS public.thalex_position_cache (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  environment      TEXT NOT NULL CHECK (environment IN ('mainnet', 'testnet')),

  instrument_name  TEXT NOT NULL,
  instrument_type  TEXT NOT NULL DEFAULT 'unknown'
    CHECK (instrument_type IN ('option', 'future', 'perpetual', 'combination', 'unknown')),

  position         NUMERIC NOT NULL,
  side             TEXT NOT NULL CHECK (side IN ('Buy', 'Sell', 'Unknown')),
  position_status  TEXT NOT NULL DEFAULT 'open' CHECK (position_status IN ('open', 'closed')),
  mark_price       NUMERIC,
  start_price      NUMERIC,
  average_price    NUMERIC,
  unrealised_pnl   NUMERIC,
  realised_pnl     NUMERIC,
  entry_value      NUMERIC,
  iv               NUMERIC,
  index_price      NUMERIC,
  external_position_id TEXT NOT NULL,
  updated_at       TIMESTAMPTZ,
  raw_position     JSONB,
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, environment, external_position_id)
);

CREATE INDEX IF NOT EXISTS thalex_position_cache_user_env_idx
ON public.thalex_position_cache (user_id, environment, instrument_name);

ALTER TABLE public.thalex_position_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own thalex positions" ON public.thalex_position_cache;
CREATE POLICY "Users can read their own thalex positions"
ON public.thalex_position_cache FOR SELECT
USING (auth.uid() = user_id);`;

export function getThalexSchemaErrorMessage(): string {
    return 'Thalex security tables are missing in Supabase. Run the SQL from supabase/sql/thalex_setup.sql, then refresh the app.';
}

function isResponseLike(value: unknown): value is Response {
    return typeof Response !== 'undefined' && value instanceof Response;
}

async function readFunctionErrorPayload(response: Response): Promise<string | null> {
    try {
        const contentType = response.headers.get('content-type') ?? '';
        const clonedResponse = response.clone();

        if (contentType.includes('application/json')) {
            const payload = await clonedResponse.json() as Record<string, unknown>;
            if (typeof payload.error === 'string' && payload.error.trim()) {
                return payload.error.trim();
            }
            if (typeof payload.message === 'string' && payload.message.trim()) {
                return payload.message.trim();
            }
        }

        const text = await clonedResponse.text();
        return text.trim() || null;
    } catch {
        return null;
    }
}

function mapFunctionSetupError(name: string, message: string, response?: Response): string {
    if (isMissingBybitSchemaError(message)) {
        return getBybitSchemaErrorMessage();
    }

    if (message.toLowerCase().includes('relation "public.request_limits" does not exist')) {
        return 'Supabase security tables are missing. Run the updated SQL setup from the supabase/sql directory, then try again.';
    }

    if (message === 'Missing Authorization header.' || message === 'User not authenticated. Could not get user ID.') {
        return 'Your Supabase session is missing or expired. Sign out and back in, then try again.';
    }

    if (message.includes('Missing required environment variable: GEMINI_API_KEY')) {
        return 'Supabase Edge Function secret GEMINI_API_KEY is missing. Add it in Supabase, redeploy the AI function, then try again.';
    }

    if (message.toLowerCase().includes('relation "public.leads" does not exist')) {
        return 'The Supabase leads table is missing. Create public.leads with the updated SQL setup, then try again.';
    }

    if (message.includes('Missing required environment variable: BYBIT_CREDENTIAL_ENCRYPTION_KEY')) {
        return 'Supabase Edge Function secret BYBIT_CREDENTIAL_ENCRYPTION_KEY is missing. Add it in Supabase, redeploy the Bybit functions, then try again.';
    }

    if (message.includes('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY')) {
        return 'Supabase Edge Function secret SUPABASE_SERVICE_ROLE_KEY is missing. Add it in Supabase, redeploy the Bybit functions, then try again.';
    }

    if (message.includes('Missing required environment variable: SUPABASE_URL')) {
        return 'Supabase Edge Function secret SUPABASE_URL is missing. Add it in Supabase, redeploy the Bybit functions, then try again.';
    }

    if (response?.status === 404 || message.toLowerCase().includes('function not found')) {
        return `Supabase Edge Function "${name}" is not deployed. Deploy the Bybit functions from supabase/functions, then try again.`;
    }

    if (response?.status === 401 || response?.status === 403 || message === 'Unauthorized') {
        return 'Your Supabase session is not authorized to call this Edge Function. Sign out and back in, then try again.';
    }

    if (message.startsWith('10003:') || message.startsWith('10004:')) {
        return 'Bybit rejected the API key or signature. Double-check the key/secret pair and make sure the selected environment matches the key (mainnet vs testnet).';
    }

    if (message.startsWith('10005:')) {
        return 'The Bybit API key is valid but missing the permissions required for linear trade import.';
    }

    if (message.startsWith('10010:')) {
        return 'Bybit rejected the request because the API key is IP-restricted. Either remove the IP binding or allow the Supabase Edge Function egress IP for the deployed region.';
    }

    if (message.includes('HTTP 403')) {
        return 'Bybit rejected the request with HTTP 403. This usually means IP restrictions or a U.S. edge region. Keep the function deployed in a non-U.S. region and verify the key IP whitelist.';
    }

    if (message === 'Edge Function returned a non-2xx status code') {
        return `Supabase Edge Function "${name}" failed, but did not return a readable error body. Check the function logs in Supabase for the exact failure.`;
    }

    if (message === 'Relay Error invoking the Edge Function') {
        return `Supabase could not reach the Edge Function "${name}". Make sure it is deployed and healthy, then try again.`;
    }

    if (message === 'Failed to send a request to the Edge Function') {
        return 'The app could not reach Supabase Edge Functions. Check your SUPABASE_URL, browser network access, and Supabase project status.';
    }

    return message;
}

async function getFunctionErrorMessage(name: string, error: unknown): Promise<string> {
    const fallbackMessage = getErrorMessage(error);
    const response = typeof error === 'object' && error !== null && 'context' in error
        ? (error as { context?: unknown }).context
        : undefined;

    if (isResponseLike(response)) {
        const payloadMessage = await readFunctionErrorPayload(response);
        const resolvedMessage = payloadMessage || fallbackMessage;
        return mapFunctionSetupError(name, resolvedMessage, response);
    }

    return mapFunctionSetupError(name, fallbackMessage);
}

type BybitTradeCacheRow = Database['public']['Tables']['bybit_trade_cache']['Row'];
type BybitPositionCacheRow = Database['public']['Tables']['bybit_position_cache']['Row'];
const BYBIT_FUNCTION_REGIONS = ['ca-central-1', 'eu-west-1'] as const;

function mapBybitTrade(row: BybitTradeCacheRow): BybitCachedTrade {
    const type = resolveFutureTradeType(row.side, row.raw_closed_pnl !== null || row.closed_pnl !== null);
    return {
        id: row.id,
        provider: 'bybit',
        environment: row.environment,
        tradeDay: row.trade_day,
        externalTradeId: row.external_trade_id,
        orderId: row.order_id,
        symbol: row.symbol,
        side: row.side,
        executedAt: row.executed_at,
        quantity: Number(row.exec_qty),
        price: Number(row.exec_price),
        fee: row.exec_fee ?? undefined,
        feeCurrency: row.fee_currency ?? undefined,
        closedPnl: row.closed_pnl ?? undefined,
        type,
        tradeFingerprint: row.trade_fingerprint || createTradeFingerprint({
            source: 'bybit',
            symbol: row.symbol,
            type,
            side: row.side,
            executedAt: row.executed_at,
            quantity: Number(row.exec_qty),
            price: Number(row.exec_price),
        }),
        rawExecution: row.raw_execution ?? undefined,
        rawClosedPnl: row.raw_closed_pnl ?? undefined,
    };
}

function mapBybitPosition(row: BybitPositionCacheRow): BybitCachedPosition {
    const type = resolveFutureTradeType(row.side);
    return {
        id: row.id,
        provider: 'bybit',
        environment: row.environment,
        symbol: row.symbol,
        side: row.side,
        status: row.position_status,
        quantity: Number(row.size),
        entryPrice: row.entry_price ?? undefined,
        markPrice: row.mark_price ?? undefined,
        unrealizedPnl: row.unrealized_pnl ?? undefined,
        liquidationPrice: row.liquidation_price ?? undefined,
        leverage: row.leverage ?? undefined,
        positionValue: row.position_value ?? undefined,
        marginMode: row.margin_mode,
        updatedAt: row.updated_at ?? undefined,
        externalPositionId: row.external_position_id,
        type,
        rawPosition: row.raw_position ?? undefined,
    };
}

async function getAccessToken(): Promise<string | undefined> {
    if (!supabase) throw new Error(clientNotConfiguredError);

    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw new Error(error.message);
    }

    return session?.access_token;
}

async function invokeBrowserSafeRegionalFunction<T>(
    name: string,
    body: Record<string, unknown> | undefined,
    regions: readonly string[]
): Promise<T> {
    if (!supabase) throw new Error(clientNotConfiguredError);

    const accessToken = await getAccessToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
    };

    if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
    }

    let lastError: unknown = null;

    for (const region of regions) {
        try {
            const url = new URL(`${SUPABASE_URL}/functions/v1/${name}`);
            url.searchParams.set('forceFunctionRegion', region);

            const response = await fetch(url.toString(), {
                method: 'POST',
                headers,
                body: body ? JSON.stringify(body) : JSON.stringify({}),
            });

            const contentType = response.headers.get('content-type') ?? '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                const errorMessage =
                    typeof payload === 'object' && payload !== null && 'error' in payload
                        ? String((payload as { error: unknown }).error)
                        : typeof payload === 'string'
                            ? payload
                            : `Function invocation failed: ${name}`;
                throw new Error(mapFunctionSetupError(name, errorMessage, response));
            }

            return payload as T;
        } catch (error) {
            lastError = error;
            const message = getErrorMessage(error);
            const isRegionalBlock = message.includes('HTTP 403') || message.includes('Forbidden');
            const shouldRetryInAnotherRegion =
                message === 'Failed to fetch'
                || message === 'NetworkError when attempting to fetch resource.'
                || message.includes('Load failed')
                || message.includes('ERR_FAILED')
                || isRegionalBlock;

            if (!shouldRetryInAnotherRegion || region === regions[regions.length - 1]) {
                throw new Error(message || `Function invocation failed: ${name}`);
            }
        }
    }

    throw new Error(getErrorMessage(lastError) || `Function invocation failed: ${name}`);
}

export async function invokeAppFunction<T>(name: string, body?: Record<string, unknown>): Promise<T> {
    if (!supabase) throw new Error(clientNotConfiguredError);

    if (name.startsWith('bybit-')) {
        try {
            return await invokeBrowserSafeRegionalFunction(name, body, BYBIT_FUNCTION_REGIONS);
        } catch (error) {
            const message = getErrorMessage(error);
            throw new Error(mapFunctionSetupError(name, message));
        }
    }

    const { data, error } = await supabase.functions.invoke(name, {
        body,
    });

    if (error) {
        const message = await getFunctionErrorMessage(name, error);
        throw new Error(message || `Function invocation failed: ${name}`);
    }

    return data as T;
}

// --- Helper Functions ---
async function getUserId(): Promise<string> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
        throw new Error('User not authenticated. Could not get user ID.');
    }
    return session.user.id;
}

/**
 * Generic helper to perform a Supabase operation with standardized error handling.
 * @param operation A function that returns a Supabase promise-like object (builder)
 * @param errorMessage Context for the error message if the operation fails.
 * @param fallbackValue An optional value to return if data is null or Supabase is not configured.
 */
export async function performSupabaseOp<T>(
  operation: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  errorMessage: string,
  fallbackValue?: T
): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    if (fallbackValue !== undefined) return fallbackValue;
    throw new Error('Supabase is not configured.');
  }

  try {
    const { data, error } = await operation();
    if (error) throw new Error(error.message);
    
    // If we have a fallback and data is null, return fallback
    if (data === null && fallbackValue !== undefined) return fallbackValue;
    
    return data as T;
  } catch (error: unknown) {
    // If the error has a code (Supabase error), throw it as is to allow handling specific codes like PGRST116
    if (hasErrorCode(error)) throw error;
    
    const msg = getErrorMessage(error);
    console.error(`${errorMessage}:`, msg);
    throw new Error(msg);
  }
}

// --- Entry Functions ---
export async function getEntries(): Promise<Record<string, EmotionEntry>> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!.from('entries').select('*').eq('user_id', userId),
        'Error fetching entries'
    );

    const entriesRecord: Record<string, EmotionEntry> = {};
    if (data) {
        const rows = data as Database['public']['Tables']['entries']['Row'][];
        for (const e of rows) {
            entriesRecord[e.date] = {
                date: e.date,
                emotion: normalizeEmotionValue(e.emotion) as EmotionType,
                intensity: e.intensity,
                notes: e.notes,
                imageUrl: e.image_url ?? undefined,
                pnl: e.pnl ?? undefined,
                tradingData: normalizeEntryTradingData(e.trading_data || undefined),
            };
        }
    }
    return entriesRecord;
}

export async function saveEntry(entry: EmotionEntry): Promise<EmotionEntry> {
    const userId = await getUserId();
    const normalizedTradingData = normalizeEntryTradingData(entry.tradingData);
    
    const data = await performSupabaseOp(
        () => supabase!
            .from('entries')
            .upsert({
                date: entry.date,
                emotion: entry.emotion,
                intensity: entry.intensity,
                notes: entry.notes,
                image_url: entry.imageUrl ?? null,
                user_id: userId,
                pnl: entry.pnl ?? null,
                trading_data: normalizedTradingData ?? null
            }, { onConflict: 'user_id,date' })
            .select()
            .single(),
        'Error saving entry'
    );

    const savedData = data as Database['public']['Tables']['entries']['Row'];
    return {
        date: savedData.date,
        emotion: normalizeEmotionValue(savedData.emotion) as EmotionType,
        intensity: savedData.intensity,
        notes: savedData.notes,
        imageUrl: savedData.image_url ?? undefined,
        pnl: savedData.pnl ?? undefined,
        tradingData: normalizeEntryTradingData(savedData.trading_data || undefined),
    };
}

export async function deleteEntry(date: string): Promise<void> {
    const userId = await getUserId();
    
    await performSupabaseOp(
        () => supabase!.from('entries').delete().eq('date', date).eq('user_id', userId).select(),
        'Error deleting entry'
    );
}

// --- Profile Functions ---
export async function getProfile(): Promise<UserProfile> {
    const userId = await getUserId();
    
    // Helper specifically for profile fetch since it needs to return null data on fail gracefully sometimes
    // But performSupabaseOp throws if requireData is true.
    // We can use performSupabaseOp with requireData=false and handle null manually.
    
    // However, existing logic had specific check for PGRST116.
    // Let's adapt performSupabaseOp or just call it and catch.
    
    try {
        const data = await performSupabaseOp(
            () => supabase!.from('profiles').select('*').eq('id', userId).single(),
            'Error fetching profile'
        );

        if (data) {
            const profileData = data as Database['public']['Tables']['profiles']['Row'];
            return {
                name: profileData.name,
                alias: profileData.alias,
                picture: profileData.picture ?? undefined,
                journalPurpose: profileData.journal_purpose ?? "Click the 'Edit' button in the sidebar to set a purpose!",
            };
        }
    } catch (error: unknown) {
        // If it's not the "no rows" error, rethrow
        if (!hasErrorCode(error) || error.code !== 'PGRST116') {
             throw error;
        }
    }
    
    // Fallback if no profile exists or PGRST116
    const { data: { user } } = await supabase!.auth.getUser();
    const newUserProfile: UserProfile = {
        name: user?.email?.split('@')[0] || 'New User',
        alias: user?.email || 'No email',
        picture: undefined,
        journalPurpose: "This is my new Deltajournal!",
    };
    return saveProfile(newUserProfile);
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!.from('profiles').upsert({
            id: userId,
            name: profile.name,
            alias: profile.alias,
            picture: profile.picture ?? null,
            journal_purpose: profile.journalPurpose ?? null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' }).select().single(),
        'Error saving profile'
    );

    const savedData = data as Database['public']['Tables']['profiles']['Row'];

    return {
        name: savedData.name,
        alias: savedData.alias,
        picture: savedData.picture ?? undefined,
        journalPurpose: savedData.journal_purpose ?? undefined,
    };
}

// --- Quest Functions ---
export async function getQuests(): Promise<Quest[]> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
        'Error fetching quests'
    );
    
    if (!data) return [];
    
    return (data as Database['public']['Tables']['quests']['Row'][]).map(q => ({
        id: q.id,
        text: q.text,
        completed: q.completed,
        createdAt: q.created_at
    }));
}

export async function addQuest(text: string): Promise<Quest> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!
            .from('quests')
            .insert({ text, user_id: userId })
            .select()
            .single(),
        'Error adding quest'
    );

    const questRow = data as Database['public']['Tables']['quests']['Row'];
    return { 
        id: questRow.id,
        text: questRow.text,
        completed: questRow.completed,
        createdAt: questRow.created_at 
    };
}

export async function updateQuestStatus(id: string, completed: boolean): Promise<Quest> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!
            .from('quests')
            .update({ completed })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single(),
        'Error updating quest'
    );

    const questRow = data as Database['public']['Tables']['quests']['Row'];
    return {
        id: questRow.id,
        text: questRow.text,
        completed: questRow.completed,
        createdAt: questRow.created_at
    };
}

export async function deleteQuest(id: string): Promise<void> {
    const userId = await getUserId();
    
    await performSupabaseOp(
        () => supabase!
            .from('quests')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .select(), // Select is usually needed to verify row was actually there/deleted or satisfy checking, but standard delete doesn't fail if ID missing.
        'Error deleting quest'
    );
}

// --- Bybit Integration ---
export async function getBybitConnection(): Promise<BybitConnection | null> {
    try {
        const result = await invokeAppFunction<{ connection: BybitConnection | null }>('bybit-get-connection');
        return result.connection;
    } catch (error) {
        const message = getErrorMessage(error);
        if (isMissingBybitSchemaError(message)) {
            throw new Error(getBybitSchemaErrorMessage());
        }
        throw error;
    }
}

export async function saveBybitConnection(input: BybitCredentialInput): Promise<BybitConnection> {
    const result = await invokeAppFunction<{ connection: BybitConnection }>('bybit-upsert-credentials', input as unknown as Record<string, unknown>);
    return result.connection;
}

export async function validateBybitConnection(input: BybitCredentialInput): Promise<BybitConnection> {
    const result = await invokeAppFunction<{ connection: BybitConnection }>('bybit-validate-credentials', input as unknown as Record<string, unknown>);
    return result.connection;
}

export async function deleteBybitConnection(): Promise<void> {
    try {
        await invokeAppFunction('bybit-delete-connection');
    } catch (error) {
        const message = getErrorMessage(error);
        if (isMissingBybitSchemaError(message)) {
            throw new Error(getBybitSchemaErrorMessage());
        }
        throw error;
    }
}

export async function getCachedBybitTradesForDate(date: string): Promise<BybitTradeCacheResult> {
    const userId = await getUserId();
    try {
        const [connection, trades, positions] = await Promise.all([
            getBybitConnection(),
            performSupabaseOp(
                () => supabase!
                    .from('bybit_trade_cache')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('trade_day', date)
                    .order('executed_at', { ascending: false }),
                'Error fetching Bybit trade cache',
                []
            ),
            performSupabaseOp(
                () => supabase!
                    .from('bybit_position_cache')
                    .select('*')
                    .eq('user_id', userId)
                    .order('updated_at', { ascending: false, nullsFirst: false }),
                'Error fetching Bybit position cache',
                []
            )
        ]);

        return {
            connection,
            trades: (trades as BybitTradeCacheRow[]).map(mapBybitTrade),
            positions: (positions as BybitPositionCacheRow[]).map(mapBybitPosition),
            refreshedAt: connection?.lastSyncAt,
            syncError: connection?.syncError,
        };
    } catch (error) {
        const message = getErrorMessage(error);
        if (isMissingBybitSchemaError(message)) {
            throw new Error(getBybitSchemaErrorMessage());
        }
        throw error;
    }
}

export async function refreshBybitTradesForDate(date: string, timezone: string): Promise<BybitTradeCacheResult> {
    try {
        const result = await invokeAppFunction<BybitTradeCacheResult>('bybit-sync-trades', {
            date,
            timezone,
        });

        return {
            ...result,
            trades: result.trades ?? [],
            positions: result.positions ?? [],
        };
    } catch (error) {
        const message = getErrorMessage(error);
        if (isMissingBybitSchemaError(message)) {
            throw new Error(getBybitSchemaErrorMessage());
        }
        throw error;
    }
}

export async function bulkRefreshBybitTrades(
    startDate: string,
    endDate: string,
    timezone: string
): Promise<{ date: string; result: BybitTradeCacheResult }[]> {
    const results: { date: string; result: BybitTradeCacheResult }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        try {
            const result = await refreshBybitTradesForDate(dateStr, timezone);
            results.push({ date: dateStr, result });
        } catch (error) {
            results.push({ date: dateStr, result: { trades: [], positions: [], connection: null, syncError: (error as Error).message } });
        }
    }
    
    return results;
}

export async function bulkCreateEntriesWithTrades(
    startDate: string,
    endDate: string,
    timezone: string
): Promise<{ date: string; tradesCount: number; pnl: number; created: boolean }[]> {
    const results: { date: string; tradesCount: number; pnl: number; created: boolean }[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        try {
            const cacheResult = await refreshBybitTradesForDate(dateStr, timezone);
            const trades = cacheResult.trades;
            const positions = cacheResult.positions || [];
            const tradeDetails = [
                ...trades.map(tradeFromCachedBybitTrade),
                ...positions.map(tradeFromCachedBybitPosition),
            ];
            
            if (tradeDetails.length === 0) {
                results.push({ date: dateStr, tradesCount: 0, pnl: 0, created: false });
                continue;
            }
            
            const totalPnl = tradeDetails.reduce(
                (sum, trade) => sum + (trade.closedPnl ?? trade.pnl ?? trade.unrealizedPnl ?? 0),
                0,
            );
            
            await saveEntry({
                date: dateStr,
                emotion: 'composed',
                intensity: 5,
                notes: `Auto-imported from Bybit: ${tradeDetails.length} trades`,
                pnl: totalPnl,
                tradingData: {
                    trades: tradeDetails,
                    pnlSource: 'linked_trades'
                }
            });
            
            results.push({ date: dateStr, tradesCount: tradeDetails.length, pnl: totalPnl, created: true });
        } catch (error) {
            results.push({ date: dateStr, tradesCount: 0, pnl: 0, created: false });
        }
    }
    
    return results;
}

// ====================================================================================
// REVIEWS TABLE SETUP
// ====================================================================================
export const REVIEWS_TABLE_SETUP_SQL = `
-- 1. Create the table for performance reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, year)
);

-- 2. Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for reviews
CREATE POLICY "Users can manage their own reviews"
ON public.reviews FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();
`;

// ====================================================================================
// LEADS TABLE SETUP
// ====================================================================================
export const LEADS_TABLE_SETUP_SQL = `
-- 1. Create the table for leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for RLS
-- Lead writes now happen only through the capture-lead edge function.
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.leads;
`;

export async function getReviews(): Promise<PerformanceReview[]> {
    const userId = await getUserId();

    const data = await performSupabaseOp(
        () => supabase!.from('reviews').select('*').eq('user_id', userId).order('year', { ascending: false }),
        'Error fetching reviews'
    );

    if (!data) return [];

    return (data as Database['public']['Tables']['reviews']['Row'][]).map(r => ({
        id: r.id,
        year: r.year,
        userId: r.user_id,
        sections: r.data.sections,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    }));
}

export async function getReview(year: number): Promise<PerformanceReview | null> {
    const userId = await getUserId();

    const data = await performSupabaseOp(
        () => supabase!.from('reviews').select('*').eq('user_id', userId).eq('year', year).maybeSingle(),
        'Error fetching review'
    );

    if (!data) return null;

    const r = data as Database['public']['Tables']['reviews']['Row'];
    return {
        id: r.id,
        year: r.year,
        userId: r.user_id,
        sections: r.data.sections,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}

export async function saveReview(review: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceReview> {
    const userId = await getUserId();

    const data = await performSupabaseOp(
        () => supabase!.from('reviews').upsert({
            user_id: userId,
            year: review.year,
            data: { sections: review.sections }
        }, { onConflict: 'user_id,year' }).select().single(),
        'Error saving review'
    );

    const saved = data as Database['public']['Tables']['reviews']['Row'];
    return {
        id: saved.id,
        year: saved.year,
        userId: saved.user_id,
        sections: saved.data.sections,
        createdAt: saved.created_at,
        updatedAt: saved.updated_at
    };
}

export async function deleteReview(year: number): Promise<void> {
    const userId = await getUserId();

    await performSupabaseOp(
        () => supabase!.from('reviews').delete().eq('user_id', userId).eq('year', year).select(),
        'Error deleting review'
    );
}

export async function addLead(email: string): Promise<void> {
    await invokeAppFunction<{ ok: boolean }>('capture-lead', { email });
}

// ====================================================================================
// THALEX SERVICE METHODS
// ====================================================================================

type ThalexConnectionRow = Database['public']['Tables']['thalex_connections']['Row'];
type ThalexTradeCacheRow = Database['public']['Tables']['thalex_trade_cache']['Row'];
type ThalexPositionCacheRow = Database['public']['Tables']['thalex_position_cache']['Row'];

const THALEX_FUNCTION_REGIONS = ['ca-central-1', 'eu-west-1'] as const;

export function isMissingThalexSchemaError(message: string): boolean {
    const n = message.toLowerCase();
    return n.includes('relation "public.thalex_connections" does not exist')
        || n.includes('relation "public.thalex_trade_cache" does not exist')
        || n.includes('relation "public.thalex_position_cache" does not exist')
        || (n.includes('thalex_connections') && n.includes('does not exist'))
        || (n.includes('thalex_trade_cache') && n.includes('does not exist'))
        || (n.includes('thalex_position_cache') && n.includes('does not exist'));
}

function mapThalexConnection(row: ThalexConnectionRow): ThalexConnection {
    return {
        provider: 'thalex',
        environment: row.environment,
        keyNameMasked: row.key_name_masked,
        keyNameLast4: row.key_name_last4,
        // Satisfy TradingConnection base interface
        apiKeyMasked: row.key_name_masked,
        apiKeyLast4: row.key_name_last4,
        validationStatus: row.validation_status,
        permissionSnapshot: row.permission_snapshot,
        lastValidatedAt: row.last_validated_at ?? undefined,
        lastSyncAt: row.last_sync_at ?? undefined,
        syncStatus: (row.sync_status as ThalexConnection['syncStatus']) ?? 'idle',
        syncError: row.sync_error ?? null,
    };
}

function mapThalexTrade(row: ThalexTradeCacheRow): ThalexCachedTrade {
    // Derive trade type from instrument name + side
    // (a simplified version — the full logic runs in the Edge Function)
    const type = (() => {
        const name = row.instrument_name.toUpperCase();
        if (row.instrument_type === 'option') {
            const isCall = name.endsWith('-C');
            const letter = isCall ? 'Call' : 'Put';
            return (row.side === 'Buy' ? `BTO ${letter}` : `STO ${letter}`) as TradeDetails['type'];
        }
        return (row.side === 'Buy' ? 'Long Future' : 'Short Future') as TradeDetails['type'];
    })();

    return {
        id: row.id,
        provider: 'thalex',
        environment: row.environment,
        tradeDay: row.trade_day,
        instrumentType: row.instrument_type,
        externalTradeId: row.external_trade_id,
        orderId: row.order_id,
        symbol: row.instrument_name,
        side: row.side,
        executedAt: row.executed_at,
        quantity: Number(row.quantity),
        price: Number(row.price),
        fee: row.fee ?? undefined,
        feeCurrency: row.fee_currency ?? undefined,
        closedPnl: row.closed_pnl ?? undefined,
        type,
        tradeFingerprint: row.trade_fingerprint,
        rawTrade: row.raw_trade ?? undefined,
    };
}

function mapThalexPosition(row: ThalexPositionCacheRow): ThalexCachedPosition {
    const type = (() => {
        if (row.instrument_type === 'option') {
            const isCall = row.instrument_name.toUpperCase().endsWith('-C');
            return (row.side === 'Buy'
                ? isCall ? 'BTO Call' : 'BTO Put'
                : isCall ? 'STO Call' : 'STO Put') as TradeDetails['type'];
        }
        return (row.side === 'Buy' ? 'Long Future' : 'Short Future') as TradeDetails['type'];
    })();

    return {
        id: row.id,
        provider: 'thalex',
        environment: row.environment,
        instrumentType: row.instrument_type,
        symbol: row.instrument_name,
        side: row.side,
        status: row.position_status,
        quantity: Math.abs(Number(row.position)),
        entryPrice: row.start_price ?? undefined,
        markPrice: row.mark_price ?? undefined,
        unrealizedPnl: row.unrealised_pnl ?? undefined,
        liquidationPrice: undefined,
        leverage: undefined,
        positionValue: row.entry_value ?? undefined,
        marginMode: 'unknown',
        updatedAt: row.updated_at ?? undefined,
        externalPositionId: row.external_position_id,
        type,
        rawPosition: row.raw_position ?? undefined,
    };
}

export async function getThalexConnection(): Promise<ThalexConnection | null> {
    const result = await invokeBrowserSafeRegionalFunction<{ connection: ThalexConnectionRow | null }>(
        'thalex-get-connection',
        {},
        THALEX_FUNCTION_REGIONS,
    );
    return result.connection ? mapThalexConnection(result.connection) : null;
}

export async function saveThalexConnection(input: ThalexCredentialInput): Promise<ThalexConnection> {
    const result = await invokeBrowserSafeRegionalFunction<ThalexConnectionRow>(
        'thalex-upsert-credentials',
        {
            keyName: input.keyName,
            privateKeyPem: input.privateKeyPem,
            environment: input.environment,
        },
        THALEX_FUNCTION_REGIONS,
    );
    return mapThalexConnection(result);
}

export async function validateThalexConnection(input: ThalexCredentialInput): Promise<ThalexConnection> {
    await invokeBrowserSafeRegionalFunction<{ valid: boolean }>(
        'thalex-validate-credentials',
        {
            keyName: input.keyName,
            privateKeyPem: input.privateKeyPem,
            environment: input.environment,
        },
        THALEX_FUNCTION_REGIONS,
    );

    // Return a transient ThalexConnection (not yet persisted)
    return {
        provider: 'thalex',
        environment: input.environment,
        keyNameMasked: input.keyName.length > 4 ? `${input.keyName.slice(0, 4)}***` : input.keyName,
        keyNameLast4: input.keyName.slice(-4),
        apiKeyMasked: input.keyName.length > 4 ? `${input.keyName.slice(0, 4)}***` : input.keyName,
        apiKeyLast4: input.keyName.slice(-4),
        validationStatus: 'valid',
        permissionSnapshot: null,
    };
}

export async function deleteThalexConnection(): Promise<void> {
    await invokeBrowserSafeRegionalFunction<{ deleted: boolean }>(
        'thalex-delete-connection',
        {},
        THALEX_FUNCTION_REGIONS,
    );
}

export async function getCachedThalexTradesForDate(date: string): Promise<ThalexTradeCacheResult> {
    if (!supabase) throw new Error(clientNotConfiguredError);

    const connection = await getThalexConnection();
    if (!connection) {
        return { trades: [], positions: [], connection: null };
    }

    const { data: trades, error: tradesErr } = await supabase
        .from('thalex_trade_cache')
        .select('*')
        .eq('trade_day', date)
        .order('executed_at', { ascending: true });

    if (tradesErr) throw new Error(tradesErr.message);

    const { data: positions, error: posErr } = await supabase
        .from('thalex_position_cache')
        .select('*');

    if (posErr) throw new Error(posErr.message);

    return {
        trades: (trades ?? []).map(mapThalexTrade),
        positions: (positions ?? []).map(mapThalexPosition),
        connection,
        refreshedAt: connection.lastSyncAt,
    };
}

export async function refreshThalexTradesForDate(date: string, timezone: string): Promise<ThalexTradeCacheResult> {
    const result = await invokeBrowserSafeRegionalFunction<{
        trades: ThalexTradeCacheRow[];
        positions: ThalexPositionCacheRow[];
        refreshedAt: string;
    }>(
        'thalex-sync-trades',
        { date, timezone },
        THALEX_FUNCTION_REGIONS,
    );

    const connection = await getThalexConnection();

    return {
        trades: result.trades.map(mapThalexTrade),
        positions: result.positions.map(mapThalexPosition),
        connection,
        refreshedAt: result.refreshedAt,
    };
}
