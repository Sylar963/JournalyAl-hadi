# Delta Journal

A trading psychology journal that helps you review emotions, routines, and trade outcomes, with AI features served securely through Supabase Edge Functions.

## Features

- **Trader Emotion Journaling** - Track sessions with trader-focused emotions like confident, anxious, frustrated, fomo, and max pain
- **Bybit Trading Integration** - Connect your Bybit account to import and link trades to your journal entries
- **Thalex Integration** - Connect options and futures activity through RSA-based API credentials
- **AI-Powered Insights** - Gemini AI analyzes your entries for patterns, wins, and areas to improve
- **Performance Review** - Yearly and quarterly reviews to identify recurring problems and successes
- **Trends & Analytics** - Visualize emotional patterns and P&L correlations over time
- **Daily Routines** - Pre-market routine checklists and bias-setting plugins
- **Backup & Restore** - Export and import JSON backups for safer device changes and recovery

## Run Locally

**Prerequisites:** Node.js 22.13+ and pnpm 11

1. Install dependencies:
   ```
   pnpm install
   ```

2. Create a `.env.local` file with your Supabase client credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   AI features and broker integrations now require Supabase Edge Functions. Set `GEMINI_API_KEY` as an Edge Function secret in Supabase instead of exposing it to the browser bundle.
   Deploy at least `supabase/functions/journal-ai` and `supabase/functions/capture-lead` for AI and waitlist flows.

3. Run the app:
   ```
   pnpm run dev
   ```

4. Open http://localhost:5173 in your browser

## Security Notes

- Local-only mode persists in browser storage on the current device.
- Supabase auth sessions are stored in `sessionStorage`, not `localStorage`.
- Lead capture, AI features, and broker sync now run through server-side Edge Functions with rate limiting.
- Set `SENTRY_DSN` to enable production error monitoring.
