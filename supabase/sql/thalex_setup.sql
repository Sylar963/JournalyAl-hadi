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
  key_name_masked  TEXT NOT NULL,  -- e.g. "K123****789"
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
  external_trade_id TEXT NOT NULL,  -- Thalex trade_id
  order_id         TEXT NOT NULL,   -- Thalex order_id

  instrument_name  TEXT NOT NULL,   -- e.g. BTC-16DEC23-46000-C
  instrument_type  TEXT NOT NULL DEFAULT 'unknown'
    CHECK (instrument_type IN ('option', 'future', 'perpetual', 'combination', 'unknown')),

  -- 'Buy' or 'Sell' normalised from Thalex 'buy'/'sell' direction
  side             TEXT NOT NULL CHECK (side IN ('Buy', 'Sell', 'Unknown')),

  executed_at      TIMESTAMPTZ NOT NULL,
  quantity         NUMERIC NOT NULL,  -- Thalex `amount`
  price            NUMERIC NOT NULL,  -- Thalex `price`
  fee              NUMERIC,           -- Thalex `fee`
  fee_currency     TEXT,              -- e.g. 'USDC'

  -- Realized PnL when a position was closed (position_pnl from Thalex)
  closed_pnl       NUMERIC,

  trade_fingerprint TEXT NOT NULL,
  raw_trade         JSONB,           -- Full Thalex Trade object

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

  instrument_name  TEXT NOT NULL,   -- e.g. BTC-16DEC23-46000-C or BTC-PERPETUAL
  instrument_type  TEXT NOT NULL DEFAULT 'unknown'
    CHECK (instrument_type IN ('option', 'future', 'perpetual', 'combination', 'unknown')),

  -- position > 0 = long, position < 0 = short
  position         NUMERIC NOT NULL,
  side             TEXT NOT NULL CHECK (side IN ('Buy', 'Sell', 'Unknown')),
  position_status  TEXT NOT NULL DEFAULT 'open' CHECK (position_status IN ('open', 'closed')),

  -- Pricing
  mark_price       NUMERIC,
  start_price      NUMERIC,    -- Thalex average entry price (resets at daily settlement)
  average_price    NUMERIC,    -- All-time average price (does not reset)
  unrealised_pnl   NUMERIC,
  realised_pnl     NUMERIC,    -- Session realised PnL
  entry_value      NUMERIC,

  -- Options-specific
  iv               NUMERIC,    -- Implied volatility
  index_price      NUMERIC,    -- Underlying index at time of marking

  -- Used as unique key — instrument_name is unique per user / env
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
USING (auth.uid() = user_id);
