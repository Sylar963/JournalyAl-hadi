import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type BybitCachedTrade, type BybitConnection, type BybitCredentialInput, type BybitTradeCacheResult, type EmotionEntry, type UserProfile, type EmotionType, type Quest, type TradeDetails, type PerformanceReview } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { getErrorMessage } from '../utils/errorHelpers';
import { createTradeFingerprint, normalizeTradeTypeFromSide } from './tradingIndexService';

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
          trading_data: { trades: TradeDetails[] } | null;
        };
        Update: {
          date?: string;
          emotion?: string;
          intensity?: number;
          notes?: string | null;
          user_id?: string;
          image_url?: string | null;
          pnl?: number | null;
          trading_data?: { trades: TradeDetails[] } | null;
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
        ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
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

const clientNotConfiguredError = 'Supabase client is not initialized. Check your environment variables.';
export const BYBIT_SETUP_SQL = `${BYBIT_CONNECTIONS_TABLE_SETUP_SQL.trim()}\n\n${BYBIT_TRADE_CACHE_TABLE_SETUP_SQL.trim()}`;

export function isMissingBybitSchemaError(message: string): boolean {
    const normalized = message.toLowerCase();
    return normalized.includes('relation "public.bybit_connections" does not exist')
        || normalized.includes('relation "public.bybit_trade_cache" does not exist');
}

export function getBybitSchemaErrorMessage(): string {
    return 'Bybit tables are missing in Supabase. Run the SQL from supabase/sql/bybit_setup.sql, then refresh the app.';
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
        return 'Your Supabase session is not authorized to call the Bybit Edge Functions. Sign out and back in, then try again.';
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

function mapBybitTrade(row: BybitTradeCacheRow): BybitCachedTrade {
    const type = normalizeTradeTypeFromSide(row.side);
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

async function invokeFunction<T>(name: string, body?: Record<string, unknown>): Promise<T> {
    if (!supabase) throw new Error(clientNotConfiguredError);

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
  operation: () => PromiseLike<{ data: T | null; error: any }>,
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
  } catch (error: any) {
    // If the error has a code (Supabase error), throw it as is to allow handling specific codes like PGRST116
    if (error?.code) throw error;
    
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
                emotion: e.emotion as EmotionType,
                intensity: e.intensity,
                notes: e.notes,
                imageUrl: e.image_url ?? undefined,
                pnl: e.pnl ?? undefined,
                tradingData: e.trading_data || undefined
            };
        }
    }
    return entriesRecord;
}

export async function saveEntry(entry: EmotionEntry): Promise<EmotionEntry> {
    const userId = await getUserId();
    
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
                trading_data: entry.tradingData ?? null
            }, { onConflict: 'user_id,date' })
            .select()
            .single(),
        'Error saving entry'
    );

    const savedData = data as Database['public']['Tables']['entries']['Row'];
    return {
        date: savedData.date,
        emotion: savedData.emotion as EmotionType,
        intensity: savedData.intensity,
        notes: savedData.notes,
        imageUrl: savedData.image_url ?? undefined,
        pnl: savedData.pnl ?? undefined,
        tradingData: savedData.trading_data || undefined
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
    } catch (error: any) {
        // If it's not the "no rows" error, rethrow
        if (error.code !== 'PGRST116') {
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
        const result = await invokeFunction<{ connection: BybitConnection | null }>('bybit-get-connection');
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
    const result = await invokeFunction<{ connection: BybitConnection }>('bybit-upsert-credentials', input);
    return result.connection;
}

export async function validateBybitConnection(input: BybitCredentialInput): Promise<BybitConnection> {
    const result = await invokeFunction<{ connection: BybitConnection }>('bybit-validate-credentials', input);
    return result.connection;
}

export async function deleteBybitConnection(): Promise<void> {
    try {
        await invokeFunction('bybit-delete-connection');
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
        const [connection, trades] = await Promise.all([
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
            )
        ]);

        return {
            connection,
            trades: (trades as BybitTradeCacheRow[]).map(mapBybitTrade),
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
        const result = await invokeFunction<BybitTradeCacheResult>('bybit-sync-trades', {
            date,
            timezone,
        });

        return {
            ...result,
            trades: result.trades ?? [],
        };
    } catch (error) {
        const message = getErrorMessage(error);
        if (isMissingBybitSchemaError(message)) {
            throw new Error(getBybitSchemaErrorMessage());
        }
        throw error;
    }
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
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for RLS
-- Allow public inserts (anyone can sign up)
CREATE POLICY "Enable insert for everyone" ON public.leads FOR INSERT WITH CHECK (true);

-- Allow only authenticated admins (or no one by default if not set up) to view
-- For now, we'll just leave read access restricted to service role or specific users
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
    // Lead capture is public, so no getUserId() needed here for RLS (policy is insert only)
    await performSupabaseOp(
        () => supabase!.from('leads').insert({ email }).select(), // Select to ensure it really happened if we care, or just to satisfy typings if reusing op
        'Error adding lead'
    );
}
