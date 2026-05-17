type SupabaseClientLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{ data: RequestLimitRow | null; error: { message: string } | null }>;
        };
      };
    };
    upsert: (value: RequestLimitRow) => Promise<{ error: { message: string } | null }>;
  };
};

interface RequestLimitRow {
  action: string;
  actor: string;
  window_started_at: string;
  attempt_count: number;
  last_attempt_at: string;
}

interface RequestLimitOptions {
  action: string;
  actor: string;
  maxAttempts: number;
  windowSeconds: number;
  minIntervalSeconds?: number;
}

function clampKeyPart(value: string): string {
  return value.trim().toLowerCase().slice(0, 200);
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.headers.get('cf-connecting-ip')
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
}

export async function assertRateLimit(
  supabase: SupabaseClientLike,
  options: RequestLimitOptions,
): Promise<void> {
  const action = clampKeyPart(options.action);
  const actor = clampKeyPart(options.actor);
  const now = new Date();
  const windowMs = options.windowSeconds * 1000;
  const minIntervalMs = (options.minIntervalSeconds ?? 0) * 1000;

  const { data, error } = await supabase
    .from('request_limits')
    .select('action, actor, window_started_at, attempt_count, last_attempt_at')
    .eq('action', action)
    .eq('actor', actor)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  let windowStartedAt = now;
  let attemptCount = 1;

  if (data) {
    const lastAttemptAt = new Date(data.last_attempt_at);
    const elapsedSinceLastAttempt = now.getTime() - lastAttemptAt.getTime();
    if (minIntervalMs > 0 && elapsedSinceLastAttempt < minIntervalMs) {
      const retryAfter = Math.ceil((minIntervalMs - elapsedSinceLastAttempt) / 1000);
      throw new Error(`Too many requests. Try again in ${retryAfter}s.`);
    }

    const previousWindowStart = new Date(data.window_started_at);
    const windowAge = now.getTime() - previousWindowStart.getTime();
    const isSameWindow = windowAge < windowMs;

    if (isSameWindow) {
      if (data.attempt_count >= options.maxAttempts) {
        const retryAfter = Math.ceil((windowMs - windowAge) / 1000);
        throw new Error(`Rate limit exceeded. Try again in ${retryAfter}s.`);
      }

      windowStartedAt = previousWindowStart;
      attemptCount = data.attempt_count + 1;
    }
  }

  const { error: upsertError } = await supabase.from('request_limits').upsert({
    action,
    actor,
    window_started_at: windowStartedAt.toISOString(),
    attempt_count: attemptCount,
    last_attempt_at: now.toISOString(),
  });

  if (upsertError) {
    throw new Error(upsertError.message);
  }
}
