import { createClient } from '@supabase/supabase-js';

const REQUIRED_BASE_VARS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const DEFAULT_REGIONS = ['ca-central-1', 'eu-west-1'];
const DEFAULT_SYMBOL = 'CLUSDT';
const DEFAULT_MODE = 'sync';
const DEFAULT_ENVIRONMENT = 'mainnet';
const DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

function readEnv(name, { required = false, fallback } = {}) {
  const value = process.env[name] ?? fallback;
  if (required && (!value || !String(value).trim())) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseRegions(value) {
  if (!value) return DEFAULT_REGIONS;
  return value
    .split(',')
    .map((region) => region.trim())
    .filter(Boolean);
}

async function getAccessToken() {
  const directToken = readEnv('DJ_SMOKE_ACCESS_TOKEN');
  if (directToken) return directToken;

  const email = readEnv('DJ_SMOKE_EMAIL', { required: true });
  const password = readEnv('DJ_SMOKE_PASSWORD', { required: true });
  const supabaseUrl = readEnv('SUPABASE_URL', { required: true });
  const supabaseAnonKey = readEnv('SUPABASE_ANON_KEY', { required: true });
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(`Supabase sign-in failed: ${error.message}`);
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Supabase sign-in succeeded, but no access token was returned.');
  }

  return accessToken;
}

function getInvocationConfig(mode) {
  if (mode === 'validate' || mode === 'upsert') {
    return {
      functionName: mode === 'validate' ? 'bybit-validate-credentials' : 'bybit-upsert-credentials',
      payload: {
        environment: readEnv('BYBIT_ENVIRONMENT', { fallback: DEFAULT_ENVIRONMENT }),
        apiKey: readEnv('BYBIT_API_KEY', { required: true }),
        apiSecret: readEnv('BYBIT_API_SECRET', { required: true }),
      },
    };
  }

  if (mode === 'sync') {
    return {
      functionName: 'bybit-sync-trades',
      payload: {
        date: readEnv('BYBIT_SMOKE_DATE', { fallback: getTodayDate() }),
        timezone: readEnv('BYBIT_SMOKE_TIMEZONE', { fallback: DEFAULT_TIMEZONE }),
        symbol: readEnv('BYBIT_SMOKE_SYMBOL', { fallback: DEFAULT_SYMBOL }),
        previewOnly: true,
      },
    };
  }

  throw new Error(`Unsupported BYBIT_SMOKE_MODE "${mode}". Use "sync", "validate", or "upsert".`);
}

async function invokeBybitFunction({ functionName, payload, accessToken, regions, supabaseUrl, supabaseAnonKey }) {
  let lastError = null;

  for (const region of regions) {
    const url = new URL(`${supabaseUrl}/functions/v1/${functionName}`);
    url.searchParams.set('forceFunctionRegion', region);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const contentType = response.headers.get('content-type') ?? '';
    const parsedBody = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (response.ok) {
      return {
        region,
        status: response.status,
        body: parsedBody,
      };
    }

    const message =
      typeof parsedBody === 'object' && parsedBody !== null && 'error' in parsedBody
        ? String(parsedBody.error)
        : typeof parsedBody === 'string'
          ? parsedBody
          : `Function invocation failed with HTTP ${response.status}.`;

    lastError = new Error(`[${region}] HTTP ${response.status}: ${message}`);
  }

  throw lastError ?? new Error(`All Bybit smoke invocations failed for ${functionName}.`);
}

function printSection(title, value) {
  console.log(`\n${title}`);
  console.log(JSON.stringify(value, null, 2));
}

async function main() {
  REQUIRED_BASE_VARS.forEach((name) => readEnv(name, { required: true }));

  const mode = readEnv('BYBIT_SMOKE_MODE', { fallback: DEFAULT_MODE });
  const supabaseUrl = readEnv('SUPABASE_URL', { required: true });
  const supabaseAnonKey = readEnv('SUPABASE_ANON_KEY', { required: true });
  const regions = parseRegions(readEnv('BYBIT_SMOKE_REGIONS'));
  const accessToken = await getAccessToken();
  const { functionName, payload } = getInvocationConfig(mode);

  printSection('Bybit smoke config', {
    mode,
    functionName,
    regions,
    payload: {
      ...payload,
      apiKey: typeof payload.apiKey === 'string' ? `${payload.apiKey.slice(0, 4)}...${payload.apiKey.slice(-4)}` : undefined,
      apiSecret: payload.apiSecret ? '[redacted]' : undefined,
    },
  });

  const result = await invokeBybitFunction({
    functionName,
    payload,
    accessToken,
    regions,
    supabaseUrl,
    supabaseAnonKey,
  });

  printSection('Bybit smoke result', result);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\nBybit smoke test failed\n${message}`);
  process.exitCode = 1;
});
