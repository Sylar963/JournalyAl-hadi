import React from 'react';
import { type Theme } from '../types';
import { THEMES_CONFIG } from '../constants';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange }) => {
  return (
    <div className="space-y-6 animate-content-entry">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      
      <div className="bg-gray-900 p-5 rounded-lg border border-gray-800/50">
        <h2 className="text-lg font-semibold text-white mb-4">Appearance</h2>
        <p className="text-sm text-gray-400 mb-6">Choose a theme to personalize your journal's look and feel.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES_CONFIG.map((theme) => {
            const isActive = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  isActive
                    ? 'border-yellow-400'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                aria-pressed={isActive}
              >
                <h3 className="font-semibold text-white">{theme.label}</h3>
                <div className="flex items-center space-x-2 mt-3">
                  <div className={`w-6 h-6 rounded-full ${theme.colors.background}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.primary}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.secondary}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.accent}`}></div>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
