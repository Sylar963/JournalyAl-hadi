
import React from 'react';
import IconQuest from './icons/IconQuest';
import IconPlus from './icons/IconPlus';
import IconLogout from './icons/IconLogout';
import Clock from './Clock';
import { type UserProfile } from '../types';
import { useI18n } from '../hooks/useI18n';

interface HeaderProps {
    onNewEntryClick: () => void;
    userProfile: UserProfile;
    onProfileClick: () => void;
    onQuestsClick: () => void;
    onSignOut: () => void;
}

const getInitials = (name: string): string => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 0) return '';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const Header: React.FC<HeaderProps> = ({ onNewEntryClick, userProfile, onProfileClick, onQuestsClick, onSignOut }) => {
  const { t } = useI18n();
  return (
    <header className="flex-shrink-0 glass-panel border-b-0 border-t-0 border-l-0 border-r-0 border-b border-[color:var(--glass-border)] rounded-none z-10">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Search */}
        <div className="relative w-full max-w-xs hidden sm:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('dashboard.header.search')}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition text-gray-200 placeholder-gray-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          <button onClick={onNewEntryClick} className="flex items-center justify-center bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--accent-primary)] shadow-[0_0_15px_var(--chart-glow-color-1)]">
            <IconPlus className="w-5 h-5 mr-2 -ml-1" />
            {t('dashboard.header.new_entry')}
          </button>
          
          <Clock />
          
          <button id="quests-toggle-button" onClick={onQuestsClick} className="p-2 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors" title={t('dashboard.header.quests')}>
            <IconQuest className="w-6 h-6" />
          </button>

          <button onClick={onProfileClick} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
             <div className="w-9 h-9 bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)] rounded-full flex items-center justify-center font-bold text-white overflow-hidden shadow-inner">
                {userProfile.picture ? (
                    <img src={userProfile.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{getInitials(userProfile.name)}</span>
                )}
            </div>
            <div className='hidden lg:block text-left'>
                <p className="text-sm font-medium text-white truncate">{userProfile.name}</p>
                <p className="text-xs text-gray-400 truncate">{userProfile.alias}</p>
            </div>
          </button>
          
          <button onClick={onSignOut} title={t('dashboard.sidebar.signout')} className="p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
            <IconLogout className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
