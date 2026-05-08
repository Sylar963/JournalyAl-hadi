import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsPreflightResponse, encryptSecret, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';
import { createThalexJwt, thalexGet } from '../_shared/thalex.ts';

/**
 * thalex-upsert-credentials
 *
 * Validates credentials, then encrypts and stores them in thalex_connections.
 *
 * Body: { keyName: string, privateKeyPem: string, environment: "mainnet" | "testnet" }
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const { userId, supabase } = await getAuthedContext(req);

    const body = await req.json() as {
      keyName: string;
      privateKeyPem: string;
      environment?: 'mainnet' | 'testnet';
    };

    const { keyName, privateKeyPem, environment = 'mainnet' } = body;

    if (!keyName || !privateKeyPem) {
      return jsonResponse(400, { error: 'keyName and privateKeyPem are required.' });
    }

    // Validate credentials first
    await thalexGet('/private/portfolio', {}, { keyName, privateKeyPem, environment });

    // Encrypt private key using the shared encryption key
    const { secretCiphertext, secretIv, secretVersion } = await encryptSecret(privateKeyPem);

    // Mask the key name (first 4 + *** + last 3)
    const keyNameMasked = keyName.length > 7
      ? `${keyName.slice(0, 4)}***${keyName.slice(-3)}`
      : `${keyName.slice(0, 2)}***`;
    const keyNameLast4 = keyName.slice(-4);

    const { error } = await supabase.from('thalex_connections').upsert({
      user_id:               userId,
      environment,
      key_name:              keyName,
      key_name_masked:       keyNameMasked,
      key_name_last4:        keyNameLast4,
      private_key_ciphertext: secretCiphertext,
      private_key_iv:        secretIv,
      private_key_version:   secretVersion,
      validation_status:     'valid',
      last_validated_at:     new Date().toISOString(),
      sync_status:           'idle',
    }, { onConflict: 'user_id' });

    if (error) throw new Error(error.message);

    return jsonResponse(200, {
      provider:          'thalex',
      environment,
      keyNameMasked,
      keyNameLast4,
      validationStatus:  'valid',
      lastValidatedAt:   new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[thalex-upsert-credentials]', message);
    return jsonResponse(400, { error: message });
  }
});
