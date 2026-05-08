import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AD_MESSAGES, WISDOM_QUOTES } from '../constants';
import { useI18n } from './useI18n';
import { TranslationKey } from '../utils/translations';
import IconReports from '../components/icons/IconReports';
import IconSparkles from '../components/icons/IconSparkles';
import IconSettings from '../components/icons/IconSettings';
import IconUpload from '../components/icons/IconUpload';
import IconJournal from '../components/icons/IconJournal';
import IconExchange from '../components/icons/IconExchange';

// Define ad content interface
export interface AdContent {
  title: string;
  message: string;
  icon: React.ReactNode;
  url?: string;
}

const AD_ICONS: Record<string, React.ReactNode> = {
  reports: React.createElement(IconReports, { className: "w-6 h-6" }),
  sparkles: React.createElement(IconSparkles, { className: "w-6 h-6" }),
  settings: React.createElement(IconSettings, { className: "w-6 h-6" }),
  upload: React.createElement(IconUpload, { className: "w-6 h-6" }),
  journal: React.createElement(IconJournal, { className: "w-6 h-6" }),
  exchange: React.createElement(IconExchange, { className: "w-6 h-6" }),
};

export function useAdSystem(isUserLoggedIn: boolean) {
  const { t } = useI18n();
  const [isAdVisible, setIsAdVisible] = useState(false);
  const [adContent, setAdContent] = useState<AdContent | null>(null);
  const adTimerRef = useRef<number | null>(null);

  const showAd = useCallback(() => {
    if (!isUserLoggedIn) return;

    // Combine tip ads and referral ads, with referral ads shown more frequently
    const tipAds = [
        { titleKey: 'ads.insights_title', messageKey: 'ads.insights_message', icon: 'reports' },
        { titleKey: 'ads.wisdom_title', messageKey: 'wisdom', icon: 'sparkles' },
        { titleKey: 'ads.personalize_title', messageKey: 'ads.personalize_message', icon: 'settings' },
        { titleKey: 'ads.did_you_know_title', messageKey: 'ads.did_you_know_message', icon: 'upload' },
        { titleKey: 'ads.consistency_title', messageKey: 'ads.consistency_message', icon: 'journal' },
    ];

    // Referral ads from AD_MESSAGES (indices 5-8)
    const referralAds = AD_MESSAGES.slice(5);

    // 50% chance to show referral ad, 50% for tips
    const showReferral = Math.random() < 0.5;

    if (showReferral && referralAds.length > 0) {
        const randomReferral = referralAds[Math.floor(Math.random() * referralAds.length)];
        setAdContent({
            title: randomReferral.title,
            message: randomReferral.message,
            icon: AD_ICONS[randomReferral.icon] || React.createElement(IconExchange, { className: "w-6 h-6" }),
            url: randomReferral.url
        });
    } else {
        const randomTip = tipAds[Math.floor(Math.random() * tipAds.length)];
        let finalMessage = '';
        if (randomTip.messageKey === 'wisdom') {
            const randomIndex = Math.floor(Math.random() * 10);
            finalMessage = t(`ads.wisdom.${randomIndex}` as TranslationKey);
        } else {
            finalMessage = t(randomTip.messageKey as TranslationKey);
        }

        setAdContent({
            title: t(randomTip.titleKey as TranslationKey),
            message: finalMessage,
            icon: AD_ICONS[randomTip.icon] || React.createElement(IconSparkles, { className: "w-6 h-6" })
        });
    }
    setIsAdVisible(true);
  }, [isUserLoggedIn, t]);

  const resetAdTimer = useCallback(() => {
    // Hide any currently visible ad when activity is detected
    setIsAdVisible(false);

    if (adTimerRef.current) {
      clearTimeout(adTimerRef.current);
    }
    
    if (!isUserLoggedIn) return;

    // Set to 5 minutes
    const AD_INTERVAL = 60 * 1000 * 5;
    adTimerRef.current = window.setTimeout(showAd, AD_INTERVAL);
  }, [showAd, isUserLoggedIn]);

  useEffect(() => {
    resetAdTimer(); // Start/reset on load or login status change

    window.addEventListener('click', resetAdTimer);
    window.addEventListener('keyup', resetAdTimer);

    return () => {
      if (adTimerRef.current) {
        clearTimeout(adTimerRef.current);
      }
      window.removeEventListener('click', resetAdTimer);
      window.removeEventListener('keyup', resetAdTimer);
    };
  }, [resetAdTimer]);

  return {
    isAdVisible,
    adContent,
    closeAd: () => setIsAdVisible(false),
    triggerAd: showAd
  };
}
