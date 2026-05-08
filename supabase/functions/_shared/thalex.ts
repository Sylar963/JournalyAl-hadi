/**
 * thalex.ts — Shared Thalex API helpers for Supabase Edge Functions
 *
 * Authentication: Thalex uses RSA-signed JWTs (RS256).
 *   - Header:  { alg: "RS256", kid: "<key-name>" }
 *   - Payload: { iat: <unix-timestamp-now> }
 *   - Signed with the user's RSA private key (PEM).
 *
 * Endpoints:
 *   Mainnet: https://thalex.com/api/v2
 *   Testnet: https://testnet.thalex.com/api/v2
 */

export const THALEX_BASE_URLS = {
  mainnet: 'https://thalex.com/api/v2',
  testnet: 'https://testnet.thalex.com/api/v2',
} as const;

// ---------------------------------------------------------------------------
// JWT creation (RS256) using WebCrypto
// ---------------------------------------------------------------------------

function base64UrlEncode(data: string | Uint8Array): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function jsonToBase64Url(obj: unknown): string {
  return base64UrlEncode(JSON.stringify(obj));
}

/**
 * Import an RSA private key from PEM format.
 * Accepts PKCS#8 PEM ("-----BEGIN PRIVATE KEY-----") as Thalex recommends.
 */
async function importRsaPrivateKey(pemString: string): Promise<CryptoKey> {
  // Strip PEM headers/footers and whitespace
  const cleaned = pemString
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const binaryDer = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));

  try {
    return await crypto.subtle.importKey(
      'pkcs8',
      binaryDer.buffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  } catch (err) {
    throw new Error(
      `Failed to import RSA private key. Ensure it is in PKCS#8 PEM format. Inner: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Create a short-lived RS256 JWT for Thalex authentication.
 */
export async function createThalexJwt(keyName: string, privateKeyPem: string): Promise<string> {
  const header = jsonToBase64Url({ alg: 'RS256', kid: keyName });
  const payload = jsonToBase64Url({ iat: Math.floor(Date.now() / 1000) });
  const signingInput = `${header}.${payload}`;

  const key = await importRsaPrivateKey(privateKeyPem);
  const signatureBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );

  const signature = base64UrlEncode(new Uint8Array(signatureBytes));
  return `${signingInput}.${signature}`;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

export interface ThalexRequestOptions {
  keyName: string;
  privateKeyPem: string;
  environment: 'mainnet' | 'testnet';
}

export async function thalexGet<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  opts: ThalexRequestOptions,
): Promise<T> {
  const jwt = await createThalexJwt(opts.keyName, opts.privateKeyPem);
  const base = THALEX_BASE_URLS[opts.environment];
  const url = new URL(`${base}${path}`);

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
  });

  const body = await response.json() as { result?: T; error?: { code: number; message: string } };

  if (!response.ok || body.error) {
    const msg = body.error?.message ?? `HTTP ${response.status}`;
    const code = body.error?.code ?? response.status;
    throw new Error(`Thalex API error (${code}): ${msg}`);
  }

  if (body.result === undefined) {
    throw new Error('Thalex API returned a successful status but no result field.');
  }

  return body.result as T;
}

// ---------------------------------------------------------------------------
// Typed response shapes (subset of the Thalex API schema we need)
// ---------------------------------------------------------------------------

export interface ThalexTradeResponse {
  trade_id:           string;
  order_id:           string;
  instrument_name:    string;
  direction:          'buy' | 'sell';
  price:              number;
  amount:             number;
  time:               number;   // Unix timestamp (float)
  position_after:     number;
  position_pnl?:      number;   // Realised P&L when trade closed a position
  fee?:               number;
  fee_rate?:          number;
  trade_type:         string;   // 'normal' | 'expiration' | 'liquidation' | ...
  label?:             string;
  [key: string]: unknown;
}

export interface ThalexTradeHistoryResult {
  trades:   ThalexTradeResponse[];
  bookmark: string | null;
}

export interface ThalexPortfolioEntry {
  instrument_name:  string;
  position:         number;   // positive = long, negative = short
  mark_price:       number;
  iv?:              number;   // options only
  index?:           number;
  start_price?:     number;
  average_price?:   number;
  unrealised_pnl?:  number;
  realised_pnl?:    number;
  entry_value?:     number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Instrument name parsing
// Thalex format: BTC-16DEC23-46000-C  (option)
//                BTC-PERPETUAL        (perpetual)
//                BTC-16DEC23          (future / no strike, no C/P suffix)
// ---------------------------------------------------------------------------

export type ThalexInstrumentType = 'option' | 'future' | 'perpetual' | 'combination' | 'unknown';

const OPTION_RE = /^[A-Z]+-\d{1,2}[A-Z]{3}\d{2}-\d+-[CP]$/;
const FUTURE_RE = /^[A-Z]+-\d{1,2}[A-Z]{3}\d{2}$/;
const PERPETUAL_RE = /^[A-Z]+-PERPETUAL$/;
const COMBO_RE = /-COMBO$/;

export function parseThalexInstrumentType(instrumentName: string): ThalexInstrumentType {
  if (!instrumentName) return 'unknown';
  if (PERPETUAL_RE.test(instrumentName)) return 'perpetual';
  if (OPTION_RE.test(instrumentName))    return 'option';
  if (FUTURE_RE.test(instrumentName))    return 'future';
  if (COMBO_RE.test(instrumentName))     return 'combination';
  return 'unknown';
}

/**
 * Convert a Thalex instrument name + direction + position_after into a
 * JournalyAl-hadi TradeDetails.type string.
 *
 * Options rules:
 *   - instrument ends with -C → Call
 *   - instrument ends with -P → Put
 *   - direction buy  + call  → BTO Call
 *   - direction sell + call  → STO Call  (open) or STC Call (close, position_after < prev)
 *   - direction buy  + put   → BTO Put
 *   - direction sell + put   → STO Put  (open) or STC Put  (close)
 *
 * For futures / perpetuals we keep the existing logic (Long Future / Short Future).
 */
export function resolveThalexTradeType(
  instrumentName: string,
  direction: 'buy' | 'sell',
  positionAfter: number,
  positionBefore: number,
): 'Long Future' | 'Short Future' | 'BTO Call' | 'BTO Put' | 'STO Call' | 'STO Put' | 'STC Call' | 'STC Put' | 'BTC Call' | 'BTC Put' {
  const type = parseThalexInstrumentType(instrumentName);

  if (type === 'option') {
    const isCall = instrumentName.toUpperCase().endsWith('-C');
    const optionLetter = isCall ? 'Call' : 'Put';

    // If buying and resulting position is more positive (or less negative) → BTO
    if (direction === 'buy') {
      // Buying to open → BTO; buying to close a short → BTC
      return positionBefore < 0 ? `BTC ${optionLetter}` as 'BTC Call' | 'BTC Put'
                                 : `BTO ${optionLetter}` as 'BTO Call' | 'BTO Put';
    } else {
      // Selling to open → STO; selling to close a long → STC
      return positionBefore > 0 ? `STC ${optionLetter}` as 'STC Call' | 'STC Put'
                                 : `STO ${optionLetter}` as 'STO Call' | 'STO Put';
    }
  }

  // Futures / perpetuals
  return direction === 'buy' ? 'Long Future' : 'Short Future';
}
