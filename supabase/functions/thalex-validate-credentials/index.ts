import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsPreflightResponse, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';
import { thalexGet } from '../_shared/thalex.ts';
import { assertRateLimit } from '../_shared/request-limits.ts';

/**
 * thalex-validate-credentials
 *
 * Body: { keyName: string, privateKeyPem: string, environment: "mainnet" | "testnet" }
 *
 * - Builds a JWT and calls /private/portfolio (smallest authenticated endpoint).
 * - Returns { valid: true } or throws with a human-readable error.
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const { userId, supabase } = await getAuthedContext(req);
    await assertRateLimit(supabase, {
      action: 'thalex-validate-credentials',
      actor: userId,
      maxAttempts: 10,
      windowSeconds: 15 * 60,
      minIntervalSeconds: 5,
    });

    const body = await req.json() as {
      keyName: string;
      privateKeyPem: string;
      environment?: 'mainnet' | 'testnet';
    };

    const { keyName, privateKeyPem, environment = 'mainnet' } = body;

    if (!keyName || !privateKeyPem) {
      return jsonResponse(400, { error: 'keyName and privateKeyPem are required.' });
    }

    // Attempt a lightweight authenticated call
    await thalexGet('/private/portfolio', {}, { keyName, privateKeyPem, environment });

    return jsonResponse(200, {
      valid: true,
      userId,
      environment,
      keyName,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[thalex-validate-credentials]', message);
    return jsonResponse(400, { error: message });
  }
});
