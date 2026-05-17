import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  fetchActivePositions,
  fetchAggregatedTradesForDay,
  getUtcBoundsForDateInTimeZone,
  mapBybitConnectionRow,
  mapBybitPositionRow,
  mapBybitTradeRow,
} from '../_shared/bybit.ts';
import { corsPreflightResponse, decryptSecret, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';
import { assertRateLimit } from '../_shared/request-limits.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  let authContext: Awaited<ReturnType<typeof getAuthedContext>> | null = null;
  let shouldPersistSyncState = false;

  try {
    authContext = await getAuthedContext(req);
    const { userId, supabase } = authContext;
    await assertRateLimit(supabase, {
      action: 'bybit-sync-trades',
      actor: userId,
      maxAttempts: 120,
      windowSeconds: 60 * 60,
    });
    const { date, timezone, symbol, previewOnly } = await req.json();

    if (!date || !timezone) {
      return jsonResponse(400, { error: 'date and timezone are required.' });
    }

    const normalizedSymbol = typeof symbol === 'string' && symbol.trim()
      ? symbol.trim().toUpperCase()
      : undefined;

    shouldPersistSyncState = previewOnly !== true;

    const { startTime, endTime } = getUtcBoundsForDateInTimeZone(date, timezone);

    const { data: connectionRow, error: connectionError } = await supabase
      .from('bybit_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (connectionError || !connectionRow) {
      return jsonResponse(404, { error: 'No Bybit connection found for this user.' });
    }

    if (shouldPersistSyncState) {
      await supabase
        .from('bybit_connections')
        .update({ sync_status: 'syncing', sync_error: null })
        .eq('user_id', userId);
    }

    const apiKey = await decryptSecret(connectionRow.api_key_ciphertext, connectionRow.api_key_iv);
    const apiSecret = await decryptSecret(connectionRow.secret_ciphertext, connectionRow.secret_iv);
    const [trades, positions] = await Promise.all([
      fetchAggregatedTradesForDay({
        userId,
        environment: connectionRow.environment,
        apiKey,
        apiSecret,
        tradeDay: date,
        startTime,
        endTime,
        symbol: normalizedSymbol,
      }),
      fetchActivePositions({
        userId,
        environment: connectionRow.environment,
        apiKey,
        apiSecret,
        symbol: normalizedSymbol,
      }),
    ]);

    const now = new Date().toISOString();

    if (previewOnly === true) {
      return jsonResponse(200, {
        connection: mapBybitConnectionRow(connectionRow),
        trades: trades.map(mapBybitTradeRow),
        positions: positions.map(mapBybitPositionRow),
        refreshedAt: now,
        syncError: null,
        previewOnly: true,
        requestedSymbol: normalizedSymbol ?? null,
      });
    }

    await supabase.from('bybit_trade_cache').delete()
      .eq('user_id', userId)
      .eq('trade_day', date)
      .eq('environment', connectionRow.environment);

    await supabase.from('bybit_position_cache').delete()
      .eq('user_id', userId)
      .eq('environment', connectionRow.environment);

    if (trades.length > 0) {
      const { error: upsertError } = await supabase
        .from('bybit_trade_cache')
        .insert(trades);

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    if (positions.length > 0) {
      const { error: upsertError } = await supabase
        .from('bybit_position_cache')
        .insert(positions);

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    const { data: updatedConnection, error: updateError } = await supabase
      .from('bybit_connections')
      .update({
        last_sync_at: now,
        sync_status: 'ready',
        sync_error: null,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return jsonResponse(200, {
      connection: mapBybitConnectionRow(updatedConnection),
      trades: trades.map(mapBybitTradeRow),
      positions: positions.map(mapBybitPositionRow),
      refreshedAt: now,
      syncError: null,
    });
  } catch (error) {
    try {
      if (shouldPersistSyncState && authContext) {
        const { userId, supabase } = authContext;
        await supabase
          .from('bybit_connections')
          .update({
            sync_status: 'error',
            sync_error: error instanceof Error ? error.message : 'Trade sync failed.',
          })
          .eq('user_id', userId);
      }
    } catch {
      // Best effort sync error persistence.
    }

    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Unable to sync Bybit trades.',
    });
  }
});
