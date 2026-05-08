import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  corsPreflightResponse,
  decryptSecret,
  getAuthedContext,
  jsonResponse,
} from '../_shared/integration-runtime.ts';
import {
  parseThalexInstrumentType,
  resolveThalexTradeType,
  thalexGet,
  type ThalexPortfolioEntry,
  type ThalexTradeHistoryResult,
  type ThalexTradeResponse,
} from '../_shared/thalex.ts';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tradeSide(direction: 'buy' | 'sell'): 'Buy' | 'Sell' {
  return direction === 'buy' ? 'Buy' : 'Sell';
}

function tradeDay(unixTs: number, timezone: string): string {
  const date = new Date(unixTs * 1000);
  // Compute the local date string in the requested timezone
  return date.toLocaleDateString('en-CA', { timeZone: timezone }); // YYYY-MM-DD
}

function makeTradeFingerprint(
  userId: string,
  environment: string,
  tradeId: string,
): string {
  return `thalex|${userId}|${environment}|${tradeId}`;
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

/**
 * thalex-sync-trades
 *
 * Body: {
 *   date:     string; // YYYY-MM-DD — the local trading day to sync
 *   timezone: string; // IANA timezone string
 * }
 *
 * Pulls trade history for the requested day from Thalex and upserts into
 * thalex_trade_cache. Also refreshes the live portfolio (positions).
 *
 * Returns: { trades: ThalexCachedRow[], positions: ThalexPositionRow[], refreshedAt: string }
 */
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsPreflightResponse();

  try {
    const { userId, supabase } = await getAuthedContext(req);

    const body = await req.json() as { date?: string; timezone?: string };
    const { date, timezone = 'UTC' } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return jsonResponse(400, { error: 'date is required and must be YYYY-MM-DD.' });
    }

    // ------------------------------------------------------------------
    // 1. Load connection + decrypt private key
    // ------------------------------------------------------------------
    const { data: conn, error: connErr } = await supabase
      .from('thalex_connections')
      .select('environment, key_name, private_key_ciphertext, private_key_iv, validation_status')
      .eq('user_id', userId)
      .maybeSingle();

    if (connErr) throw new Error(connErr.message);
    if (!conn) return jsonResponse(400, { error: 'No Thalex connection found. Please add your credentials in Settings.' });
    if (conn.validation_status !== 'valid') {
      return jsonResponse(400, { error: 'Thalex connection is not valid. Please re-validate your credentials.' });
    }

    const privateKeyPem = await decryptSecret(conn.private_key_ciphertext, conn.private_key_iv);
    const opts = {
      keyName: conn.key_name as string,
      privateKeyPem,
      environment: conn.environment as 'mainnet' | 'testnet',
    };

    // Update sync status
    await supabase
      .from('thalex_connections')
      .update({ sync_status: 'syncing', sync_error: null })
      .eq('user_id', userId);

    // ------------------------------------------------------------------
    // 2. Determine time window for the requested local day
    // ------------------------------------------------------------------
    // Convert the YYYY-MM-DD local date to a UTC time window
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay   = new Date(`${date}T23:59:59.999`);

    // Apply timezone offset: parse date as midnight in the target tz
    const tzStartMs = new Date(
      new Date(startOfDay).toLocaleString('en-US', { timeZone: timezone }),
    ).getTime();
    const tzEndMs = new Date(
      new Date(endOfDay).toLocaleString('en-US', { timeZone: timezone }),
    ).getTime();

    const timeLow  = tzStartMs / 1000;
    const timeHigh = tzEndMs   / 1000;

    // ------------------------------------------------------------------
    // 3. Fetch all trades for this day (paginated)
    // ------------------------------------------------------------------
    const allTrades: ThalexTradeResponse[] = [];
    let bookmark: string | null = undefined;

    do {
      const result = await thalexGet<ThalexTradeHistoryResult>(
        '/private/trade_history',
        {
          time_low:  timeLow,
          time_high: timeHigh,
          sort:      'ascending',
          limit:     1000,
          bookmark:  bookmark ?? undefined,
        },
        opts,
      );

      allTrades.push(...result.trades);
      bookmark = result.bookmark;
    } while (bookmark);

    // ------------------------------------------------------------------
    // 4. Build position-before map so we can classify BTO/STO/STC/BTC
    //    We track position as we iterate ascending trades.
    // ------------------------------------------------------------------
    const positionBefore: Record<string, number> = {};

    const tradeRows = allTrades.map((t) => {
      const instrumentType = parseThalexInstrumentType(t.instrument_name);
      const prevPos = positionBefore[t.instrument_name] ?? 0;
      const side = tradeSide(t.direction);
      const tradeType = resolveThalexTradeType(
        t.instrument_name,
        t.direction,
        t.position_after,
        prevPos,
      );

      // Advance tracker
      positionBefore[t.instrument_name] = t.position_after;

      const tradeDayStr = tradeDay(t.time, timezone);
      const fingerprint = makeTradeFingerprint(userId, conn.environment, t.trade_id);

      return {
        user_id:           userId,
        environment:       conn.environment,
        trade_day:         tradeDayStr,
        external_trade_id: t.trade_id,
        order_id:          t.order_id,
        instrument_name:   t.instrument_name,
        instrument_type:   instrumentType,
        side,
        executed_at:       new Date(t.time * 1000).toISOString(),
        quantity:          t.amount,
        price:             t.price,
        fee:               t.fee ?? null,
        fee_currency:      'USDC',
        closed_pnl:        t.position_pnl ?? null,
        trade_fingerprint: fingerprint,
        raw_trade:         t,
      };
    });

    // ------------------------------------------------------------------
    // 5. Upsert trades
    // ------------------------------------------------------------------
    if (tradeRows.length > 0) {
      const { error: upsertErr } = await supabase
        .from('thalex_trade_cache')
        .upsert(tradeRows, { onConflict: 'user_id,environment,external_trade_id' });

      if (upsertErr) throw new Error(`Trade upsert failed: ${upsertErr.message}`);
    }

    // ------------------------------------------------------------------
    // 6. Refresh live positions (portfolio snapshot)
    // ------------------------------------------------------------------
    const portfolio = await thalexGet<ThalexPortfolioEntry[]>('/private/portfolio', {}, opts);

    const positionRows = portfolio.map((p) => {
      const instrumentType = parseThalexInstrumentType(p.instrument_name);
      const side: 'Buy' | 'Sell' | 'Unknown' = p.position > 0 ? 'Buy' : p.position < 0 ? 'Sell' : 'Unknown';

      return {
        user_id:              userId,
        environment:          conn.environment,
        instrument_name:      p.instrument_name,
        instrument_type:      instrumentType,
        position:             p.position,
        side,
        position_status:      'open' as const,
        mark_price:           p.mark_price ?? null,
        start_price:          p.start_price ?? null,
        average_price:        p.average_price ?? null,
        unrealised_pnl:       p.unrealised_pnl ?? null,
        realised_pnl:         p.realised_pnl ?? null,
        entry_value:          p.entry_value ?? null,
        iv:                   p.iv ?? null,
        index_price:          p.index ?? null,
        external_position_id: p.instrument_name, // unique key per user/env
        updated_at:           new Date().toISOString(),
        raw_position:         p,
      };
    });

    // Replace all positions for this user/env
    await supabase
      .from('thalex_position_cache')
      .delete()
      .eq('user_id', userId)
      .eq('environment', conn.environment);

    if (positionRows.length > 0) {
      const { error: posErr } = await supabase
        .from('thalex_position_cache')
        .insert(positionRows);
      if (posErr) throw new Error(`Position insert failed: ${posErr.message}`);
    }

    // ------------------------------------------------------------------
    // 7. Read back the freshly cached rows for the requested day
    // ------------------------------------------------------------------
    const { data: cachedTrades } = await supabase
      .from('thalex_trade_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', conn.environment)
      .eq('trade_day', date)
      .order('executed_at', { ascending: true });

    const { data: cachedPositions } = await supabase
      .from('thalex_position_cache')
      .select('*')
      .eq('user_id', userId)
      .eq('environment', conn.environment);

    // ------------------------------------------------------------------
    // 8. Mark sync complete
    // ------------------------------------------------------------------
    const refreshedAt = new Date().toISOString();
    await supabase
      .from('thalex_connections')
      .update({ sync_status: 'ready', last_sync_at: refreshedAt, sync_error: null })
      .eq('user_id', userId);

    return jsonResponse(200, {
      trades:      cachedTrades ?? [],
      positions:   cachedPositions ?? [],
      refreshedAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[thalex-sync-trades]', message);

    // Try to mark the connection as errored
    try {
      const { userId, supabase } = await getAuthedContext(req.clone());
      await supabase
        .from('thalex_connections')
        .update({ sync_status: 'error', sync_error: message })
        .eq('user_id', userId);
    } catch {
      // best effort
    }

    return jsonResponse(400, { error: message });
  }
});
