import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { validateBybitCredentials } from '../_shared/bybit.ts';
import { corsPreflightResponse, getAuthedContext, jsonResponse } from '../_shared/integration-runtime.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return corsPreflightResponse();
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  try {
    await getAuthedContext(req);
    const { environment, apiKey, apiSecret } = await req.json();

    if (!environment || !apiKey || !apiSecret) {
      return jsonResponse(400, { error: 'environment, apiKey, and apiSecret are required.' });
    }

    const validation = await validateBybitCredentials(environment, apiKey, apiSecret);
    return jsonResponse(200, {
      connection: {
        provider: 'bybit',
        environment,
        apiKeyMasked: validation.apiKeyMasked,
        apiKeyLast4: validation.apiKeyLast4,
        validationStatus: validation.validationStatus,
        permissionSnapshot: validation.permissionSnapshot,
      },
    });
  } catch (error) {
    return jsonResponse(400, {
      error: error instanceof Error ? error.message : 'Unable to validate Bybit credentials.',
    });
  }
});
