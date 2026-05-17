# Journaly

A personal journaling application that helps you reflect, plan, and grow through daily writing, with AI features served securely through Supabase Edge Functions.

## Features

- **Emotion-Based Journaling** - Track daily journal entries linked to emotions (joy, calm, frustration, etc.)
- **Bybit Trading Integration** - Connect your Bybit account to import and link trades to your journal entries
- **AI-Powered Insights** - Gemini AI analyzes your entries for patterns, wins, and areas to improve
- **Performance Review** - Yearly and quarterly reviews to identify recurring problems and successes
- **Trends & Analytics** - Visualize emotional patterns and P&L correlations over time
- **Daily Routines** - Pre-market routine checklists and bias-setting plugins

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

- Local-only mode is session-scoped and clears journal data when the browser tab closes.
- Supabase auth sessions are stored in `sessionStorage`, not `localStorage`.
- Lead capture, AI features, and broker sync now run through server-side Edge Functions with rate limiting.
