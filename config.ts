/**
 * Supabase configuration.
 *
 * IMPORTANT:
 * These variables are sourced from your environment. For this web studio, these
 * can be configured in the "Secrets" panel. For local development, you can
 * create a `.env` file in the project root.
 *
 * Required secrets:
 * - SUPABASE_URL: Your Supabase project URL.
 * - SUPABASE_ANON_KEY: Your Supabase project's public "anon" key.
 *
 * The Supabase URL and anon key can be found in your Supabase project's
 * dashboard under Project Settings > API.
 *
 * The anon key is safe to be exposed in a client-side application.
 */
export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
