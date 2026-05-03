import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import * as auth from '../services/auth';
import { isUsingSupabase as isSupabaseConfigured } from '../services/dataService';

const SESSION_KEY = 'dj-supabase-session';

function getStoredSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.expires_at && Date.now() > parsed.expires_at * 1000) {
        return null;
      }
      return parsed as Session;
    }
  } catch {}
  return null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(() => getStoredSession());

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    auth.getSession().then(({ data: { session } }) => {
      if (session) setSession(session);
    });

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  };

  return { session, loading: false, signOut, isSupabaseConfigured };
}