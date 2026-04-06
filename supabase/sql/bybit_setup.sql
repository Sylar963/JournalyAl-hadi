-- Bybit integration setup for DeltaJournal
-- Run this after the core profiles / entries / quests tables are created.

CREATE TABLE public.bybit_connections (
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

CREATE OR REPLACE FUNCTION update_bybit_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bybit_connections_updated_at
BEFORE UPDATE ON public.bybit_connections
FOR EACH ROW
EXECUTE FUNCTION update_bybit_connections_updated_at();

CREATE TABLE public.bybit_trade_cache (
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

CREATE INDEX bybit_trade_cache_user_day_idx
ON public.bybit_trade_cache (user_id, trade_day, executed_at DESC);

ALTER TABLE public.bybit_trade_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own bybit cache"
ON public.bybit_trade_cache FOR SELECT
USING (auth.uid() = user_id);
