import React, { Suspense, lazy, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import IconJournal from './components/icons/IconJournal';
import IconTrends from './components/icons/IconTrends';
import IconReports from './components/icons/IconReports';
import IconHistory from './components/icons/IconHistory';
import IconQuest from './components/icons/IconQuest';
import IconSettings from './components/icons/IconSettings';
import AdPopup from './components/AdPopup';
import Background from './components/Background';
import GridOverlay from './components/GridOverlay';
import CustomCursor from './components/CustomCursor';
import { ThemeWrapper } from './components/ThemeWrapper';
import { I18nProvider } from './hooks/useI18n';
import CookieBanner from './components/CookieBanner';
import { Analytics } from '@vercel/analytics/react';
import { useConsent } from './hooks/useConsent';
import PreMarketRoutine from './components/Routine/PreMarketRoutine';
import { useI18n } from './hooks/useI18n';


import { ActiveView, EmotionEntry, EmotionType, Theme } from './types';
import { useAuth } from './hooks/useAuth';
import { useAdSystem } from './hooks/useAdSystem';
import { useJournalData } from './hooks/useJournalData';

const TrendsView = lazy(() => import('./components/TrendsView'));
const ReportsView = lazy(() => import('./components/ReportsView'));
const HistoryView = lazy(() => import('./components/HistoryView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const PerformanceReviewView = lazy(() => import('./components/PerformanceReviewView'));
const EntryModal = lazy(() => import('./components/EntryModal'));
const ProfileModal = lazy(() => import('./components/ProfileModal'));
const QuestsPopover = lazy(() => import('./components/QuestsPopover'));
const Auth = lazy(() => import('./components/Auth'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const PrivacyPolicy = lazy(() => import('./components/Legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/Legal/TermsOfService'));

const SectionLoader: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex items-center justify-center ${className ?? 'h-full min-h-[240px]'}`}>
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent-primary)]" />
  </div>
);

const AppContent: React.FC = () => {
  const { session, loading: isAuthLoading, signOut, isSupabaseConfigured } = useAuth();
  const { entries, quests, userProfile, loading: isDataLoading, error, saveEntry, deleteEntry, saveProfile, addQuest, toggleQuest, deleteQuest } = useJournalData(session, isSupabaseConfigured);
  const { isAdVisible, adContent, closeAd } = useAdSystem(!!session);
  const { t } = useI18n();

  const [showLanding, setShowLanding] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<ActiveView>('journal');
  const [theme, setTheme] = useState<Theme>('twilight');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [initialEmotion, setInitialEmotion] = useState<EmotionType | undefined>(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // Quests
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);
  const questsPopoverRef = useRef<HTMLDivElement>(null);

  // Legal Modals
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const fallbackModalDateRef = useRef(new Date());

  // Consent
  const { consent } = useConsent();

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
  const handleOpenBlankEntry = useCallback(() => handleOpenNewEntry(), [handleOpenNewEntry]);
  const handleMonthChange = useCallback((offset: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }, []);
  const handleYearChange = useCallback((offset: number) => {
    setCurrentDate((prev) => new Date(prev.getFullYear() + offset, prev.getMonth(), 1));
  }, []);
  const handleGoToToday = useCallback(() => setCurrentDate(new Date()), []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedDate(null);
    setInitialEmotion(undefined);
  }, []);
  const handleOpenProfileModal = useCallback(() => setIsProfileModalOpen(true), []);
  const handleCloseProfileModal = useCallback(() => setIsProfileModalOpen(false), []);
  const handleToggleQuests = useCallback(() => setIsQuestsOpen((prev) => !prev), []);
  const handleCloseQuests = useCallback(() => setIsQuestsOpen(false), []);
  const handleOpenPrivacy = useCallback(() => setShowPrivacy(true), []);
  const handleClosePrivacy = useCallback(() => setShowPrivacy(false), []);
  const handleOpenTerms = useCallback(() => setShowTos(true), []);
  const handleCloseTerms = useCallback(() => setShowTos(false), []);

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
  const isAppAccessible = !!session || !isSupabaseConfigured;
  const isBybitEnabled = !!session && isSupabaseConfigured;
  const effectiveTheme = isAppAccessible ? theme : 'twilight';
  const mobileNavItems: Array<{ view: ActiveView; label: string; icon: React.ReactNode }> = useMemo(() => [
    { view: 'journal', label: t('dashboard.sidebar.journal'), icon: <IconJournal className="w-4 h-4" /> },
    { view: 'trends', label: t('dashboard.sidebar.trends'), icon: <IconTrends className="w-4 h-4" /> },
    { view: 'reports', label: t('dashboard.sidebar.reports'), icon: <IconReports className="w-4 h-4" /> },
    { view: 'history', label: t('dashboard.sidebar.history'), icon: <IconHistory className="w-4 h-4" /> },
    { view: 'review', label: t('dashboard.sidebar.review'), icon: <IconQuest className="w-4 h-4" /> },
    { view: 'settings', label: t('dashboard.sidebar.settings'), icon: <IconSettings className="w-4 h-4" /> },
  ], [t]);
  const selectedEntryKey = useMemo(() => {
    if (!selectedDate) return null;
    return `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
  }, [selectedDate]);
  const selectedEntry = selectedEntryKey ? entries[selectedEntryKey] : undefined;
  const modalSelectedDate = selectedDate ?? fallbackModalDateRef.current;

  const renderActiveView = () => {
    if (activeView === 'journal') {
      return (
        <>
          <PreMarketRoutine />
          <CalendarView
            currentDate={currentDate}
            onMonthChange={handleMonthChange}
            onYearChange={handleYearChange}
            onGoToToday={handleGoToToday}
            onDateClick={handleDateClick}
            entries={entries}
          />
        </>
      );
    }

    return (
      <Suspense fallback={<SectionLoader />}>
        {activeView === 'trends' && <TrendsView entries={entriesArray} />}
        {activeView === 'reports' && <ReportsView entries={entriesArray} />}
        {activeView === 'history' && <HistoryView entries={entriesArray} />}
        {activeView === 'review' && <PerformanceReviewView />}
        {activeView === 'settings' && <SettingsView currentTheme={theme} onThemeChange={handleThemeChange} isBybitAvailable={isBybitEnabled} />}
      </Suspense>
    );
  };

  return (
    <>
      <ThemeWrapper theme={effectiveTheme} className={`flex flex-col relative ${showLanding && !isAppAccessible ? 'min-h-screen w-full' : 'h-screen w-screen overflow-hidden'}`}>
      <CustomCursor />
      {(!showLanding || isAppAccessible) && (
        <>
          <Background theme={effectiveTheme} />
          <GridOverlay />
        </>
      )}
      
      <div className="flex h-full w-full z-10 relative">
        {!isAppAccessible ? (
            showLanding ? (
                <Suspense fallback={<SectionLoader className="min-h-screen w-full" />}>
                  <LandingPage 
                    onGetStarted={() => setShowLanding(false)} 
                    onOpenPrivacy={handleOpenPrivacy}
                    onOpenTerms={handleOpenTerms}
                  />
                </Suspense>
            ) : (
                <Suspense fallback={<SectionLoader className="min-h-screen w-full" />}>
                  <Auth />
                </Suspense>
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
                        onNewEntryClick={handleOpenBlankEntry}
                        userProfile={userProfile}
                        onProfileClick={handleOpenProfileModal}
                        onQuestsClick={handleToggleQuests}
                        onSignOut={signOut}
                    />
                    <nav className="md:hidden border-b border-[color:var(--glass-border)] bg-black/10 backdrop-blur-xl">
                        <div className="flex gap-2 overflow-x-auto px-4 py-3 custom-scrollbar">
                            {mobileNavItems.map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => handleNavigate(item.view)}
                                    className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-all ${
                                        activeView === item.view
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                                            : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                                    }`}
                                    aria-current={activeView === item.view ? 'page' : undefined}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </nav>
                    <main className="flex-1 p-4 md:p-6 overflow-y-auto">
                        {isDataLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full p-4">{error}</div>
                        ) : (
                            renderActiveView()
                        )}
                    </main>
                </div>

                <Suspense fallback={null}>
                  <EntryModal
                      isOpen={isModalOpen}
                      onClose={handleCloseModal}
                      onSave={onSaveEntry}
                      onDelete={onDeleteEntry}
                      selectedDate={modalSelectedDate}
                      entry={selectedEntry}
                      initialEmotion={initialEmotion}
                      isBybitAvailable={isBybitEnabled}
                  />
                  <ProfileModal
                      isOpen={isProfileModalOpen}
                      onClose={handleCloseProfileModal}
                      onSave={saveProfile}
                      profile={userProfile}
                  />
                  <QuestsPopover
                      isOpen={isQuestsOpen}
                      onClose={handleCloseQuests}
                      quests={quests}
                      onAddQuest={addQuest}
                      onToggleQuest={toggleQuest}
                      onDeleteQuest={deleteQuest}
                      anchorRef={questsPopoverRef}
                  />
                </Suspense>
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
      <CookieBanner />
      <AnimatePresence>
        {showPrivacy && (
          <Suspense fallback={null}>
            <PrivacyPolicy onClose={handleClosePrivacy} />
          </Suspense>
        )}
        {showTos && (
          <Suspense fallback={null}>
            <TermsOfService onClose={handleCloseTerms} />
          </Suspense>
        )}
      </AnimatePresence>
      {consent.analytics && <Analytics />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
};

export default App;
