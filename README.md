# Journaly

A personal AI-powered journaling application that helps you reflect, plan, and grow through daily writing enhanced with Gemini AI.

## Features

- **Emotion-Based Journaling** - Track daily journal entries linked to emotions (joy, calm, frustration, etc.)
- **Bybit Trading Integration** - Connect your Bybit account to import and link trades to your journal entries
- **AI-Powered Insights** - Gemini AI analyzes your entries for patterns, wins, and areas to improve
- **Performance Review** - Yearly and quarterly reviews to identify recurring problems and successes
- **Trends & Analytics** - Visualize emotional patterns and P&L correlations over time
- **Daily Routines** - Pre-market routine checklists and bias-setting plugins

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env.local` file with your API keys:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

   Optional: For Bybit trading features, add Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the app:
   ```
   npm run dev
   ```

4. Open http://localhost:5173 in your browser