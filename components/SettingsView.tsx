import React from 'react';
import { type Theme } from '../types';
import { THEMES_CONFIG } from '../constants';
import { useI18n } from '../hooks/useI18n';
import { TranslationKey } from '../utils/translations';

interface SettingsViewProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentTheme, onThemeChange }) => {
  const { t } = useI18n();
  return (
    <div className="space-y-6 animate-content-entry">
      <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
      
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-white mb-4">{t('settings.appearance_title')}</h2>
        <p className="text-sm text-gray-400 mb-6">{t('settings.appearance_subtitle')}</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {THEMES_CONFIG.map((theme) => {
            const isActive = currentTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`relative p-4 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--accent-primary)] ${
                  isActive
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    : 'bg-white/5 border-[color:var(--glass-border)] hover:bg-white/10 hover:border-white/20'
                }`}
                aria-pressed={isActive}
              >
                <h3 className="font-semibold text-white">{t(`theme.${theme.id}` as TranslationKey)}</h3>
                <div className="flex items-center space-x-2 mt-3">
                  <div className={`w-6 h-6 rounded-full ${theme.colors.background}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.primary}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.secondary}`}></div>
                  <div className={`w-6 h-6 rounded-full ${theme.colors.accent}`}></div>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-[var(--accent-primary)] rounded-full flex items-center justify-center shadow-lg">
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
