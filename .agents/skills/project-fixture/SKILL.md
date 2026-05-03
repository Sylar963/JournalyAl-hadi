---
name: project-fixture
description: Project-specific setup, dependencies, and known issues for Deltajournal. Use this skill when working with this codebase.
---

This skill documents critical setup requirements and known issues for this Vite + React project.

## Project Overview

- **Type**: Vite + React 18 application
- **Node**: 18+
- **Package Manager**: npm (uses package-lock.json)

## Critical Dependencies & Versions

```
vite: ^6.2.0 (devDependency)
@vitejs/plugin-react: ^5.0.0 (devDependency)
react: 18.2.0
react-dom: 18.2.0
```

## Known Issues & Fixes

### 1. React hooks not defined (useMemo, useState, etc.)

**Symptom**: `ReferenceError: useMemo is not defined` in production build

**Cause**: Vite 6.2+ has a bug with @vitejs/plugin-react 5.0 that incorrectly tree-shakes React hooks during minification

**Fix**: Add `optimizeDeps.include` to vite.config.ts:

```ts
optimizeDeps: {
  include: ['react', 'react-dom'],
},
```

### 2. Tailwind CDN in production

**Symptom**: SES warnings and "cdn.tailwindcss.com should not be used in production"

**Fix**: Remove `<script src="https://cdn.tailwindcss.com"></script>` from index.html. The project uses CSS variables instead.

### 3. React error #310 (hooks ordering)

**Symptom**: App crashes with "Error #310: Rendered more hooks than during the previous render"

**Cause**: Using React.lazy() and Suspense incorrectly causes hooks to be called in different orders

**Fix**: Use static imports instead of lazy loading, or ensure Suspense boundaries are properly configured at the top level

## Required Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment variables** (optional - app works in local-only mode without them):
   - `SUPABASE_URL` - Supabase project URL
   - `SUPABASE_ANON_KEY` - Supabase anonymous key
   - `GEMINI_API_KEY` - For AI features

## Commands

- `npm run dev` - Start dev server on 0.0.0.0:5173
- `npm run build` - Production build (also runs typecheck)
- `npm run test` - Run Vitest tests
- `npm run test:e2e` - Run Playwright e2e tests (auto-starts dev server)

## Verification

After any code changes:
1. Run `npm run build` to verify compilation
2. Run `npm run test` to verify tests pass
3. For UI/navigation changes, also run `npm run test:e2e`

## Key Files

- `vite.config.ts` - Vite configuration with React plugin
- `index.html` - Entry HTML (no importmaps - uses Vite bundled React)
- `supabase/functions/_shared/bybit.ts` - Bybit API integration
- `services/dataService.ts` - Persistence layer (supports Supabase or localStorage)