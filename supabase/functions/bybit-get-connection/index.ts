import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsPreflightResponse, getAuthedContext, jsonResponse } from '../_shared/bybit.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const { userId, supabase } = await getAuthedContext(req);
    const { data, error } = await supabase
      .from('bybit_connections')
      .select('environment, api_key_masked, api_key_last4, validation_status, permission_snapshot, last_validated_at, last_sync_at, sync_status, sync_error')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return jsonResponse(200, { connection: null });
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
      error: error instanceof Error ? error.message : 'Unable to fetch Bybit connection.',
    });
  }
});
