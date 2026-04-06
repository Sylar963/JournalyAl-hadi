import { createClient } from '@supabase/supabase-js';

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getLocalDateString(timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(new Date());
}

async function getAccessToken(supabase) {
  const directToken = process.env.DJ_SMOKE_ACCESS_TOKEN;
  if (directToken) {
    return directToken;
  }

  const email = process.env.DJ_SMOKE_EMAIL;
  const password = process.env.DJ_SMOKE_PASSWORD;

  if (!email || !password) {
    throw new Error('Provide DJ_SMOKE_ACCESS_TOKEN or both DJ_SMOKE_EMAIL and DJ_SMOKE_PASSWORD.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session?.access_token) {
    throw new Error(error?.message || 'Unable to sign in for Bybit smoke test.');
  }

  return data.session.access_token;
}

async function main() {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL');
  const supabaseAnonKey = getRequiredEnv('SUPABASE_ANON_KEY');
  const timeZone = process.env.BYBIT_SMOKE_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const date = process.env.BYBIT_SMOKE_DATE || getLocalDateString(timeZone);
  const symbol = (process.env.BYBIT_SMOKE_SYMBOL || 'CLUSDT').toUpperCase();

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const accessToken = await getAccessToken(supabase);
  const response = await fetch(`${supabaseUrl}/functions/v1/bybit-sync-trades`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      date,
      timezone: timeZone,
      symbol,
      previewOnly: true,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Bybit smoke test failed with HTTP ${response.status}.`);
  }

  const trades = Array.isArray(payload.trades)
    ? payload.trades.filter((trade) => trade?.symbol === symbol)
    : [];

  if (trades.length === 0) {
    throw new Error(`No ${symbol} trades were returned for ${date} (${timeZone}).`);
  }

  console.log(`Bybit backend smoke test succeeded for ${symbol} on ${date} (${timeZone}).`);
  console.log(`Fetched ${trades.length} trade(s).`);
  for (const trade of trades) {
    const pnl = typeof trade.closedPnl === 'number' ? trade.closedPnl.toFixed(2) : 'n/a';
    console.log(
      [
        trade.executedAt,
        trade.side,
        `${trade.quantity}@${trade.price}`,
        `pnl=${pnl}`,
        trade.orderId,
      ].join(' | ')
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
