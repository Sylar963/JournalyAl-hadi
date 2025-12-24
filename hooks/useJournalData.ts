import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import * as db from '../services/dataService';
import { PROFILES_TABLE_SETUP_SQL, ENTRIES_TABLE_SETUP_SQL, QUESTS_TABLE_SETUP_SQL } from '../services/supabaseService';
import SchemaError from '../components/SchemaError';
import { getErrorMessage } from '../utils/errorHelpers';
import { EmotionEntry, UserProfile, Quest, EmotionType } from '../types';

export function useJournalData(session: Session | null, isSupabaseConfigured: boolean) {
  const [entries, setEntries] = useState<Record<string, EmotionEntry>>({});
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Loading...',
    alias: '...',
    picture: undefined,
    journalPurpose: 'Loading purpose...'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<React.ReactNode | null>(null);

  // Initial Data Load
  useEffect(() => {
    if (isSupabaseConfigured && !session) {
      setEntries({});
      setQuests([]);
      setUserProfile({ name: 'Loading...', alias: '...', picture: undefined });
      setLoading(false);
      return;
    };

    let isMounted = true;

    async function loadInitialData() {
      setLoading(true);
      setError(null);
      console.log("[useJournalData] Starting initial data load...");
      try {
        console.log("[useJournalData] Fetching entries...");
        const fetchedEntries = await db.getEntries();
        console.log("[useJournalData] Entries fetched:", Object.keys(fetchedEntries).length);

        console.log("[useJournalData] Fetching profile...");
        const fetchedProfile = await db.getProfile();
        console.log("[useJournalData] Profile fetched:", fetchedProfile);

        console.log("[useJournalData] Fetching quests...");
        const fetchedQuests = await db.getQuests();
        console.log("[useJournalData] Quests fetched:", fetchedQuests.length);
        
        if (isMounted) {
          setEntries(fetchedEntries);
          setUserProfile(fetchedProfile);
          setQuests(fetchedQuests);
          console.log("[useJournalData] State updated.");
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const message = getErrorMessage(err); // Extract message safely used below
        const originalMessage = message; // Keep original for checks

        console.error("Failed to load data:", message);

        let errorComponent: React.ReactNode = (
          React.createElement('div', { className: "bg-gray-900 border border-red-500/30 rounded-lg p-6 text-center" },
            React.createElement('h2', { className: "text-xl font-bold text-red-400" }, "Failed to Load Data"),
            React.createElement('p', { className: "mt-2 text-gray-300" }, "An unexpected error occurred while loading your data from Supabase."),
            React.createElement('p', { className: "mt-4 text-sm bg-black/20 p-2 rounded font-mono text-red-300" }, message)
          )
        );

        if (originalMessage) {
          const msg = originalMessage.toLowerCase();
          if (msg.includes('relation "public.profiles" does not exist')) {
            errorComponent = React.createElement(SchemaError, {
              title: "Database Setup Incomplete: 'profiles' table missing",
              message: React.createElement('p', null, "The application requires a ", React.createElement('code', null, "profiles"), " table. Run SQL setup."),
              sql: PROFILES_TABLE_SETUP_SQL
            });
          } else if (msg.includes('relation "public.entries" does not exist')) {
            errorComponent = React.createElement(SchemaError, {
              title: "Database Setup Incomplete: 'entries' table missing",
              message: React.createElement('p', null, "The application requires an ", React.createElement('code', null, "entries"), " table. Run SQL setup."),
              sql: ENTRIES_TABLE_SETUP_SQL
            });
          } else if (msg.includes('relation "public.quests" does not exist')) {
            errorComponent = React.createElement(SchemaError, {
              title: "Database Setup Incomplete: 'quests' table missing",
              message: React.createElement('p', null, "The application requires a ", React.createElement('code', null, "quests"), " table. Run SQL setup."),
              sql: QUESTS_TABLE_SETUP_SQL
            });
          }
        }

        setError(errorComponent);
        setUserProfile({ name: 'Error', alias: 'Could not load profile', picture: undefined });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    // Only fetch if we have a session or are in local mode (implied by this hook being used mostly when authed or local)
    // But logic in App was: if (!session && isSupabaseConfigured) return;
    // So we assume if we are here, we are good to load or we are local.
    loadInitialData();

    return () => { isMounted = false; };
  }, [session, isSupabaseConfigured]);

  // Actions
  const saveEntry = useCallback(async (entry: Omit<EmotionEntry, 'date'>, date: Date) => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      const newEntry = { ...entry, date: dateKey };

      try {
        await db.saveEntry(newEntry);
        setEntries(prev => ({
          ...prev,
          [dateKey]: newEntry,
        }));
      } catch (err: unknown) {
        const message = getErrorMessage(err);
        console.error("Failed to save entry:", message);
        throw err;
      }
  }, []);

  const deleteEntry = useCallback(async (date: Date) => {
      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      try {
        await db.deleteEntry(dateKey);
        setEntries(prev => {
          const newEntries = { ...prev };
          delete newEntries[dateKey];
          return newEntries;
        });
      } catch (err: unknown) {
        const message = getErrorMessage(err);
        console.error("Failed to delete entry:", message);
        throw err;
      }
  }, []);

  const saveProfile = useCallback(async (profile: UserProfile) => {
    try {
      const savedProfile = await db.saveProfile(profile);
      setUserProfile(savedProfile);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Failed to save profile:', message);
      throw err;
    }
  }, []);

  const addQuest = useCallback(async (text: string) => {
    try {
      const newQuest = await db.addQuest(text);
      setQuests(prev => [...prev, newQuest]);
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error adding quest:', message);
    }
  }, []);

  const toggleQuest = useCallback(async (id: string, completed: boolean) => {
    try {
      const updatedQuest = await db.updateQuestStatus(id, completed);
      setQuests(prev => prev.map(q => q.id === id ? updatedQuest : q));
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error updating quest:', message);
    }
  }, []);

  const deleteQuest = useCallback(async (id: string) => {
    try {
      await db.deleteQuest(id);
      setQuests(prev => prev.filter(q => q.id !== id));
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      console.error('Error deleting quest:', message);
    }
  }, []);

  return {
    entries,
    quests,
    userProfile,
    loading,
    error,
    saveEntry,
    deleteEntry,
    saveProfile,
    addQuest,
    toggleQuest,
    deleteQuest
  };
}
