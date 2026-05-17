import React, { useState, useEffect, useRef } from 'react';
import IconJournal from './icons/IconJournal';
import IconTrends from './icons/IconTrends';
import IconReports from './icons/IconReports';
import IconHistory from './icons/IconHistory';
import IconSettings from './icons/IconSettings';
import IconPlus from './icons/IconPlus';
import IconQuest from './icons/IconQuest';
import IconChevronsLeft from './icons/IconChevronsLeft';
import { type ActiveView, type EmotionType, type UserProfile } from '../types';
import { WISDOM_QUOTES } from '../constants';
import { useI18n } from '../hooks/useI18n';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isCollapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, disabled, isCollapsed }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={isCollapsed ? label : undefined}
    aria-label={label}
    className={`flex items-center w-full py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center px-2' : 'px-4'} ${
      active
        ? 'bg-[var(--surface-3)] text-[var(--text-main)] border border-[var(--panel-border-strong)]'
        : disabled 
        ? 'text-gray-600 cursor-not-allowed'
        : 'text-[var(--text-muted)] border border-transparent hover:bg-[var(--surface-2)] hover:text-[var(--text-main)] hover:border-[var(--panel-border)]'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    {icon}
    {!isCollapsed && <span className="ml-3 whitespace-nowrap">{label}</span>}
  </button>
);

const QuickActionItem: React.FC<{ icon: React.ReactNode; label: string, onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-main)] rounded-lg border border-transparent hover:border-[var(--panel-border)] transition-colors duration-200">
        {icon}
        <span className="ml-3">{label}</span>
    </button>
);

interface SidebarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onNewEntryClick: (emotion: EmotionType) => void;
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onNewEntryClick, userProfile, onSaveProfile }) => {
  const { t, language, setLanguage } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditingPurpose, setIsEditingPurpose] = useState(false);
  const [purposeText, setPurposeText] = useState(userProfile.journalPurpose || '');
  
  const [showQuotes, setShowQuotes] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const inactivityTimerRef = useRef<number | null>(null);
  const quoteIntervalRef = useRef<number | null>(null);

  const stopTimers = () => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
  };

  const resetInactivityTimer = () => {
    stopTimers();
    inactivityTimerRef.current = window.setTimeout(() => {
      setShowQuotes(true);
    }, 15000); // 15 seconds
  };
  
  useEffect(() => {
    resetInactivityTimer();
    return () => stopTimers();
  }, []);
  
  useEffect(() => {
    if (showQuotes && !isEditingPurpose) {
      quoteIntervalRef.current = window.setInterval(() => {
        setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % WISDOM_QUOTES.length);
      }, 7000); // 7 seconds per quote
    } else {
      stopTimers();
    }
    return () => {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
    };
  }, [showQuotes, isEditingPurpose]);

  useEffect(() => {
    if (!isEditingPurpose) {
      setPurposeText(userProfile.journalPurpose || '');
    }
  }, [userProfile.journalPurpose, isEditingPurpose]);

  const handleEditClick = () => {
    stopTimers();
    setShowQuotes(false);
    setIsEditingPurpose(true);
  };

  const handleCancelClick = () => {
    setIsEditingPurpose(false);
    setPurposeText(userProfile.journalPurpose || '');
    resetInactivityTimer();
  };

  const handleSaveClick = () => {
    onSaveProfile({ ...userProfile, journalPurpose: purposeText });
    setIsEditingPurpose(false);
    resetInactivityTimer();
  };

  const handleMouseEnter = () => {
    if (isEditingPurpose) return;
    stopTimers();
    setShowQuotes(false);
  };

  const handleMouseLeave = () => {
    if (isEditingPurpose) return;
    resetInactivityTimer();
  };

  return (
    <div className={`hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'w-72'} journal-sidebar p-4 transition-all duration-300 ease-in-out z-20`}>
      <div className="flex items-center mb-8 rounded-xl journal-panel-muted px-3 py-3">
        <div className="w-9 h-9 bg-[var(--surface-3)] rounded-lg flex-shrink-0 border border-[var(--panel-border-strong)] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--accent-primary)]">
            <path d="M12 4L3 20H21L12 4Z" />
          </svg>
        </div>
        {!isCollapsed && (
          <div className="ml-3 min-w-0">
            <p className="journal-kicker">Automated Review</p>
            <h1 className="text-base font-semibold text-[var(--text-main)] whitespace-nowrap tracking-[0.01em]">Delta Journal</h1>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {!isCollapsed && <h2 className="px-4 mb-3 journal-kicker">{t('dashboard.nav_title')}</h2>}
        <nav className="space-y-1">
          <NavItem 
            icon={<IconJournal className="w-5 h-5" />} 
            label={t('dashboard.sidebar.journal')} 
            active={activeView === 'journal'} 
            onClick={() => onNavigate('journal')} 
            isCollapsed={isCollapsed} 
          />
          <NavItem 
            icon={<IconTrends className="w-5 h-5" />} 
            label={t('dashboard.sidebar.trends')} 
            active={activeView === 'trends'} 
            onClick={() => onNavigate('trends')} 
            isCollapsed={isCollapsed} 
          />
          <NavItem 
            icon={<IconReports className="w-5 h-5" />} 
            label={t('dashboard.sidebar.reports')} 
            active={activeView === 'reports'} 
            onClick={() => onNavigate('reports')} 
            isCollapsed={isCollapsed} 
          />
          <NavItem
            icon={<IconHistory className="w-5 h-5" />}
            label={t('dashboard.sidebar.history')}
            active={activeView === 'history'}
            onClick={() => onNavigate('history')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<IconQuest className="w-5 h-5" />}
            label={t('dashboard.sidebar.review')}
            active={activeView === 'review'}
            onClick={() => onNavigate('review')}
            isCollapsed={isCollapsed}
          />
          <NavItem
            icon={<IconSettings className="w-5 h-5" />}
            label={t('dashboard.sidebar.settings')}
            active={activeView === 'settings'}
            onClick={() => onNavigate('settings')}
            isCollapsed={isCollapsed}
          />
        </nav>
        
        {!isCollapsed && (
          <>
            <h2 className="px-4 mt-8 mb-3 journal-kicker">{t('dashboard.sidebar.quick_actions')}</h2>
            <nav className="space-y-1">
                <QuickActionItem icon={<IconPlus className="w-5 h-5 text-[var(--accent-primary)]"/>} label={t('dashboard.sidebar.log_confident')} onClick={() => onNewEntryClick('confident')} />
                <QuickActionItem icon={<IconPlus className="w-5 h-5 text-blue-300"/>} label={t('dashboard.sidebar.log_composed')} onClick={() => onNewEntryClick('composed')} />
                <QuickActionItem icon={<IconPlus className="w-5 h-5 text-red-400"/>} label={t('dashboard.sidebar.log_frustrated')} onClick={() => onNewEntryClick('frustrated')} />
            </nav>
          </>
        )}
      </div>

      <div className="mt-auto pt-4 border-t journal-divider space-y-4">
        {!isCollapsed && (
          <div 
            className="journal-panel p-4 rounded-xl"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="journal-kicker">Journal Focus</p>
                <h3 className="font-semibold text-[var(--text-main)] text-sm mt-1">{t('dashboard.sidebar.purpose_title')}</h3>
              </div>
            </div>
            <div className="h-24 flex items-center justify-center">
              {isEditingPurpose ? (
                <textarea
                  value={purposeText}
                  onChange={(e) => setPurposeText(e.target.value)}
                  className="journal-input mt-2 w-full text-sm p-2 rounded-md transition resize-none"
                  rows={4}
                  aria-label="Edit journal purpose"
                  autoFocus
                />
              ) : showQuotes ? (
                <p key={currentQuoteIndex} className="text-sm text-[var(--text-muted)] italic text-center animate-fade-in">
                  "{WISDOM_QUOTES[currentQuoteIndex]}"
                </p>
              ) : (
                <p className="text-sm text-[var(--text-muted)] mt-1 italic text-center">
                  {purposeText || t('dashboard.sidebar.purpose_placeholder')}
                </p>
              )}
            </div>
            <div className="mt-3">
              {isEditingPurpose ? (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleSaveClick}
                    className="flex-1 journal-button-primary py-2 rounded-lg text-sm font-medium hover:opacity-95 transition-all"
                  >
                    {t('common.save')}
                  </button>
                  <button 
                    onClick={handleCancelClick}
                    className="flex-1 journal-button-secondary py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleEditClick}
                  className="w-full journal-button-secondary py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {t('dashboard.sidebar.edit')}
                </button>
              )}
            </div>
          </div>
        )}
         <div className="flex flex-col gap-2">
           {!isCollapsed && (
              <button 
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="flex items-center w-full p-2.5 text-xs font-mono text-[var(--text-subtle)] hover:bg-[var(--surface-2)] hover:text-[var(--text-main)] rounded-lg transition-all border border-[var(--panel-border)] group journal-metric"
              >
                <span className="mr-auto">LANGUAGE</span>
                <div className="flex items-center gap-2">
                  <span className={language === 'en' ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-subtle)]'}>EN</span>
                  <span className="text-[var(--text-subtle)]">/</span>
                  <span className={language === 'es' ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-subtle)]'}>ES</span>
                </div>
              </button>
           )}
           <button
             onClick={() => setIsCollapsed(!isCollapsed)}
            className={`flex items-center w-full p-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-main)] rounded-lg transition-colors border border-transparent hover:border-[var(--panel-border)] ${isCollapsed ? 'justify-center' : ''}`}
             title={isCollapsed ? t('dashboard.sidebar.expand') : t('dashboard.sidebar.collapse')}
           >
             <IconChevronsLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed && 'rotate-180'}`} />
            {!isCollapsed && <span className="ml-2 text-sm font-medium">{t('dashboard.sidebar.collapse')}</span>}
          </button>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
