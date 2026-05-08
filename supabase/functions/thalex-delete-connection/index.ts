import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsPreflightResponse, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';

/**
 * thalex-delete-connection
 *
 * Removes the Thalex connection row (and cascade-deletes trade/position cache via FK).
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const { userId, supabase } = await getAuthedContext(req);

    // Delete all cached data first (no FK cascade on cache tables to avoid accidental wipes)
    await supabase.from('thalex_trade_cache').delete().eq('user_id', userId);
    await supabase.from('thalex_position_cache').delete().eq('user_id', userId);

    const { error } = await supabase
      .from('thalex_connections')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);

    return jsonResponse(200, { deleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[thalex-delete-connection]', message);
    return jsonResponse(400, { error: message });
  }
});
