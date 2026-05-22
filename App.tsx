import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import CalendarView from './components/CalendarView';
import TrendsView from './components/TrendsView';
import ReportsView from './components/ReportsView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import PerformanceReviewView from './components/PerformanceReviewView';
import IconJournal from './components/icons/IconJournal';
import IconTrends from './components/icons/IconTrends';
import IconReports from './components/icons/IconReports';
import IconHistory from './components/icons/IconHistory';
import IconQuest from './components/icons/IconQuest';
import IconSettings from './components/icons/IconSettings';
import EntryModal from './components/EntryModal';
import ProfileModal from './components/ProfileModal';
import QuestsPopover from './components/QuestsPopover';
import Auth from './components/Auth';
import AdPopup from './components/AdPopup';
import LandingPage from './components/LandingPage';
import Background from './components/Background';
import GridOverlay from './components/GridOverlay';
import { ThemeWrapper } from './components/ThemeWrapper';
import { I18nProvider } from './hooks/useI18n';
import CookieBanner from './components/CookieBanner';
import AppUpdatePrompt from './components/AppUpdatePrompt';
import AppErrorBoundary from './components/AppErrorBoundary';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import TermsOfService from './components/Legal/TermsOfService';
import ResetPasswordView from './components/ResetPasswordView';
import { Analytics } from '@vercel/analytics/react';
import { useConsent } from './hooks/useConsent';
import PreMarketRoutine from './components/Routine/PreMarketRoutine';
import { useI18n } from './hooks/useI18n';


import { ActiveView, EmotionEntry, EmotionType, Theme } from './types';
import { THEMES_CONFIG } from './constants';
import { useAuth } from './hooks/useAuth';
import { useAdSystem } from './hooks/useAdSystem';
import { useJournalData } from './hooks/useJournalData';

const VIEW_ROUTES: Record<string, ActiveView> = {
  '': 'journal',
  'dashboard': 'journal',
  'journal': 'journal',
  'analytics': 'trends',
  'trends': 'trends',
  'reports': 'reports',
  'history': 'history',
  'review': 'review',
  'performance-review': 'review',
  'settings': 'settings',
};

const AppContent: React.FC = () => {
  const { session, loading: isAuthLoading, signOut, isSupabaseConfigured } = useAuth();
  const { entries, quests, userProfile, loading: isDataLoading, error, saveEntry, deleteEntry, saveProfile, addQuest, toggleQuest, deleteQuest } = useJournalData(session, isSupabaseConfigured);
  const { isAdVisible, adContent, closeAd } = useAdSystem(!!session);
  const { t } = useI18n();

  const [showLanding, setShowLanding] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<ActiveView>('journal');
  const [publicRoute, setPublicRoute] = useState<'reset-password' | null>(null);
  const [theme, setTheme] = useState<Theme>('insilico');

  // URL-based routing using history API for reliable SPA navigation
  useEffect(() => {
    const syncRouteState = () => {
      const path = window.location.pathname.replace(/^\//, '') || '';
      if (path === 'reset-password') {
        setPublicRoute('reset-password');
        return 'journal';
      }

      setPublicRoute(null);
      return VIEW_ROUTES[path] || 'journal';
    };

    setActiveView(syncRouteState());

    const handlePopState = () => {
      setActiveView(syncRouteState());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
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

  // Consent
  const { consent } = useConsent();

  // Theme Logic
  useEffect(() => {
    const savedTheme = localStorage.getItem('emotion-journal-theme') as Theme | null;
    if (savedTheme && THEMES_CONFIG.some(({ id }) => id === savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('emotion-journal-theme', newTheme);
  }, []);

  // Event Handlers
  const handleNavigate = useCallback((view: ActiveView) => {
    setActiveView(view);
    const route = Object.entries(VIEW_ROUTES).find(([_, v]) => v === view)?.[0] || '';
    window.history.pushState(null, '', route ? `/${route}` : '/');
  }, []);
  
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

  if (publicRoute === 'reset-password') {
    return (
      <>
        <ThemeWrapper theme="insilico" className="min-h-screen w-full">
          <Background theme="insilico" />
          <GridOverlay />
          <div className="relative z-10">
            <ResetPasswordView hasRecoverySession={!!session} />
          </div>
        </ThemeWrapper>
        <CookieBanner />
      </>
    );
  }

  const entriesArray = Object.values(entries);
  const isAppAccessible = !!session || !isSupabaseConfigured;
  const isLocalMode = !isSupabaseConfigured;
  const effectiveTheme = isAppAccessible ? theme : 'insilico';
  const mobileNavItems: Array<{ view: ActiveView; label: string; icon: React.ReactNode }> = [
    { view: 'journal', label: t('dashboard.sidebar.journal'), icon: <IconJournal className="w-4 h-4" /> },
    { view: 'trends', label: t('dashboard.sidebar.trends'), icon: <IconTrends className="w-4 h-4" /> },
    { view: 'reports', label: t('dashboard.sidebar.reports'), icon: <IconReports className="w-4 h-4" /> },
    { view: 'history', label: t('dashboard.sidebar.history'), icon: <IconHistory className="w-4 h-4" /> },
    { view: 'review', label: t('dashboard.sidebar.review'), icon: <IconQuest className="w-4 h-4" /> },
    { view: 'settings', label: t('dashboard.sidebar.settings'), icon: <IconSettings className="w-4 h-4" /> },
  ];

  return (
    <>
      <ThemeWrapper theme={effectiveTheme} className={`flex flex-col relative ${showLanding && !isAppAccessible ? 'min-h-screen w-full' : 'h-screen w-screen overflow-hidden'}`}>
      {(!showLanding || isAppAccessible) && (
        <>
          <Background theme={effectiveTheme} />
          <GridOverlay />
        </>
      )}
      
      <div className="flex h-full w-full z-10 relative dashboard-app">
        {!isAppAccessible ? (
            showLanding ? (
                <LandingPage 
                  onGetStarted={() => setShowLanding(false)} 
                  onOpenPrivacy={() => setShowPrivacy(true)}
                  onOpenTerms={() => setShowTos(true)}
                />
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
                <div className="flex-1 flex flex-col overflow-hidden z-10">
                    <Header
                        userProfile={userProfile}
                        onProfileClick={() => setIsProfileModalOpen(true)}
                        onQuestsClick={() => setIsQuestsOpen(prev => !prev)}
                        onSignOut={signOut}
                    />
                    <nav className="md:hidden border-b journal-divider bg-[var(--surface-1)] backdrop-blur-xl">
                        <div className="flex gap-2 overflow-x-auto px-4 py-3 custom-scrollbar">
                            {mobileNavItems.map((item) => (
                                <button
                                    key={item.view}
                                    onClick={() => handleNavigate(item.view)}
                                    className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                        activeView === item.view
                                            ? 'border-[var(--panel-border-strong)] bg-[var(--surface-3)] text-[var(--text-main)]'
                                            : 'border-[var(--panel-border)] bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
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
                        {isLocalMode && (
                            <div className="mb-4 rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-100">
                                Local mode now persists on this device only. Create a backup before switching browsers or clearing site data. AI, lead capture, and broker integrations still require Supabase-backed mode.
                            </div>
                        )}
                        {isDataLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-full p-4">{error}</div>
                        ) : (
                            <>

                                {activeView === 'journal' && (
                                    <>
                                        <PreMarketRoutine />
                                        <CalendarView
                                            currentDate={currentDate}
                                            onMonthChange={(offset) => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))}
                                            onYearChange={(offset) => setCurrentDate(prev => new Date(prev.getFullYear() + offset, prev.getMonth(), 1))}
                                            onGoToToday={() => setCurrentDate(new Date())}
                                            onDateClick={handleDateClick}
                                            entries={entries}
                                        />
                                    </>
                                )}
                                {activeView === 'trends' && <TrendsView entries={entriesArray} />}
                                {activeView === 'reports' && <ReportsView entries={entriesArray} />}
                                {activeView === 'history' && <HistoryView entries={entriesArray} />}
                                {activeView === 'review' && <PerformanceReviewView />}
                                {activeView === 'settings' && (
                                  <SettingsView
                                    currentTheme={theme}
                                    onThemeChange={handleThemeChange}
                                    isBybitAvailable={!!session && isSupabaseConfigured}
                                    isThalexAvailable={!!session && isSupabaseConfigured}
                                    canManageAccount={!!session && isSupabaseConfigured}
                                    onAccountDeleted={signOut}
                                  />
                                )}
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
                    isBybitAvailable={!!session && isSupabaseConfigured}
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
            url={adContent.url}
            bannerImageUrl={adContent.bannerImageUrl}
            creativeType={adContent.creativeType}
            previewUrl={adContent.previewUrl}
            previewHighlights={adContent.previewHighlights}
          />
        )}
      </div>
      </ThemeWrapper>
      <AppUpdatePrompt />
      <CookieBanner />
      <AnimatePresence>
        {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
        {showTos && <TermsOfService onClose={() => setShowTos(false)} />}
      </AnimatePresence>
      {consent.analytics && <Analytics />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AppErrorBoundary>
        <AppContent />
      </AppErrorBoundary>
    </I18nProvider>
  );
};

export default App;
