
import React, { useState, useCallback, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import TrendsView from './components/TrendsView';
import ReportsView from './components/ReportsView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import EntryModal from './components/EntryModal';
import ProfileModal from './components/ProfileModal';
import Auth from './components/Auth';
import { type EmotionEntry, type ActiveView, type EmotionType, type UserProfile, type Theme } from './types';
import * as db from './services/supabaseService';
import * as auth from './services/auth';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

const isSupabaseConfigured = (SUPABASE_URL as string) !== 'YOUR_SUPABASE_URL' && SUPABASE_URL && (SUPABASE_ANON_KEY as string) !== 'YOUR_SUPABASE_ANON_KEY' && SUPABASE_ANON_KEY;

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [entries, setEntries] = useState<Record<string, EmotionEntry>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('journal');
  const [initialEmotion, setInitialEmotion] = useState<EmotionType | undefined>(undefined);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Loading...',
    alias: '...',
    picture: undefined,
    journalPurpose: 'Loading purpose...'
  });

  const [theme, setTheme] = useState<Theme>('twilight');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('emotion-journal-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'twilight');
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      // If user logs out, we shouldn't show old data
      setEntries({});
      setUserProfile({ name: 'Loading...', alias: '...', picture: undefined });
      return;
    };

    async function loadInitialData() {
      setIsDataLoading(true);
      setError(null);
      try {
        const [fetchedEntries, fetchedProfile] = await Promise.all([
            db.getEntries(),
            db.getProfile()
        ]);
        setEntries(fetchedEntries);
        setUserProfile(fetchedProfile);
      } catch (err: any) {
        console.error("Failed to load data:", err);
        
        let errorMessage = `Failed to load data from Supabase. This might be due to incorrect credentials or Row Level Security policies.\n\nDetails: ${err.message}`;

        if (err.message && err.message.includes('invalid input syntax for type bigint')) {
            errorMessage = `Database Schema Mismatch!

Your 'profiles' table has an 'id' column with the wrong data type. The application expects it to be a 'uuid' to link with authenticated users, but your database has it as 'bigint' (a number).

How to Fix in Your Supabase Project:
1. Go to the 'Table Editor' and select your 'profiles' table.
2. Back up any existing profile data. The following steps will replace the 'id' column.
3. Delete the current 'id' column.
4. Create a new column named 'id'.
5. Set its type to 'uuid'.
6. In the column settings, enable 'Is Primary' to make it the primary key.
7. Go to the "Advanced" settings for the column and set its 'Default Value' to 'auth.uid()'. This links new profiles to the logged-in user automatically.
8. Save the table.

After fixing the schema, please refresh the application.`;
        } else if (err.message && err.message.includes('does not exist')) {
             errorMessage = `Database Schema Mismatch!

The application is failing to find a required column in your database tables. This usually means the table structure doesn't match what the app expects.

Common Causes:
- A column is missing (e.g., 'user_id' in the 'entries' table).
- The 'profiles' table is not correctly linked to users.

Please review the Supabase setup instructions and ensure your 'entries' and 'profiles' tables match the required schema. For profiles, the 'id' column should be of type 'uuid' and act as the primary key.`;
        }

        setError(errorMessage);
        setUserProfile({ name: 'Error', alias: 'Could not load profile', picture: undefined });
      } finally {
        setIsDataLoading(false);
      }
    }
    loadInitialData();
  }, [session]);

  const handleSignOut = async () => {
    const { error } = await auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      // Optionally show an error to the user
    }
    // The onAuthStateChange listener will handle setting the session to null
  };
  
  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('emotion-journal-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  }, []);


  const handleNavigate = useCallback((view: ActiveView) => {
    setActiveView(view);
  }, []);

  const handleDateClick = useCallback((day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  }, []);

  const handleOpenNewEntry = useCallback((emotion?: EmotionType) => {
    setSelectedDate(new Date());
    if (emotion) {
        setInitialEmotion(emotion);
    }
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setInitialEmotion(undefined);
  }, []);

  const handleSaveEntry = useCallback(async (entry: Omit<EmotionEntry, 'date'>) => {
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const d = selectedDate.getDate().toString().padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;
      
      const newEntry = { ...entry, date: dateKey };

      try {
        await db.saveEntry(newEntry);
        setEntries(prevEntries => ({
          ...prevEntries,
          [dateKey]: newEntry,
        }));
        handleCloseModal();
      } catch (err) {
          console.error("Failed to save entry:", err);
          // Re-throw the error so the modal can catch and display it
          throw err;
      }
    }
  }, [selectedDate, handleCloseModal]);
  
  const handleDeleteEntry = useCallback(async () => {
    if(selectedDate) {
        const y = selectedDate.getFullYear();
        const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
        const d = selectedDate.getDate().toString().padStart(2, '0');
        const dateKey = `${y}-${m}-${d}`;
        
        try {
            await db.deleteEntry(dateKey);
            setEntries(prevEntries => {
                const newEntries = {...prevEntries};
                delete newEntries[dateKey];
                return newEntries;
            });
            handleCloseModal();
        } catch (err) {
            console.error("Failed to delete entry:", err);
        }
    }
  }, [selectedDate, handleCloseModal]);
  
  const handleOpenProfileModal = useCallback(() => {
      setIsProfileModalOpen(true);
  }, []);

  const handleCloseProfileModal = useCallback(() => {
      setIsProfileModalOpen(false);
  }, []);

  const handleSaveProfile = useCallback(async (profile: UserProfile) => {
    try {
        const saved = await db.saveProfile(profile);
        setUserProfile(saved);
        handleCloseProfileModal();
    } catch (err) {
        console.error("Failed to save profile:", err);
    }
  }, [handleCloseProfileModal]);

  if (!isSupabaseConfigured) {
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-black text-white p-4">
            <div className="bg-red-900/50 border border-red-500/30 text-red-300 p-6 rounded-lg max-w-lg text-center">
                <h2 className="text-xl font-bold mb-3">Supabase Not Configured</h2>
                <p className="text-red-200 text-sm leading-relaxed">
                    You must provide your Supabase Project URL and anon key in the <code className="bg-black/50 px-1 py-0.5 rounded">config.ts</code> file to enable database functionality and authentication.
                </p>
            </div>
        </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
          <div className="flex items-center space-x-3">
              <div role="status" className="animate-spin inline-block w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full">
                  <span className="sr-only">Loading...</span>
              </div>
              <span>Initializing...</span>
          </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (isDataLoading) {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
            <div className="flex items-center space-x-3">
                <div role="status" className="animate-spin inline-block w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full">
                    <span className="sr-only">Loading...</span>
                </div>
                <span>Loading your journal...</span>
            </div>
        </div>
    );
  }

  if (error) {
      return (
          <div className="flex h-screen w-screen items-center justify-center bg-black text-white p-4">
              <div className="bg-red-900/50 border border-red-500/30 text-red-300 p-6 rounded-lg max-w-2xl">
                  <h2 className="text-xl font-bold mb-3 text-center">Application Error</h2>
                  <p className="whitespace-pre-wrap text-left text-red-200 text-sm leading-relaxed">{error}</p>
              </div>
          </div>
      );
  }

  const selectedEntry = selectedDate ? entries[`${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`] : undefined;

  return (
    <div className="flex h-screen">
      <Sidebar 
        activeView={activeView} 
        onNavigate={handleNavigate} 
        onNewEntryClick={handleOpenNewEntry}
        userProfile={userProfile}
        onSaveProfile={handleSaveProfile}
       />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            onNewEntryClick={() => handleOpenNewEntry()} 
            userProfile={userProfile}
            onProfileClick={handleOpenProfileModal}
            onSignOut={handleSignOut}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 md:p-6 lg:p-8">
          {activeView === 'journal' && (
            <CalendarView
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              onDateClick={handleDateClick}
              entries={entries}
            />
          )}
          {activeView === 'trends' && (
            <TrendsView entries={Object.values(entries)} />
          )}
          {activeView === 'reports' && (
            <ReportsView entries={Object.values(entries)} />
          )}
          {activeView === 'history' && (
            <HistoryView entries={Object.values(entries)} />
          )}
          {activeView === 'settings' && (
            <SettingsView currentTheme={theme} onThemeChange={handleThemeChange} />
          )}
        </main>
      </div>
      {isModalOpen && selectedDate && (
        <EntryModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveEntry}
          onDelete={handleDeleteEntry}
          selectedDate={selectedDate}
          entry={selectedEntry}
          initialEmotion={initialEmotion}
        />
      )}
       {isProfileModalOpen && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
          onSave={handleSaveProfile}
          profile={userProfile}
        />
      )}
    </div>
  );
};

export default App;