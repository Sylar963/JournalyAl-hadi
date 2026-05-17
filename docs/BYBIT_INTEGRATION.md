# Bybit Integration Guide

## Overview
- The app now supports importing today's Bybit `linear` trades into the Trading tab.
- Bybit credentials are stored only in Supabase-backed mode.
- Credentials are validated server-side and encrypted before they are written to Postgres.
- The browser never reads or writes the encrypted `bybit_connections` table directly; safe metadata comes back through Edge Functions.

## Setup
1. Run the base SQL from [supabaseService.ts](/home/aladhi/JournalyAl-hadi/services/supabaseService.ts).
2. Run [bybit_setup.sql](/home/aladhi/JournalyAl-hadi/supabase/sql/bybit_setup.sql).
3. Deploy the Edge Functions in [supabase/functions/bybit-upsert-credentials](/home/aladhi/JournalyAl-hadi/supabase/functions/bybit-upsert-credentials), [supabase/functions/bybit-validate-credentials](/home/aladhi/JournalyAl-hadi/supabase/functions/bybit-validate-credentials), [supabase/functions/bybit-get-connection](/home/aladhi/JournalyAl-hadi/supabase/functions/bybit-get-connection), [supabase/functions/bybit-delete-connection](/home/aladhi/JournalyAl-hadi/supabase/functions/bybit-delete-connection), and [supabase/functions/bybit-sync-trades](/home/aladhi/JournalyAl-hadi/supabase/functions/bybit-sync-trades).
4. Set these Supabase secrets for the Edge Functions:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `BYBIT_CREDENTIAL_ENCRYPTION_KEY`
5. The setup SQL now also creates a shared `public.request_limits` table used to throttle credential validation and sync abuse.
6. Deploy the Bybit functions from a non-U.S. region. Bybit documents U.S. IP restrictions and may return HTTP `403`.

## Backend Shape
- The browser talks only to Supabase Edge Functions for Bybit credential validation, storage, and sync.
- The Edge Function decrypts the stored credentials just-in-time, signs the Bybit request server-side, and returns only normalized trade data to the UI.
- `bybit-sync-trades` now also supports a non-persistent backend preview mode for operational testing. This lets us verify a live symbol without mutating cached trade state.
- Shared runtime concerns like auth, CORS, JSON responses, and encryption now live in a provider-agnostic Edge Function runtime module, while Bybit-specific signing and parsing stay isolated in the Bybit provider module.
- On the frontend, provider metadata and clients are registered in [tradingProviderRegistry.ts](/home/aladhi/JournalyAl-hadi/services/tradingProviderRegistry.ts). That is the extension seam for future providers such as Hyperliquid market-data feeds.
- Browser-triggered Bybit function calls use Supabase's `forceFunctionRegion` query parameter instead of the `x-region` header. Supabase documents `forceFunctionRegion` as the browser/CORS-safe regional invocation path.

## User Flow
1. Open `Settings`.
2. Select `mainnet` or `testnet`.
3. Paste the Bybit API key and secret.
4. Use `Test` to validate the credentials without saving.
5. Use `Connect` to encrypt and store the credentials.
6. Open today's entry and switch to the `Trading` tab.
7. The `Bybit Today` panel loads cached trades first, then refreshes if the cache is stale.
8. Link a trade to copy it into the entry. Linked Bybit trades are deduped by external trade ID and fingerprint.

## Permissions
- The API key must allow derivatives access for `linear` products.
- If validation succeeds but derivatives permissions are missing, the UI blocks the save and shows a permission error.

## Troubleshooting
- `10003` or `10004`: The key/secret pair is invalid or signed for the wrong environment.
- `10005`: The key is valid but missing required permissions.
- `10010`: The key is IP-bound and does not allow the deployed function egress IP.
- HTTP `403`: Most often a region or IP restriction. Move the function to a non-U.S. region and re-test.
- If the user is physically outside the U.S. but still gets HTTP `403`, the backend edge region can still be the cause. Supabase Edge Functions may execute in the nearest edge region to the caller unless a region is pinned. The app now routes browser-triggered Bybit function calls with `forceFunctionRegion=ca-central-1`, and falls back to `eu-west-1`, to avoid accidental U.S. egress.
- Empty trade list: The feature imports only today's `linear` trades in v1.
- Duplicate warning when adding a manual trade: The entry already contains the Bybit trade or a matching fingerprint. Link the imported trade instead.

## Smoke Test
- Use the backend smoke test after the user has connected their Bybit API keys in the app.
- The script authenticates as that user, invokes `bybit-sync-trades` in `previewOnly` mode, and prints only the requested symbol's trades.
- Default symbol is `CLUSDT`.

```bash
DJ_SMOKE_EMAIL="you@example.com" \
DJ_SMOKE_PASSWORD="your-app-password" \
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_ANON_KEY="your-anon-key" \
pnpm run smoke:bybit
```

- Optional environment variables:
  - `BYBIT_SMOKE_MODE` as `sync` (default), `validate`, or `upsert`
  - `BYBIT_SMOKE_SYMBOL` to override the symbol
  - `BYBIT_SMOKE_DATE` in `YYYY-MM-DD`
  - `BYBIT_SMOKE_TIMEZONE` for the journal-local day boundary
  - `BYBIT_API_KEY`, `BYBIT_API_SECRET`, and `BYBIT_ENVIRONMENT` when using `BYBIT_SMOKE_MODE=validate` or `BYBIT_SMOKE_MODE=upsert`
  - `BYBIT_SMOKE_REGIONS` as a comma-separated override for the default `ca-central-1,eu-west-1`
  - `DJ_SMOKE_ACCESS_TOKEN` instead of email/password if you already have a session token

## FAQ
- Why are only today's trades shown?
  - v1 is intentionally scoped to the current journal day so refresh, dedupe, and PNL behavior stay predictable.
- Are my API keys stored in the browser?
  - No. The browser only sends raw credentials to the Edge Function over HTTPS. The function validates and encrypts them before storage.
- What powers the PNL Index now?
  - The app builds a shared trading index from manual trades plus imported Bybit trades, then dedupes by external trade ID or fingerprint.

## Security Audit Checklist
- Confirm the client never writes Bybit credentials to `localStorage`, Vite env vars, or logs.
- Confirm validation and sync requests are rate-limited through `public.request_limits`.
- Confirm only masked API key metadata is ever rendered in the UI.
- Confirm `BYBIT_CREDENTIAL_ENCRYPTION_KEY` exists in the Edge Function environment.
- Confirm there is no direct authenticated client policy on `bybit_connections`; only service-role Edge Functions should touch it.
- Confirm `bybit_trade_cache` RLS policies restrict access to `auth.uid()`.
- Confirm the sync function updates `sync_error` without exposing secrets.
- Confirm Bybit egress originates from a non-U.S. region before enabling the feature in production.
