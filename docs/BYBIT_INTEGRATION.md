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
5. Deploy the Bybit functions from a non-U.S. region. Bybit documents U.S. IP restrictions and may return HTTP `403`.

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
- Empty trade list: The feature imports only today's `linear` trades in v1.
- Duplicate warning when adding a manual trade: The entry already contains the Bybit trade or a matching fingerprint. Link the imported trade instead.

## FAQ
- Why are only today's trades shown?
  - v1 is intentionally scoped to the current journal day so refresh, dedupe, and PNL behavior stay predictable.
- Are my API keys stored in the browser?
  - No. The browser only sends raw credentials to the Edge Function over HTTPS. The function validates and encrypts them before storage.
- What powers the PNL Index now?
  - The app builds a shared trading index from manual trades plus imported Bybit trades, then dedupes by external trade ID or fingerprint.

## Security Audit Checklist
- Confirm the client never writes Bybit credentials to `localStorage`, Vite env vars, or logs.
- Confirm only masked API key metadata is ever rendered in the UI.
- Confirm `BYBIT_CREDENTIAL_ENCRYPTION_KEY` exists in the Edge Function environment.
- Confirm there is no direct authenticated client policy on `bybit_connections`; only service-role Edge Functions should touch it.
- Confirm `bybit_trade_cache` RLS policies restrict access to `auth.uid()`.
- Confirm the sync function updates `sync_error` without exposing secrets.
- Confirm Bybit egress originates from a non-U.S. region before enabling the feature in production.
