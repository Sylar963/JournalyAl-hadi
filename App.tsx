import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import QuestsPopover from './components/QuestsPopover';
import Auth from './components/Auth';
import AdPopup from './components/AdPopup';
import SchemaError from './components/SchemaError';
import { type EmotionEntry, type ActiveView, type EmotionType, type UserProfile, type Theme, type Quest } from './types';
import * as db from './services/dataService';
import * as auth from './services/auth';
import { isUsingSupabase as isSupabaseConfigured } from './services/dataService';
import { AD_MESSAGES, WISDOM_QUOTES } from './constants';
import { PROFILES_TABLE_SETUP_SQL, ENTRIES_TABLE_SETUP_SQL, QUESTS_TABLE_SETUP_SQL } from './services/supabaseService';


import IconReports from './components/icons/IconReports';
import IconSparkles from './components/icons/IconSparkles';
import IconSettings from './components/icons/IconSettings';
import IconUpload from './components/icons/IconUpload';
import IconJournal from './components/icons/IconJournal';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [entries, setEntries] = useState<Record<string, EmotionEntry>>({});
  const [quests, setQuests] = useState<Quest[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('journal');
  const [initialEmotion, setInitialEmotion] = useState<EmotionType | undefined>(undefined);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Loading...',
    alias: '...',
    picture: undefined,
    journalPurpose: 'Loading purpose...'
  });

  const [theme, setTheme] = useState<Theme>('twilight');
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [error, setError] = useState<React.ReactNode | null>(null);

  const [isAdVisible, setIsAdVisible] = useState(false);
  const [adContent, setAdContent] = useState<{ title: string; message: string; icon: React.ReactNode } | null>(null);
  const adTimerRef = useRef<number | null>(null);
  const questsPopoverRef = useRef<HTMLDivElement>(null);


  const AD_ICONS: Record<string, React.ReactNode> = {
    reports: <IconReports className="w-6 h-6" />,
    sparkles: <IconSparkles className="w-6 h-6" />,
    settings: <IconSettings className="w-6 h-6" />,
    upload: <IconUpload className="w-6 h-6" />,
    journal: <IconJournal className="w-6 h-6" />,
  };

  const showAd = useCallback(() => {
    // Make the wisdom quotes dynamic bypicking a random one each time
    const adPool = [...AD_MESSAGES];
    const quoteAdIndex = adPool.findIndex(ad => ad.title === "A Moment of Wisdom");
    if (quoteAdIndex !== -1) {
        adPool[quoteAdIndex] = {
            ...adPool[quoteAdIndex],
            message: WISDOM_QUOTES[Math.floor(Math.random() * WISDOM_QUOTES.length)]
        };
    }

    const randomAd = adPool[Math.floor(Math.random() * adPool.length)];
    
    setAdContent({
        title: randomAd.title,
        message: randomAd.message,
        icon: AD_ICONS[randomAd.icon] || <IconSparkles className="w-6 h-6" />
    });
    setIsAdVisible(true);
  }, []);

  const resetAdTimer = useCallback(() => {
      // Hide any currently visible ad when activity is detected
      setIsAdVisible(false);
      
      if (adTimerRef.current) {
          clearTimeout(adTimerRef.current);
      }
      // Set to 30 minutes for production
      const AD_INTERVAL = 60 * 1000 * 30; 
      adTimerRef.current = window.setTimeout(showAd, AD_INTERVAL);
  }, [showAd]);

  useEffect(() => {
      resetAdTimer(); // Start the timer on initial load

      // Add event listeners to reset timer on user activity
      window.addEventListener('mousedown', resetAdTimer);
      window.addEventListener('keydown', resetAdTimer);

      // Cleanup function to remove listeners and clear timer
      return () => {
          if (adTimerRef.current) {
              clearTimeout(adTimerRef.current);
          }
          window.removeEventListener('mousedown', resetAdTimer);
          window.removeEventListener('keydown', resetAdTimer);
      };
  }, [resetAdTimer]);

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
    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      return;
    }

    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      // If the event is SIGNED_IN, it's a fresh login. Show the ad.
      if (event === 'SIGNED_IN') {
          showAd();
      }
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [showAd, isSupabaseConfigured]);

  useEffect(() => {
    // When in local mode (no Supabase), session will always be null.
    // We only reset data if a session previously existed (i.e., user logged out).
    if (isSupabaseConfigured && !session) {
      setEntries({});
      setQuests([]);
      setUserProfile({ name: 'Loading...', alias: '...', picture: undefined });
      return;
    };

    async function loadInitialData() {
      setIsDataLoading(true);
      setError(null);
      try {
        const [fetchedEntries, fetchedProfile, fetchedQuests] = await Promise.all([
            db.getEntries(),
            db.getProfile(),
            db.getQuests()
        ]);
        setEntries(fetchedEntries);
        setUserProfile(fetchedProfile);
        setQuests(fetchedQuests);
      } catch (err: any) {
        console.error("Failed to load data:", err.message);
        
        let errorComponent: React.ReactNode = (
            <div className="bg-gray-900 border border-red-500/30 rounded-lg p-6 text-center">
                <h2 className="text-xl font-bold text-red-400">Failed to Load Data</h2>
                <p className="mt-2 text-gray-300">
                    An unexpected error occurred while loading your data from Supabase.
                </p>
                <p className="mt-4 text-sm bg-black/20 p-2 rounded font-mono text-red-300">{err.message}</p>
            </div>
        );

        if (err.message) {
            const msg = err.message.toLowerCase();
            if (msg.includes('relation "public.profiles" does not exist')) {
                errorComponent = <SchemaError
                    title="Database Setup Incomplete: 'profiles' table missing"
                    message={<p>The application requires a <code>profiles</code> table to store user information. Please copy the SQL below and run it in your Supabase project's SQL Editor to create the table and its security policies.</p>}
                    sql={PROFILES_TABLE_SETUP_SQL}
                />
            } else if (msg.includes('relation "public.entries" does not exist')) {
                errorComponent = <SchemaError
                    title="Database Setup Incomplete: 'entries' table missing"
                    message={<p>The application requires an <code>entries</code> table to store your journal entries. Please copy the SQL below and run it in your Supabase project's SQL Editor.</p>}
                    sql={ENTRIES_TABLE_SETUP_SQL}
                />
            } else if (msg.includes('relation "public.quests" does not exist')) {
                errorComponent = <SchemaError
                    title="Database Setup Incomplete: 'quests' table missing"
                    message={<p>The application requires a <code>quests</code> table for the quests feature. Please copy the SQL below and run it in your Supabase project's SQL Editor.</p>}
                    sql={QUESTS_TABLE_SETUP_SQL}
                />
            } else if (msg.includes('invalid input syntax for type uuid')) {
                errorComponent = <SchemaError
                    title="Database Schema Mismatch: Invalid Profile ID"
                    message={
                        <>
                            <p>Your <code>profiles</code> table seems to have an <code>id</code> column with the wrong data type. The application expects it to be a <code>uuid</code> to link with authenticated users.</p>
                            <p className="mt-2">Please ensure your <code>profiles</code> table is created correctly by running the setup SQL.</p>
                        </>
                    }
                    sql={PROFILES_TABLE_SETUP_SQL}
                />
            }
        }

        setError(errorComponent);
        setUserProfile({ name: 'Error', alias: 'Could not load profile', picture: undefined });
      } finally {
        setIsDataLoading(false);
      }
    }
    loadInitialData();
  }, [session, isSupabaseConfigured]);

    useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const questsButton = document.getElementById('quests-toggle-button');
      if (
        isQuestsOpen &&
        questsPopoverRef.current &&
        !questsPopoverRef.current.contains(event.target as Node) &&
        !questsButton?.contains(event.target as Node)
      ) {
        setIsQuestsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQuestsOpen]);

  const handleSignOut = async () => {
    const { error } = await auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
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
      } catch (err: any) {
          console.error("Failed to save entry:", err.message);
          throw err;
      }
    }
  }, [selectedDate]);
  
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
        } catch (err: any) {
            console.error("Failed to delete entry:", err.message);
            throw err;
        }
    }
  }, [selectedDate]);
  
  const handleOpenProfileModal = useCallback(() => {
      setIsProfileModalOpen(true);
  }, []);

  const handleCloseProfileModal = useCallback(() => {
      setIsProfileModalOpen(false);
  }, []);
  
  const handleSaveProfile = useCallback(async (profile: UserProfile) => {
    try {
        const savedProfile = await db.saveProfile(profile);
        setUserProfile(savedProfile);
        setIsProfileModalOpen(false);
    } catch (err: any) {
        console.error('Failed to save profile:', err.message);
        // Here you could set an error state to show in the profile modal
    }
  }, []);

  const handleAddQuest = useCallback(async (text: string) => {
      try {
          const newQuest = await db.addQuest(text);
          setQuests(prev => [...prev, newQuest]);
      } catch(err: any) {
          console.error('Error adding quest:', err.message);
      }
  }, []);

  const handleToggleQuest = useCallback(async (id: string, completed: boolean) => {
      try {
          const updatedQuest = await db.updateQuestStatus(id, completed);
          setQuests(prev => prev.map(q => q.id === id ? updatedQuest : q));
      } catch(err: any) {
          console.error('Error updating quest:', err.message);
      }
  }, []);

  const handleDeleteQuest = useCallback(async (id: string) => {
      try {
          await db.deleteQuest(id);
          setQuests(prev => prev.filter(q => q.id !== id));
      } catch(err: any) {
          console.error('Error deleting quest:', err.message);
      }
  }, []);

  if (isAuthLoading) {
      return <div className="flex h-screen w-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div></div>;
  }
  
  if (!session && isSupabaseConfigured) {
      return <Auth />;
  }

  const entriesArray = Object.values(entries);

  return (
    <div className="flex h-screen w-screen">
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
          onQuestsClick={() => setIsQuestsOpen(prev => !prev)}
          onSignOut={handleSignOut}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {isDataLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full p-4">{error}</div>
          ) : (
            <>
              {activeView === 'journal' && (
                <CalendarView
                  currentDate={currentDate}
                  onMonthChange={(offset) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))}
                  onYearChange={(offset) => setCurrentDate(prev => new Date(prev.getFullYear() + offset, prev.getMonth(), 1))}
                  onGoToToday={() => setCurrentDate(new Date())}
                  onDateClick={handleDateClick}
                  entries={entries}
                />
              )}
              {activeView === 'trends' && <TrendsView entries={entriesArray} />}
              {activeView === 'reports' && <ReportsView entries={entriesArray} />}
              {activeView === 'history' && <HistoryView entries={entriesArray} />}
              {activeView === 'settings' && <SettingsView currentTheme={theme} onThemeChange={handleThemeChange} />}
            </>
          )}
        </main>
      </div>

      <EntryModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        selectedDate={selectedDate || new Date()}
        entry={selectedDate ? entries[`${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`] : undefined}
        initialEmotion={initialEmotion}
      />
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
        onSave={handleSaveProfile}
        profile={userProfile}
      />
       <QuestsPopover
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
        quests={quests}
        onAddQuest={handleAddQuest}
        onToggleQuest={handleToggleQuest}
        onDeleteQuest={handleDeleteQuest}
        anchorRef={questsPopoverRef}
      />
      {adContent && (
        <AdPopup
            isOpen={isAdVisible}
            onClose={() => setIsAdVisible(false)}
            title={adContent.title}
            message={adContent.message}
            icon={adContent.icon}
        />
      )}
    </div>
  );
};

export default App;