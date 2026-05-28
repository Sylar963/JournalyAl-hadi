import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  buildMemoryChatReply,
  buildEmotionInsight,
  buildReportAnalysis,
  buildRiskPrediction,
  buildTraderProfile,
  buildTrendsSummary,
} from '../_shared/journal-ai.ts';
import { corsPreflightResponse, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';
import { assertRateLimit } from '../_shared/request-limits.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const { userId, supabase } = await getAuthedContext(req);
    await assertRateLimit(supabase, {
      action: 'journal-ai',
      actor: userId,
      maxAttempts: 30,
      windowSeconds: 60 * 60,
      minIntervalSeconds: 2,
    });

    const body = await req.json() as Record<string, unknown>;
    const action = typeof body.action === 'string' ? body.action : '';

    switch (action) {
      case 'emotion-insight':
        return jsonResponse(200, { insight: await buildEmotionInsight(body.entry) });
      case 'trends-summary':
        return jsonResponse(200, { summary: await buildTrendsSummary(body.entries) });
      case 'report-analysis':
        return jsonResponse(200, {
          report: await buildReportAnalysis(body.entries, body.startDate, body.endDate),
        });
      case 'learn-trader-signature':
        return jsonResponse(200, { profile: await buildTraderProfile(body.entries) });
      case 'predict-session-risk':
        return jsonResponse(200, {
          prediction: await buildRiskPrediction(body.profile, body.currentState),
        });
      case 'chat-memory':
        return jsonResponse(200, {
          response: await buildMemoryChatReply(body.memoryNotes, body.message, body.entries, body.language),
        });
      default:
        return jsonResponse(400, { error: 'Unsupported AI action.' });
    }
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Unable to complete the AI request.',
    });
  }
});
