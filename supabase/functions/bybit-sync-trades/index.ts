import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsPreflightResponse, decryptSecret, fetchAggregatedTradesForDay, getAuthedContext, getUtcBoundsForDateInTimeZone, jsonResponse } from '../_shared/bybit.ts';

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
    const trades = await fetchAggregatedTradesForDay({
      userId,
      environment: connectionRow.environment,
      apiKey,
      apiSecret,
      tradeDay: date,
      startTime,
      endTime,
      symbol: normalizedSymbol,
    });

    const now = new Date().toISOString();

    if (previewOnly === true) {
      return jsonResponse(200, {
        connection: {
          environment: connectionRow.environment,
          apiKeyMasked: connectionRow.api_key_masked,
          apiKeyLast4: connectionRow.api_key_last4,
          validationStatus: connectionRow.validation_status,
          permissionSnapshot: connectionRow.permission_snapshot,
          lastValidatedAt: connectionRow.last_validated_at,
          lastSyncAt: connectionRow.last_sync_at,
          syncStatus: connectionRow.sync_status,
          syncError: connectionRow.sync_error,
        },
        trades: trades.map((trade) => ({
          id: trade.external_trade_id,
          environment: trade.environment,
          tradeDay: trade.trade_day,
          externalTradeId: trade.external_trade_id,
          orderId: trade.order_id,
          symbol: trade.symbol,
          side: trade.side,
          executedAt: trade.executed_at,
          quantity: trade.exec_qty,
          price: trade.exec_price,
          fee: trade.exec_fee ?? undefined,
          feeCurrency: trade.fee_currency ?? undefined,
          closedPnl: trade.closed_pnl ?? undefined,
          type: trade.side === 'Sell' ? 'Short Future' : 'Long Future',
          tradeFingerprint: trade.trade_fingerprint,
          rawExecution: trade.raw_execution,
          rawClosedPnl: trade.raw_closed_pnl,
        })),
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

    if (trades.length > 0) {
      const { error: upsertError } = await supabase
        .from('bybit_trade_cache')
        .insert(trades);

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
      connection: {
        environment: updatedConnection.environment,
        apiKeyMasked: updatedConnection.api_key_masked,
        apiKeyLast4: updatedConnection.api_key_last4,
        validationStatus: updatedConnection.validation_status,
        permissionSnapshot: updatedConnection.permission_snapshot,
        lastValidatedAt: updatedConnection.last_validated_at,
        lastSyncAt: updatedConnection.last_sync_at,
        syncStatus: updatedConnection.sync_status,
        syncError: updatedConnection.sync_error,
      },
      trades: trades.map((trade) => ({
        id: trade.external_trade_id,
        environment: trade.environment,
        tradeDay: trade.trade_day,
        externalTradeId: trade.external_trade_id,
        orderId: trade.order_id,
        symbol: trade.symbol,
        side: trade.side,
        executedAt: trade.executed_at,
        quantity: trade.exec_qty,
        price: trade.exec_price,
        fee: trade.exec_fee ?? undefined,
        feeCurrency: trade.fee_currency ?? undefined,
        closedPnl: trade.closed_pnl ?? undefined,
        type: trade.side === 'Sell' ? 'Short Future' : 'Long Future',
        tradeFingerprint: trade.trade_fingerprint,
        rawExecution: trade.raw_execution,
        rawClosedPnl: trade.raw_closed_pnl,
      })),
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
