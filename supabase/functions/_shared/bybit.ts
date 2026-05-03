import { getEnv } from './integration-runtime.ts';

type BybitEnvironment = 'mainnet' | 'testnet';

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

export interface AggregatedPositionRow {
  user_id: string;
  environment: BybitEnvironment;
  symbol: string;
  side: 'Buy' | 'Sell' | 'Unknown';
  position_status: 'open' | 'closed';
  size: number;
  entry_price: number | null;
  mark_price: number | null;
  unrealized_pnl: number | null;
  liquidation_price: number | null;
  leverage: number | null;
  position_value: number | null;
  margin_mode: 'cross' | 'isolated' | 'unknown';
  external_position_id: string;
  updated_at: string | null;
  raw_position: Record<string, unknown>;
  synced_at: string;
}

export interface UtcBounds {
  startTime: number;
  endTime: number;
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
  side?: 'Buy' | 'Sell';
  closedPnl?: string;
  [key: string]: unknown;
}

interface AccountInfoResult {
  marginMode: string;
  unifiedMarginStatus: number;
  [key: string]: unknown;
}

async function fetchAccountMarginMode(
  environment: BybitEnvironment,
  apiKey: string,
  apiSecret: string
): Promise<'cross' | 'isolated' | 'unknown'> {
  const response = await bybitSignedGet<{ retCode: number; retMsg: string; result: AccountInfoResult }>(
    environment,
    apiKey,
    apiSecret,
    '/v5/account/info',
    {}
  );

  if (response.retCode !== 0) {
    return 'unknown';
  }

  const marginMode = response.result?.marginMode;
  if (marginMode === 'ISOLATED_MARGIN') return 'isolated';
  if (marginMode === 'REGULAR_MARGIN') return 'cross';
  return 'unknown';
}

interface PositionItem {
  symbol: string;
  side?: 'Buy' | 'Sell' | 'None' | '';
  size?: string;
  avgPrice?: string;
  markPrice?: string;
  unrealisedPnl?: string;
  liqPrice?: string;
  leverage?: string;
  positionValue?: string;
  tradeMode?: number;
  updatedTime?: string;
  [key: string]: unknown;
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveMarginMode(tradeMode: unknown): 'cross' | 'isolated' | 'unknown' {
  if (tradeMode === 0 || tradeMode === '0') return 'cross';
  if (tradeMode === 1 || tradeMode === '1') return 'isolated';
  return 'unknown';
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
  isClosingPosition?: boolean;
}) {
  const type = trade.isClosingPosition
    ? trade.side === 'Sell' ? 'Long Future' : 'Short Future'
    : trade.side === 'Sell' ? 'Short Future' : 'Long Future';
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

export function mapBybitConnectionRow(row: {
  environment: BybitEnvironment;
  api_key_masked: string;
  api_key_last4: string;
  validation_status: 'not_connected' | 'pending' | 'valid' | 'invalid' | 'permission_denied';
  permission_snapshot: Record<string, unknown> | null;
  last_validated_at: string | null;
  last_sync_at: string | null;
  sync_status: 'idle' | 'syncing' | 'ready' | 'error' | null;
  sync_error: string | null;
}) {
  return {
    provider: 'bybit' as const,
    environment: row.environment,
    apiKeyMasked: row.api_key_masked,
    apiKeyLast4: row.api_key_last4,
    validationStatus: row.validation_status,
    permissionSnapshot: row.permission_snapshot,
    lastValidatedAt: row.last_validated_at,
    lastSyncAt: row.last_sync_at,
    syncStatus: row.sync_status,
    syncError: row.sync_error,
  };
}

export function mapBybitTradeRow(trade: AggregatedTradeRow) {
  const isClosingPosition = trade.raw_closed_pnl !== null;
  return {
    id: trade.external_trade_id,
    provider: 'bybit' as const,
    environment: trade.environment,
    tradeDay: trade.trade_day,
    externalTradeId: trade.external_trade_id,
    orderId: trade.order_id,
    symbol: trade.symbol,
    side: trade.side,
    executedAt: trade.executed_at,
    quantity: trade.exec_qty,
    price: trade.exec_price,
    fee: trade.exec_fee ?? undefined,
    feeCurrency: trade.fee_currency ?? undefined,
    closedPnl: trade.closed_pnl ?? undefined,
    type: isClosingPosition
      ? trade.side === 'Sell' ? 'Long Future' : 'Short Future'
      : trade.side === 'Sell' ? 'Short Future' : 'Long Future',
    tradeFingerprint: trade.trade_fingerprint,
    rawExecution: trade.raw_execution,
    rawClosedPnl: trade.raw_closed_pnl,
  };
}

export function mapBybitPositionRow(position: AggregatedPositionRow) {
  return {
    id: position.external_position_id,
    provider: 'bybit' as const,
    environment: position.environment,
    symbol: position.symbol,
    side: position.side,
    status: position.position_status,
    quantity: position.size,
    entryPrice: position.entry_price ?? undefined,
    markPrice: position.mark_price ?? undefined,
    unrealizedPnl: position.unrealized_pnl ?? undefined,
    liquidationPrice: position.liquidation_price ?? undefined,
    leverage: position.leverage ?? undefined,
    positionValue: position.position_value ?? undefined,
    marginMode: position.margin_mode,
    updatedAt: position.updated_at ?? undefined,
    externalPositionId: position.external_position_id,
    type: position.side === 'Sell' ? 'Short Future' : 'Long Future',
    rawPosition: position.raw_position,
  };
}

export async function fetchActivePositions(input: {
  userId: string;
  environment: BybitEnvironment;
  apiKey: string;
  apiSecret: string;
  symbol?: string;
}): Promise<AggregatedPositionRow[]> {
  const [positions, marginMode] = await Promise.all([
    fetchPaged<{ nextPageCursor?: string; list: PositionItem[] }>(
      input.environment,
      input.apiKey,
      input.apiSecret,
      '/v5/position/list',
      {
        category: 'linear',
        settleCoin: input.symbol ? undefined : 'USDT',
        symbol: input.symbol,
        limit: 200,
      }
    ) as Promise<PositionItem[]>,
    fetchAccountMarginMode(input.environment, input.apiKey, input.apiSecret),
  ]);

  const now = new Date().toISOString();
  return positions
    .filter((position) => {
      const size = Number(position.size || 0);
      return Number.isFinite(size) && size > 0 && position.side !== 'None' && position.side !== '';
    })
    .map((position) => {
      const side = position.side === 'Sell' ? 'Sell' : position.side === 'Buy' ? 'Buy' : 'Unknown';
      const updatedAt = position.updatedTime
        ? new Date(Number(position.updatedTime)).toISOString()
        : null;

      return {
        user_id: input.userId,
        environment: input.environment,
        symbol: position.symbol,
        side,
        position_status: 'open',
        size: Number(position.size || 0),
        entry_price: toOptionalNumber(position.avgPrice),
        mark_price: toOptionalNumber(position.markPrice),
        unrealized_pnl: toOptionalNumber(position.unrealisedPnl),
        liquidation_price: toOptionalNumber(position.liqPrice),
        leverage: toOptionalNumber(position.leverage),
        position_value: toOptionalNumber(position.positionValue),
        margin_mode: marginMode,
        external_position_id: `position:${position.symbol}:${side}`,
        updated_at: updatedAt,
        raw_position: position as Record<string, unknown>,
        synced_at: now,
      };
    });
}

export async function fetchAggregatedTradesForDay(input: {
  userId: string;
  environment: BybitEnvironment;
  apiKey: string;
  apiSecret: string;
  tradeDay: string;
  startTime: number;
  endTime: number;
  symbol?: string;
}): Promise<AggregatedTradeRow[]> {
  const executionItems = await fetchPaged<{ nextPageCursor?: string; list: ExecutionItem[] }>(
    input.environment,
    input.apiKey,
    input.apiSecret,
    '/v5/execution/list',
    {
      category: 'linear',
      symbol: input.symbol,
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
      symbol: input.symbol,
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
        isClosingPosition: closedPnlRow !== null,
      }),
      synced_at: now,
    };
  });
}
