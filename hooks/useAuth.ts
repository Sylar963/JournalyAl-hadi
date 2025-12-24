import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import * as auth from '../services/auth';
import { isUsingSupabase as isSupabaseConfigured } from '../services/dataService';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false); 
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
