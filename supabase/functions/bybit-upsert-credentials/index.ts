import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { encryptSecret, getAuthedContext, jsonResponse, validateBybitCredentials } from '../_shared/bybit.ts';

serve(async (req) => {
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
      connection: {
        environment: data.environment,
        apiKeyMasked: data.api_key_masked,
        apiKeyLast4: data.api_key_last4,
        validationStatus: data.validation_status,
        permissionSnapshot: data.permission_snapshot,
        lastValidatedAt: data.last_validated_at,
        lastSyncAt: data.last_sync_at,
        syncStatus: data.sync_status,
        syncError: data.sync_error,
      },
    });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Unable to save Bybit credentials.',
    });
  }
});
