import React, { useState, useEffect, useRef } from 'react';
import IconJournal from './icons/IconJournal';
import IconTrends from './icons/IconTrends';
import IconReports from './icons/IconReports';
import IconHistory from './icons/IconHistory';
import IconSettings from './icons/IconSettings';
import IconPlus from './icons/IconPlus';
import IconChevronsLeft from './icons/IconChevronsLeft';
import { type ActiveView, type EmotionType, type UserProfile } from '../types';
import { WISDOM_QUOTES } from '../constants';

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
    className={`flex items-center w-full py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isCollapsed ? 'justify-center px-2' : 'px-4'} ${
      active
        ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[0_0_10px_rgba(6,182,212,0.1)]'
        : disabled 
        ? 'text-gray-600 cursor-not-allowed'
        : 'text-gray-400 hover:bg-white/5 hover:text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.05)]'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    {icon}
    {!isCollapsed && <span className="ml-3 whitespace-nowrap">{label}</span>}
  </button>
);

const QuickActionItem: React.FC<{ icon: React.ReactNode; label: string, onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-gray-200 rounded-lg transition-colors duration-200">
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
    <div className={`hidden md:flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} glass-panel border-r-0 border-t-0 border-b-0 border-l-0 border-r border-[color:var(--glass-border)] p-4 transition-all duration-300 ease-in-out z-20`}>
      <div className="flex items-center mb-8">
        <div className="w-8 h-8 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-lg flex-shrink-0 shadow-[0_0_15px_var(--accent-primary)]"></div>
        {!isCollapsed && <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 ml-3 whitespace-nowrap tracking-tight">Emotion Journal</h1>}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {!isCollapsed && <h2 className="px-4 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Main Navigation</h2>}
        <nav className="space-y-1">
          <NavItem 
            icon={<IconJournal className="w-5 h-5" />} 
            label="Journal" 
            active={activeView === 'journal'} 
            onClick={() => onNavigate('journal')} 
            isCollapsed={isCollapsed} 
          />
          <NavItem 
            icon={<IconTrends className="w-5 h-5" />} 
            label="Trends" 
            active={activeView === 'trends'} 
            onClick={() => onNavigate('trends')} 
            isCollapsed={isCollapsed} 
          />
          <NavItem 
            icon={<IconReports className="w-5 h-5" />} 
            label="Reports" 
            active={activeView === 'reports'} 
            onClick={() => onNavigate('reports')} 
            isCollapsed={isCollapsed} 
          />
          <NavItem 
            icon={<IconHistory className="w-5 h-5" />} 
            label="History" 
            active={activeView === 'history'} 
            onClick={() => onNavigate('history')} 
            isCollapsed={isCollapsed} 
          />
          <NavItem 
            icon={<IconSettings className="w-5 h-5" />} 
            label="Settings" 
            active={activeView === 'settings'} 
            onClick={() => onNavigate('settings')} 
            isCollapsed={isCollapsed} 
          />
        </nav>
        
        {!isCollapsed && (
          <>
            <h2 className="px-4 mt-8 mb-2 text-xs font-semibold tracking-wider text-gray-500 uppercase">Quick Actions</h2>
            <nav className="space-y-1">
                <QuickActionItem icon={<IconPlus className="w-5 h-5 text-[var(--accent-primary)]"/>} label="Log Happy" onClick={() => onNewEntryClick('happy')} />
                <QuickActionItem icon={<IconPlus className="w-5 h-5 text-blue-300"/>} label="Log Calm" onClick={() => onNewEntryClick('calm')} />
                <QuickActionItem icon={<IconPlus className="w-5 h-5 text-red-400"/>} label="Log Angry" onClick={() => onNewEntryClick('angry')} />
            </nav>
          </>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-[color:var(--glass-border)] space-y-4">
        {!isCollapsed && (
          <div 
            className="bg-white/5 p-4 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <h3 className="font-semibold text-white text-sm">My Journal's Purpose</h3>
            <div className="h-24 flex items-center justify-center">
              {isEditingPurpose ? (
                <textarea
                  value={purposeText}
                  onChange={(e) => setPurposeText(e.target.value)}
                  className="mt-2 w-full bg-black/40 border border-[color:var(--glass-border)] text-sm text-gray-300 p-2 rounded-md focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition resize-none"
                  rows={4}
                  aria-label="Edit journal purpose"
                  autoFocus
                />
              ) : showQuotes ? (
                <p key={currentQuoteIndex} className="text-sm text-gray-400 italic text-center animate-fade-in">
                  "{WISDOM_QUOTES[currentQuoteIndex]}"
                </p>
              ) : (
                <p className="text-sm text-gray-400 mt-1 italic text-center">
                  {purposeText || "Click 'Edit' to set your journal's purpose."}
                </p>
              )}
            </div>
            <div className="mt-3">
              {isEditingPurpose ? (
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleSaveClick}
                    className="flex-1 bg-[var(--accent-primary)] text-white py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-[var(--chart-glow-color-1)]"
                  >
                    Save
                  </button>
                  <button 
                    onClick={handleCancelClick}
                    className="flex-1 bg-white/10 text-white py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleEditClick}
                  className="w-full bg-white/10 text-white py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors border border-white/5"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        )}
         <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center w-full p-2 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <IconChevronsLeft className={`w-5 h-5 transition-transform duration-300 ${isCollapsed && 'rotate-180'}`} />
          {!isCollapsed && <span className="ml-2 text-sm font-medium">Collapse</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;