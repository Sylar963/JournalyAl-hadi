import { invokeAppFunction, isSupabaseConfigured, supabase } from './supabaseService';

export type JournalAiAction =
  | 'emotion-insight'
  | 'trends-summary'
  | 'report-analysis'
  | 'learn-trader-signature'
  | 'predict-session-risk'
  | 'chat-memory';

export function isJournalAiEnabled(): boolean {
  return isSupabaseConfigured;
}

export async function invokeJournalAi<T>(action: JournalAiAction, payload: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('AI features require Supabase-backed mode. Configure Supabase to use them securely.');
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session) {
    throw new Error('Sign in to use AI features.');
  }

  return invokeAppFunction<T>('journal-ai', {
    action,
    ...payload,
  });
}
