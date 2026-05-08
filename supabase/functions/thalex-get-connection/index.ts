import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsPreflightResponse, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';

/**
 * thalex-get-connection
 *
 * Returns the current Thalex connection status for the user (masked — no secrets).
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const { userId, supabase } = await getAuthedContext(req);

    const { data, error } = await supabase
      .from('thalex_connections')
      .select(
        'environment, key_name, key_name_masked, key_name_last4, validation_status, last_validated_at, last_sync_at, sync_status, sync_error',
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return jsonResponse(200, { connection: null });

    return jsonResponse(200, {
      connection: {
        provider:           'thalex',
        environment:        data.environment,
        keyName:            data.key_name,
        keyNameMasked:      data.key_name_masked,
        keyNameLast4:       data.key_name_last4,
        // Satisfy TradingConnection interface
        apiKeyMasked:       data.key_name_masked,
        apiKeyLast4:        data.key_name_last4,
        validationStatus:   data.validation_status,
        permissionSnapshot: null,
        lastValidatedAt:    data.last_validated_at,
        lastSyncAt:         data.last_sync_at,
        syncStatus:         data.sync_status ?? 'idle',
        syncError:          data.sync_error ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[thalex-get-connection]', message);
    return jsonResponse(400, { error: message });
  }
});
