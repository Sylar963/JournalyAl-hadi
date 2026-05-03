# AGENTS.md

## Repo Shape
- Single-package npm repo. Use `npm`; the lockfile is `package-lock.json`.
- This is a Vite + React app, but the main app code is not under `src/`. Start from root `index.tsx` -> `App.tsx`, then `components/`, `hooks/`, `services/`, `utils/`, `types.ts`, and `constants.ts`.
- `src/` is currently only a small type-augmentation area (`src/types/three-elements.d.ts`), not the main application tree.

## Env And Runtime Modes
- Frontend env is read through `process.env.*`, not `import.meta.env`. `vite.config.ts` injects `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, and `API_KEY` into client code.
- `config.ts` re-exports `SUPABASE_URL` and `SUPABASE_ANON_KEY` for service imports.
- `GEMINI_API_KEY` powers the Gemini features; `services/geminiService.ts` and `services/behaviorLearner.ts` read it as `process.env.API_KEY`.

## Commands
- `npm run dev` starts Vite on `0.0.0.0:5173`.
- `npm run build` builds to `dist/`. There are no dedicated `lint` or `typecheck` scripts, so `build` is the closest repo-wide compile check.
- `npm run test` runs Vitest once.
- Focused unit test: `npx vitest run tests/tradingIndexService.test.ts`
- `npm run test:e2e` runs Playwright against `http://127.0.0.1:4173` and auto-starts `npm run dev -- --host 127.0.0.1 --port 4173`.
- First Playwright run needs `npx playwright install`; otherwise browser launch fails before tests start.
- Focused e2e test: `npx playwright test e2e/bybit-local-fallback.spec.ts`
- `npm run smoke:bybit` is a Supabase Edge Function smoke test, not a local UI smoke test. It needs `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and either `DJ_SMOKE_ACCESS_TOKEN` or `DJ_SMOKE_EMAIL` + `DJ_SMOKE_PASSWORD`.

## Verification
- Default verification order for app changes: `npm run test` then `npm run build`.
- Add `npm run test:e2e` when changing navigation, settings, or the local-vs-Supabase availability flow.

## Wiring To Preserve
- `services/dataService.ts` is the persistence seam. UI code should usually call that layer instead of importing both `localDataService.ts` and `supabaseService.ts` directly.
- `services/tradingProviderRegistry.ts` is the extension seam for trading providers. `bybit` is implemented with `trade_history`; `hyperliquid` is implemented with `market_data`.
- Bybit browser calls are routed through Supabase Edge Functions from `services/supabaseService.ts`, using `forceFunctionRegion` fallback `ca-central-1` then `eu-west-1`. Do not move Bybit credential handling or request signing into client code.
- If you change Bybit schema/setup behavior, keep these aligned: `supabase/sql/bybit_setup.sql`, the setup/error helpers in `services/supabaseService.ts` (`BYBIT_SETUP_SQL`, schema error messaging), and `docs/BYBIT_INTEGRATION.md`.

## Test Gotchas
- Components that call `useI18n` must be rendered inside `I18nProvider`; existing tests already wrap for this.
- `dist/` and `test-results/` are generated outputs. Do not edit them unless the task is specifically about build or Playwright artifacts.

## Emotions Configuration
- Valid `EmotionType` values: `happy`, `calm`, `anxious`, `sad`, `angry`
- Defined in `constants.ts` as `EMOTIONS_CONFIG`
- Used throughout components (`CalendarView.tsx`, `EntryModal.tsx`, `HistoryView.tsx`, `TrendsView.tsx`, `PNLCorrelationView.tsx`)
- Auto-synced entries from Bybit use emotion `neutral` which is NOT a valid EmotionType - calendar handles this gracefully by checking for trades instead