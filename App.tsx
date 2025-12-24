import React, { useState, useCallback, useEffect, useRef } from 'react';
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
import LandingPage from './components/LandingPage';
import Background from './components/Background';
import GridOverlay from './components/GridOverlay';
import CustomCursor from './components/CustomCursor';
import { ThemeWrapper } from './components/ThemeWrapper';


import { ActiveView, EmotionEntry, EmotionType, Theme } from './types';
import { useAuth } from './hooks/useAuth';
import { useAdSystem } from './hooks/useAdSystem';
import { useJournalData } from './hooks/useJournalData';

const App: React.FC = () => {
  const { session, loading: isAuthLoading, signOut, isSupabaseConfigured } = useAuth();
  const { entries, quests, userProfile, loading: isDataLoading, error, saveEntry, deleteEntry, saveProfile, addQuest, toggleQuest, deleteQuest } = useJournalData(session, isSupabaseConfigured);
  const { isAdVisible, adContent, closeAd } = useAdSystem(!!session);

  const [showLanding, setShowLanding] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<ActiveView>('journal');
  const [theme, setTheme] = useState<Theme>('twilight');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [initialEmotion, setInitialEmotion] = useState<EmotionType | undefined>(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const questsPopoverRef = useRef<HTMLDivElement>(null);

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('emotion-journal-theme') as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('emotion-journal-theme', newTheme);
  }, []);

  // Event Handlers
  const handleNavigate = useCallback((view: ActiveView) => setActiveView(view), []);
  
  const handleDateClick = useCallback((day: Date) => {
    setSelectedDate(day);
    setIsModalOpen(true);
  }, []);

  const handleOpenNewEntry = useCallback((emotion?: EmotionType) => {
    setSelectedDate(new Date());
    if (emotion) setInitialEmotion(emotion);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setInitialEmotion(undefined);
  }, []);

  const onSaveEntry = useCallback(async (entry: Omit<EmotionEntry, 'date'>) => {
    if (selectedDate) {
      await saveEntry(entry, selectedDate);
    }
  }, [selectedDate, saveEntry]);

  const onDeleteEntry = useCallback(async () => {
    if (selectedDate) {
      await deleteEntry(selectedDate);
    }
  }, [selectedDate, deleteEntry]);

  // Click outside for Quests
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const questsButton = document.getElementById('quests-toggle-button');
      if (isQuestsOpen && questsPopoverRef.current && !questsPopoverRef.current.contains(event.target as Node) && !questsButton?.contains(event.target as Node)) {
        setIsQuestsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isQuestsOpen]);


  // Rendering
  if (isAuthLoading) {
    return <div className="flex h-screen w-screen items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div></div>;
  }

  const entriesArray = Object.values(entries);

  return (
    <ThemeWrapper theme={theme} className="flex h-screen w-screen relative overflow-hidden">
      <CustomCursor />
      <Background theme={theme} />
      <GridOverlay />
      
      <div className="flex h-full w-full z-10 relative">
        {!session ? (
            showLanding ? (
                <LandingPage onGetStarted={() => setShowLanding(false)} />
            ) : (
                <Auth />
            )
        ) : (
            <>
                <Sidebar
                    activeView={activeView}
                    onNavigate={handleNavigate}
                    onNewEntryClick={handleOpenNewEntry}
                    userProfile={userProfile}
                    onSaveProfile={saveProfile}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Header
                        onNewEntryClick={() => handleOpenNewEntry()}
                        userProfile={userProfile}
                        onProfileClick={() => setIsProfileModalOpen(true)}
                        onQuestsClick={() => setIsQuestsOpen(prev => !prev)}
                        onSignOut={signOut}
                    />
                    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                        {isDataLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
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
                    onSave={onSaveEntry}
                    onDelete={onDeleteEntry}
                    selectedDate={selectedDate || new Date()}
                    entry={selectedDate ? entries[`${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`] : undefined}
                    initialEmotion={initialEmotion}
                />
                <ProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    onSave={saveProfile}
                    profile={userProfile}
                />
                <QuestsPopover
                    isOpen={isQuestsOpen}
                    onClose={() => setIsQuestsOpen(false)}
                    quests={quests}
                    onAddQuest={addQuest}
                    onToggleQuest={toggleQuest}
                    onDeleteQuest={deleteQuest}
                    anchorRef={questsPopoverRef}
                />
            </>
        )}
        
        {adContent && (
          <AdPopup
            isOpen={isAdVisible}
            onClose={closeAd}
            title={adContent.title}
            message={adContent.message}
            icon={adContent.icon}
          />
        )}
      </div>
    </ThemeWrapper>
  );
};

export default App;