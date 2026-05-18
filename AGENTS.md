# AGENTS.md

## Repo Shape
- Single-package pnpm repo. Use `pnpm`; the lockfile is `pnpm-lock.yaml`.
- This is a Vite + React app, but the main app code is not under `src/`. Start from root `index.tsx` -> `App.tsx`, then `components/`, `hooks/`, `services/`, `utils/`, `types.ts`, and `constants.ts`.
- `src/` is currently only a small type-augmentation area (`src/types/three-elements.d.ts`), not the main application tree.

## Env And Runtime Modes
- Frontend env is read through `process.env.*`, not `import.meta.env`. `vite.config.ts` injects only `SUPABASE_URL` and `SUPABASE_ANON_KEY` into client code.
- `config.ts` re-exports `SUPABASE_URL` and `SUPABASE_ANON_KEY` for service imports.
- `GEMINI_API_KEY` now lives only in Supabase Edge Function secrets and is read by `supabase/functions/journal-ai`.

## Commands
- `pnpm run dev` starts Vite on `0.0.0.0:5173`.
- `pnpm run build` builds to `dist/`. There are no dedicated `lint` or `typecheck` scripts, so `build` is the closest repo-wide compile check.
- `pnpm run test` runs Vitest once.
- Focused unit test: `pnpm exec vitest run tests/tradingIndexService.test.ts`
- `pnpm run test:e2e` runs Playwright against `http://127.0.0.1:4173` and auto-starts `pnpm run dev -- --host 127.0.0.1 --port 4173`.
- First Playwright run needs `pnpm exec playwright install`; otherwise browser launch fails before tests start.
- Focused e2e test: `pnpm exec playwright test e2e/bybit-local-fallback.spec.ts`
- `pnpm run smoke:bybit` is a Supabase Edge Function smoke test, not a local UI smoke test. It needs `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and either `DJ_SMOKE_ACCESS_TOKEN` or `DJ_SMOKE_EMAIL` + `DJ_SMOKE_PASSWORD`.

## Verification
- Default verification order for app changes: `pnpm run test` then `pnpm run build`.
- Add `pnpm run test:e2e` when changing navigation, settings, or the local-vs-Supabase availability flow.

## Wiring To Preserve
- `services/dataService.ts` is the persistence seam. UI code should usually call that layer instead of importing both `localDataService.ts` and `supabaseService.ts` directly.
- `services/tradingProviderRegistry.ts` is the extension seam for trading providers. `bybit` is implemented with `trade_history`; `hyperliquid` is implemented with `market_data`.
- Bybit browser calls are routed through Supabase Edge Functions from `services/supabaseService.ts`, using `forceFunctionRegion` fallback `ca-central-1` then `eu-west-1`. Do not move Bybit credential handling or request signing into client code.
- If you change Bybit schema/setup behavior, keep these aligned: `supabase/sql/bybit_setup.sql`, the setup/error helpers in `services/supabaseService.ts` (`BYBIT_SETUP_SQL`, schema error messaging), and `docs/BYBIT_INTEGRATION.md`.

## Test Gotchas
- Components that call `useI18n` must be rendered inside `I18nProvider`; existing tests already wrap for this.
- `dist/` and `test-results/` are generated outputs. Do not edit them unless the task is specifically about build or Playwright artifacts.

## Emotions Configuration
- Valid `EmotionType` values: `confident`, `composed`, `anxious`, `hesitant`, `frustrated`, `euphoric`
- Defined in `constants.ts` as `EMOTIONS_CONFIG`
- Used throughout components (`CalendarView.tsx`, `EntryModal.tsx`, `HistoryView.tsx`, `TrendsView.tsx`, `PNLCorrelationView.tsx`)
- Legacy values like `happy`, `calm`, `sad`, `angry`, and `neutral` are normalized in `utils/emotions.ts`
