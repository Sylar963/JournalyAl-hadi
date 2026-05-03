import { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import * as auth from '../services/auth';
import { isUsingSupabase as isSupabaseConfigured } from '../services/dataService';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      initialLoadDone.current = true;
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

  return { session, loading, signOut, isSupabaseConfigured };
}
