/**
 * Supabase configuration.
 *
 * IMPORTANT:
 * 1. Go to your Supabase project dashboard.
 * 2. Navigate to Project Settings > API.
 * 3. Copy the "Project URL" and paste it into SUPABASE_URL.
 * 4. Copy the "anon" "public" key and paste it into SUPABASE_ANON_KEY.
 *
 * DO NOT a.k.a. NEVER EVER commit your "service_role" key or other secrets to version control.
 * The anon key is designed to be publicly accessible.
 */
export const SUPABASE_URL = 'https://cgztttudpjyfsyrowwew.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnenR0dHVkcGp5ZnN5cm93d2V3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMzMxNjIsImV4cCI6MjA2MzgwOTE2Mn0.HMvF77OLdZQxGwR9eKJwmxAPIOmL4UO8ReSGu7vOwiM';


/**
 * Google Gemini API Key configuration.
 *
 * IMPORTANT:
 * 1. Go to Google AI Studio at https://aistudio.google.com/
 * 2. Click "Get API key" and create a new API key.
 * 3. Paste the key here.
 *
 * This key is used for all AI-powered features in the app. If it's not provided,
 * those features will show an error message guiding you to configure it.
 */
export const GEMINI_API_KEY = 'AIzaSyCH4vwrL_cMTAN6W2ngt7CgAC0zhflfpGo';