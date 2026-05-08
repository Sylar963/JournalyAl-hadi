
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
    <header className="flex-shrink-0 journal-topbar rounded-none z-10">
      <div className="flex min-h-16 items-center gap-3 px-4 py-3 md:h-16 md:px-6 md:py-0">
        <div className="hidden lg:flex flex-col mr-6">
          <span className="journal-kicker">Trading Session Journal</span>
          <span className="text-sm text-[var(--text-muted)]">Review process, behavior, and performance from one workspace.</span>
        </div>

        <div className="relative hidden w-full max-w-xs sm:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="h-5 w-5 text-[var(--text-subtle)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('dashboard.header.search')}
            className="journal-input w-full pl-10 pr-4 py-2 rounded-lg transition text-sm"
          />
        </div>

        <div className="ml-auto flex w-full items-center justify-end gap-1.5 sm:w-auto sm:gap-3 md:gap-4">
          <button
            onClick={onNewEntryClick}
            aria-label={t('dashboard.header.new_entry')}
            className="journal-button-primary flex h-10 min-w-10 items-center justify-center rounded-xl px-2.5 text-xs font-medium leading-tight hover:opacity-95 transition-all duration-200 focus:outline-none sm:px-3 sm:text-sm lg:px-3.5"
          >
            <IconPlus className="h-4 w-4 sm:mr-1.5 lg:mr-2 lg:h-5 lg:w-5" />
            <span className="hidden sm:inline">{t('dashboard.header.new_entry')}</span>
          </button>
          
          <div className="hidden sm:block">
            <Clock />
          </div>
          
          <button id="quests-toggle-button" onClick={onQuestsClick} className="journal-button-secondary flex h-10 w-10 items-center justify-center rounded-full transition-colors" title={t('dashboard.header.quests')}>
            <IconQuest className="w-6 h-6" />
          </button>

          <button onClick={onProfileClick} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--panel-border)] bg-[var(--surface-2)] p-1.5 transition-colors hover:border-[var(--panel-border-strong)] sm:h-auto sm:w-auto sm:justify-start sm:space-x-3">
             <div className="w-9 h-9 bg-[var(--surface-3)] rounded-full flex items-center justify-center font-bold text-[var(--text-main)] overflow-hidden border border-[var(--panel-border-strong)]">
                {userProfile.picture ? (
                    <img src={userProfile.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{getInitials(userProfile.name)}</span>
                )}
             </div>
             <div className='hidden lg:block text-left'>
                <p className="text-sm font-medium text-[var(--text-main)] truncate">{userProfile.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{userProfile.alias}</p>
             </div>
          </button>
          
          <button onClick={onSignOut} title={t('dashboard.sidebar.signout')} className="journal-button-danger flex h-10 w-10 items-center justify-center rounded-full transition-colors">
            <IconLogout className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
