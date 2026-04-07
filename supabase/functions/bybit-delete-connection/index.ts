import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsPreflightResponse, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const { userId, supabase } = await getAuthedContext(req);

    const { error: cacheError } = await supabase
      .from('bybit_trade_cache')
      .delete()
      .eq('user_id', userId);

    if (cacheError) {
      throw new Error(cacheError.message);
    }

    const { error: connectionError } = await supabase
      .from('bybit_connections')
      .delete()
      .eq('user_id', userId);

    if (connectionError) {
      throw new Error(connectionError.message);
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Unable to delete Bybit connection.',
    });
  }
});
