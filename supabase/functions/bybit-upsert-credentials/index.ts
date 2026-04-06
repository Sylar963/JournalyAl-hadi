import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { mapBybitConnectionRow, validateBybitCredentials } from '../_shared/bybit.ts';
import { corsPreflightResponse, encryptSecret, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const { userId, supabase } = await getAuthedContext(req);
    const { environment, apiKey, apiSecret } = await req.json();

    if (!environment || !apiKey || !apiSecret) {
      return jsonResponse(400, { error: 'environment, apiKey, and apiSecret are required.' });
    }

    const validation = await validateBybitCredentials(environment, apiKey, apiSecret);

    if (validation.validationStatus !== 'valid') {
      return jsonResponse(400, {
        error: validation.validationStatus === 'permission_denied'
          ? 'The API key is valid but missing derivatives permissions required for linear trade import.'
          : 'Bybit credential validation failed.',
        connection: {
          environment,
          apiKeyMasked: validation.apiKeyMasked,
          apiKeyLast4: validation.apiKeyLast4,
          validationStatus: validation.validationStatus,
          permissionSnapshot: validation.permissionSnapshot,
        },
      });
    }

    const encryptedSecret = await encryptSecret(apiSecret);
    const encryptedApiKey = await encryptSecret(apiKey);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('bybit_connections')
      .upsert({
        user_id: userId,
        environment,
        api_key_ciphertext: encryptedApiKey.secretCiphertext,
        api_key_iv: encryptedApiKey.secretIv,
        api_key_masked: validation.apiKeyMasked,
        api_key_last4: validation.apiKeyLast4,
        secret_ciphertext: encryptedSecret.secretCiphertext,
        secret_iv: encryptedSecret.secretIv,
        secret_version: encryptedSecret.secretVersion,
        validation_status: validation.validationStatus,
        permission_snapshot: validation.permissionSnapshot,
        last_validated_at: now,
        sync_status: 'idle',
        sync_error: null,
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return jsonResponse(200, {
      connection: mapBybitConnectionRow(data),
    });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Unable to save Bybit credentials.',
    });
  }
});
