import { createClient } from 'npm:@supabase/supabase-js@2';

type Json = Record<string, unknown>;
type BybitEnvironment = 'mainnet' | 'testnet';

export interface AuthedContext {
  userId: string;
  supabase: ReturnType<typeof createClient>;
}

interface BybitApiResponse<T> {
  retCode: number;
  retMsg: string;
  result: T;
  time?: number;
}

interface QueryApiResult {
  apiKey: string;
  readOnly: number;
  permissions?: Record<string, string[]>;
  note?: string;
}

export interface BybitValidationResult {
  validationStatus: 'valid' | 'invalid' | 'permission_denied';
  permissionSnapshot: Record<string, unknown> | null;
  apiKeyMasked: string;
  apiKeyLast4: string;
}

export interface AggregatedTradeRow {
  user_id: string;
  environment: BybitEnvironment;
  trade_day: string;
  external_trade_id: string;
  order_id: string;
  symbol: string;
  side: 'Buy' | 'Sell' | 'Unknown';
  executed_at: string;
  exec_qty: number;
  exec_price: number;
  exec_fee: number | null;
  fee_currency: string | null;
  closed_pnl: number | null;
  raw_execution: Record<string, unknown>;
  raw_closed_pnl: Record<string, unknown> | null;
  trade_fingerprint: string;
  synced_at: string;
}

export interface UtcBounds {
  startTime: number;
  endTime: number;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  ...CORS_HEADERS,
};

export function corsPreflightResponse() {
  return new Response('ok', { headers: CORS_HEADERS });
}

function getEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveAesKey(secret: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', hash, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function signHmacSha256(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function encryptSecret(secret: string) {
  const encryptionKey = await deriveAesKey(getEnv('BYBIT_CREDENTIAL_ENCRYPTION_KEY'));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    encryptionKey,
    new TextEncoder().encode(secret)
  );

  return {
    secretCiphertext: encodeBase64(new Uint8Array(ciphertext)),
    secretIv: encodeBase64(iv),
    secretVersion: 'v1',
  };
}

export async function decryptSecret(secretCiphertext: string, secretIv: string): Promise<string> {
  const encryptionKey = await deriveAesKey(getEnv('BYBIT_CREDENTIAL_ENCRYPTION_KEY'));
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: decodeBase64(secretIv) },
    encryptionKey,
    decodeBase64(secretCiphertext)
  );

  return new TextDecoder().decode(plaintext);
}

function getBybitBaseUrl(environment: BybitEnvironment) {
  return environment === 'testnet' ? 'https://api-testnet.bybit.com' : 'https://api.bybit.com';
}

export function maskApiKey(apiKey: string) {
  const last4 = apiKey.slice(-4);
  const visiblePrefix = apiKey.slice(0, 4);
  return {
    apiKeyLast4: last4,
    apiKeyMasked: `${visiblePrefix}${'*'.repeat(Math.max(apiKey.length - 8, 4))}${last4}`,
  };
}

function hasLinearPermission(snapshot: Record<string, unknown> | null) {
  if (!snapshot) return false;

  const permissions = snapshot.permissions as Record<string, unknown> | undefined;
  const derivatives = permissions?.Derivatives;
  const contractTrade = permissions?.ContractTrade;

  const derivativesAllowed = Array.isArray(derivatives) && derivatives.length > 0;
  const contractAllowed = Array.isArray(contractTrade) && contractTrade.length > 0;

  return derivativesAllowed || contractAllowed;
}

async function fetchBybitServerTime(environment: BybitEnvironment): Promise<number> {
  const response = await fetch(`${getBybitBaseUrl(environment)}/v5/market/time`);
  const payload = await response.json() as BybitApiResponse<{ timeSecond: string }>;

  if (payload.retCode !== 0) {
    throw new Error(payload.retMsg || 'Unable to fetch Bybit server time.');
  }

  return Number(payload.result.timeSecond) * 1000;
}

async function bybitSignedGet<T>(
  environment: BybitEnvironment,
  apiKey: string,
  apiSecret: string,
  path: string,
  params: Record<string, string | number | undefined>,
  attempt = 0,
  timestampOverride?: number
): Promise<BybitApiResponse<T>> {
  const recvWindow = '10000';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  const timestamp = timestampOverride ?? Date.now();
  const prehash = `${timestamp}${apiKey}${recvWindow}${queryString}`;
  const signature = await signHmacSha256(apiSecret, prehash);

  const response = await fetch(`${getBybitBaseUrl(environment)}${path}?${queryString}`, {
    headers: {
      'X-BAPI-API-KEY': apiKey,
      'X-BAPI-TIMESTAMP': String(timestamp),
      'X-BAPI-RECV-WINDOW': recvWindow,
      'X-BAPI-SIGN': signature,
    },
  });

  if (response.status === 429 && attempt < 1) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return bybitSignedGet(environment, apiKey, apiSecret, path, params, attempt + 1);
  }

  if (response.status === 403) {
    throw new Error('Bybit rejected the request with HTTP 403. Check API IP bindings and deploy the function from a non-U.S. region.');
  }

  const payload = await response.json() as BybitApiResponse<T>;

  if (payload.retCode === 0) {
    return payload;
  }

  if (payload.retCode === 10002 && attempt < 1) {
    const serverTimestamp = await fetchBybitServerTime(environment);
    return bybitSignedGet(environment, apiKey, apiSecret, path, params, attempt + 1, serverTimestamp);
  }

  if ((payload.retCode === 10000 || payload.retCode === 10016 || payload.retCode === 10006) && attempt < 1) {
    await new Promise((resolve) => setTimeout(resolve, 750));
    return bybitSignedGet(environment, apiKey, apiSecret, path, params, attempt + 1);
  }

  throw new Error(`${payload.retCode}: ${payload.retMsg}`);
}

export async function getAuthedContext(req: Request): Promise<AuthedContext> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new Error('Missing Authorization header.');

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Unauthorized');

  return {
    userId: data.user.id,
    supabase,
  };
}

export function jsonResponse(status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export async function validateBybitCredentials(
  environment: BybitEnvironment,
  apiKey: string,
  apiSecret: string
): Promise<BybitValidationResult> {
  const { apiKeyMasked, apiKeyLast4 } = maskApiKey(apiKey);
  const response = await bybitSignedGet<QueryApiResult>(environment, apiKey, apiSecret, '/v5/user/query-api', {});
  const permissionSnapshot = response.result ? { ...response.result } as Record<string, unknown> : null;

  if (!hasLinearPermission(permissionSnapshot)) {
    return {
      validationStatus: 'permission_denied',
      permissionSnapshot,
      apiKeyMasked,
      apiKeyLast4,
    };
  }

  return {
    validationStatus: 'valid',
    permissionSnapshot,
    apiKeyMasked,
    apiKeyLast4,
  };
}

interface ExecutionItem {
  symbol: string;
  orderId: string;
  side?: 'Buy' | 'Sell';
  execId: string;
  execPrice: string;
  execQty: string;
  execFee?: string;
  feeCurrency?: string;
  execTime: string;
}

interface ClosedPnlItem {
  symbol: string;
  orderId: string;
  closedPnl?: string;
  [key: string]: unknown;
}

async function fetchPaged<T extends { nextPageCursor?: string; list: Record<string, unknown>[] }>(
  environment: BybitEnvironment,
  apiKey: string,
  apiSecret: string,
  path: string,
  params: Record<string, string | number | undefined>
) {
  const items: Record<string, unknown>[] = [];
  let cursor: string | undefined;

  do {
    const response = await bybitSignedGet<T>(environment, apiKey, apiSecret, path, {
      ...params,
      cursor,
    });
    items.push(...response.result.list);
    cursor = response.result.nextPageCursor || undefined;
  } while (cursor);

  return items;
}

function createFingerprintForTrade(trade: {
  symbol: string;
  side: string;
  executedAt: string;
  quantity: number;
  price: number;
}) {
  const type = trade.side === 'Sell' ? 'Short Future' : 'Long Future';
  return [
    'bybit',
    trade.symbol.toUpperCase(),
    type,
    trade.side,
    trade.executedAt,
    trade.quantity.toFixed(8),
    trade.price.toFixed(8),
  ].join('|');
}

function getPartsInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const lookup = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  ) as Record<string, string>;

  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const zoned = getPartsInTimeZone(date, timeZone);
  const asUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second,
    0
  );

  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(localDateTime: string, timeZone: string) {
  const [datePart, timePart] = localDateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, secondWithMs = '00.000'] = timePart.split(':');
  const [second, millisecond = '000'] = secondWithMs.split('.');

  const utcGuess = new Date(Date.UTC(
    year,
    month - 1,
    day,
    Number(hour),
    Number(minute),
    Number(second),
    Number(millisecond.padEnd(3, '0').slice(0, 3))
  ));

  const offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  const adjusted = new Date(utcGuess.getTime() - offset);
  const adjustedOffset = getTimeZoneOffsetMs(adjusted, timeZone);

  return new Date(utcGuess.getTime() - adjustedOffset);
}

export function getUtcBoundsForDateInTimeZone(date: string, timeZone: string): UtcBounds {
  const start = zonedDateTimeToUtc(`${date}T00:00:00.000`, timeZone);
  const end = zonedDateTimeToUtc(`${date}T23:59:59.999`, timeZone);

  return {
    startTime: start.getTime(),
    endTime: end.getTime(),
  };
}

export async function fetchAggregatedTradesForDay(input: {
  userId: string;
  environment: BybitEnvironment;
  apiKey: string;
  apiSecret: string;
  tradeDay: string;
  startTime: number;
  endTime: number;
}): Promise<AggregatedTradeRow[]> {
  const executionItems = await fetchPaged<{ nextPageCursor?: string; list: ExecutionItem[] }>(
    input.environment,
    input.apiKey,
    input.apiSecret,
    '/v5/execution/list',
    {
      category: 'linear',
      startTime: input.startTime,
      endTime: input.endTime,
      limit: 100,
    }
  ) as ExecutionItem[];

  const closedPnls = await fetchPaged<{ nextPageCursor?: string; list: ClosedPnlItem[] }>(
    input.environment,
    input.apiKey,
    input.apiSecret,
    '/v5/position/closed-pnl',
    {
      category: 'linear',
      startTime: input.startTime,
      endTime: input.endTime,
      limit: 100,
    }
  ) as ClosedPnlItem[];

  const closedPnlMap = new Map(
    closedPnls.map((row) => [`${row.orderId}|${row.symbol}`, row])
  );

  const grouped = new Map<string, ExecutionItem[]>();
  executionItems.forEach((execution) => {
    const key = `${execution.orderId || execution.execId}|${execution.symbol}`;
    const current = grouped.get(key) || [];
    current.push(execution);
    grouped.set(key, current);
  });

  const now = new Date().toISOString();
  return Array.from(grouped.entries()).map(([key, executions]) => {
    const totalQty = executions.reduce((sum, item) => sum + Number(item.execQty || 0), 0);
    const totalValue = executions.reduce((sum, item) => sum + Number(item.execQty || 0) * Number(item.execPrice || 0), 0);
    const totalFee = executions.reduce((sum, item) => sum + Number(item.execFee || 0), 0);
    const latestExecution = executions.slice().sort((a, b) => Number(b.execTime) - Number(a.execTime))[0];
    const orderId = latestExecution.orderId || latestExecution.execId;
    const closedPnlRow = closedPnlMap.get(`${orderId}|${latestExecution.symbol}`) || null;
    const executedAt = new Date(Number(latestExecution.execTime)).toISOString();
    const avgPrice = totalQty > 0 ? totalValue / totalQty : Number(latestExecution.execPrice || 0);
    const side = latestExecution.side || 'Unknown';

    return {
      user_id: input.userId,
      environment: input.environment,
      trade_day: input.tradeDay,
      external_trade_id: orderId,
      order_id: orderId,
      symbol: latestExecution.symbol,
      side,
      executed_at: executedAt,
      exec_qty: totalQty,
      exec_price: avgPrice,
      exec_fee: Number.isFinite(totalFee) ? totalFee : null,
      fee_currency: latestExecution.feeCurrency || null,
      closed_pnl: closedPnlRow?.closedPnl ? Number(closedPnlRow.closedPnl) : null,
      raw_execution: {
        key,
        fills: executions,
      },
      raw_closed_pnl: closedPnlRow,
      trade_fingerprint: createFingerprintForTrade({
        symbol: latestExecution.symbol,
        side,
        executedAt,
        quantity: totalQty,
        price: avgPrice,
      }),
      synced_at: now,
    };
  });
}
