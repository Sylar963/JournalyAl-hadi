import { createClient } from 'npm:@supabase/supabase-js@2';

type Json = Record<string, unknown>;

export interface AuthedContext {
  userId: string;
  supabase: ReturnType<typeof createClient>;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-region',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  ...CORS_HEADERS,
};

export function corsPreflightResponse() {
  return new Response('ok', { headers: CORS_HEADERS });
}

export function jsonResponse(status: number, body: Json) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

export function getEnv(name: string): string {
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
