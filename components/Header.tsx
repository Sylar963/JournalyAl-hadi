import React from 'react';
import IconCalendar from './icons/IconCalendar';
import IconBell from './icons/IconBell';
import IconPlus from './icons/IconPlus';
import IconLogout from './icons/IconLogout';
import { type UserProfile } from '../types';

interface HeaderProps {
    onNewEntryClick: () => void;
    userProfile: UserProfile;
    onProfileClick: () => void;
    onSignOut: () => void;
    onNavigatePast: () => void;
}

const getInitials = (name: string): string => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 0) return '';
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const Header: React.FC<HeaderProps> = ({ onNewEntryClick, userProfile, onProfileClick, onSignOut, onNavigatePast }) => {
  return (
    <header className="flex-shrink-0 bg-gray-900/50 border-b border-gray-800/50 backdrop-blur-sm">
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
            placeholder="Search notes..."
            className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
          <button onClick={onNewEntryClick} className="flex items-center justify-center bg-yellow-600 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500">
            <IconPlus className="w-5 h-5 mr-2 -ml-1" />
            New Entry
          </button>

          <button onClick={onNavigatePast} className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-colors" title="Previous Month">
            <IconCalendar className="w-6 h-6" />
          </button>
          
          <div className="relative">
            <button className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
              <IconBell className="w-6 h-6" />
            </button>
            <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-yellow-400 border-2 border-gray-900"></span>
          </div>

          <button onClick={onProfileClick} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-gray-800/50 transition-colors">
             <div className="w-9 h-9 bg-amber-600 rounded-full flex items-center justify-center font-bold text-white overflow-hidden">
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
          
          <button onClick={onSignOut} title="Sign Out" className="p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors">
            <IconLogout className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;