import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AD_MESSAGES, WISDOM_QUOTES } from '../constants';
import { useI18n } from './useI18n';
import { TranslationKey } from '../utils/translations';
import IconReports from '../components/icons/IconReports';
import IconSparkles from '../components/icons/IconSparkles';
import IconSettings from '../components/icons/IconSettings';
import IconUpload from '../components/icons/IconUpload';
import IconJournal from '../components/icons/IconJournal';

// Define ad content interface
export interface AdContent {
  title: string;
  message: string;
  icon: React.ReactNode;
}

const AD_ICONS: Record<string, React.ReactNode> = {
  reports: React.createElement(IconReports, { className: "w-6 h-6" }),
  sparkles: React.createElement(IconSparkles, { className: "w-6 h-6" }),
  settings: React.createElement(IconSettings, { className: "w-6 h-6" }),
  upload: React.createElement(IconUpload, { className: "w-6 h-6" }),
  journal: React.createElement(IconJournal, { className: "w-6 h-6" }),
};

export function useAdSystem(isUserLoggedIn: boolean) {
  const { t } = useI18n();
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [adContent, setAdContent] = useState<AdContent | null>(null);
  const adTimerRef = useRef<number | null>(null);

  const showAd = useCallback(() => {
    if (!isUserLoggedIn) return;

    // Make the wisdom quotes dynamic
    const adPool = [
        { titleKey: 'ads.insights_title', messageKey: 'ads.insights_message', icon: 'reports' },
        { titleKey: 'ads.wisdom_title', messageKey: 'wisdom', icon: 'sparkles' },
        { titleKey: 'ads.personalize_title', messageKey: 'ads.personalize_message', icon: 'settings' },
        { titleKey: 'ads.did_you_know_title', messageKey: 'ads.did_you_know_message', icon: 'upload' },
        { titleKey: 'ads.consistency_title', messageKey: 'ads.consistency_message', icon: 'journal' },
    ];

    const randomAd = adPool[Math.floor(Math.random() * adPool.length)];
    let finalMessage = '';
    if (randomAd.messageKey === 'wisdom') {
        const randomIndex = Math.floor(Math.random() * 10);
        finalMessage = t(`ads.wisdom.${randomIndex}` as TranslationKey);
    } else {
        finalMessage = t(randomAd.messageKey as TranslationKey);
    }

    setAdContent({
      title: t(randomAd.titleKey as TranslationKey),
      message: finalMessage,
      icon: AD_ICONS[randomAd.icon] || React.createElement(IconSparkles, { className: "w-6 h-6" })
    });
    setIsAdVisible(true);
  }, [isUserLoggedIn]);

  const resetAdTimer = useCallback(() => {
    // Hide any currently visible ad when activity is detected
    setIsAdVisible(false);

    if (adTimerRef.current) {
      clearTimeout(adTimerRef.current);
    }
    
    if (!isUserLoggedIn) return;

    // Set to 30 minutes for production
    const AD_INTERVAL = 60 * 1000 * 30;
    adTimerRef.current = window.setTimeout(showAd, AD_INTERVAL);
  }, [showAd, isUserLoggedIn]);

  useEffect(() => {
    resetAdTimer(); // Start/reset on load or login status change

    window.addEventListener('mousedown', resetAdTimer);
    window.addEventListener('keydown', resetAdTimer);

    return () => {
      if (adTimerRef.current) {
        clearTimeout(adTimerRef.current);
      }
      window.removeEventListener('mousedown', resetAdTimer);
      window.removeEventListener('keydown', resetAdTimer);
    };
  }, [resetAdTimer]);

  return {
    isAdVisible,
    adContent,
    closeAd: () => setIsAdVisible(false),
    triggerAd: showAd
  };
}
