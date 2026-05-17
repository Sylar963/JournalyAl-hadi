import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { corsPreflightResponse, getServiceRoleClient, jsonResponse } from '../_shared/integration-runtime.ts';
import { assertRateLimit, getClientIp } from '../_shared/request-limits.ts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    const supabase = getServiceRoleClient();
    const body = await req.json() as Record<string, unknown>;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const website = typeof body.website === 'string' ? body.website.trim() : '';

    if (website) {
      return jsonResponse(200, { ok: true });
    }

    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return jsonResponse(400, { error: 'A valid email address is required.' });
    }

    const clientIp = getClientIp(req);
    await assertRateLimit(supabase, {
      action: 'capture-lead:ip',
      actor: clientIp,
      maxAttempts: 5,
      windowSeconds: 60 * 60,
      minIntervalSeconds: 10,
    });

    const { data: existingLead, error: selectError } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (selectError) {
      throw new Error(selectError.message);
    }

    if (existingLead) {
      return jsonResponse(200, { ok: true });
    }

    await assertRateLimit(supabase, {
      action: 'capture-lead:email',
      actor: email,
      maxAttempts: 1,
      windowSeconds: 24 * 60 * 60,
    });

    const { error: insertError } = await supabase.from('leads').insert({ email });
    if (insertError) {
      throw new Error(insertError.message);
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Unable to capture the lead.',
    });
  }
});
