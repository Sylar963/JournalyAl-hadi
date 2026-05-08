import React, { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';

interface AdPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon: React.ReactNode;
  url?: string;
  bannerImageUrl?: string;
  creativeType?: 'banner' | 'logo';
}

const AdPopup: React.FC<AdPopupProps> = ({ isOpen, onClose, title, message, icon, url, bannerImageUrl, creativeType = 'banner' }) => {
  const { t } = useI18n();
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Use a short delay before showing to ensure the component is mounted and can transition in.
      const timer = setTimeout(() => setIsShowing(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsShowing(false);
    }
  }, [isOpen]);

  // Don't render anything if the parent component doesn't want it to be open.
  if (!isOpen) {
    return null;
  }

  const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  return (
    <div
      role="alert"
      className={`fixed bottom-5 right-5 w-full max-w-sm glass-panel border-[color:var(--glass-border)] rounded-xl shadow-2xl p-4 z-50 transition-all duration-500 ease-in-out ${
        isShowing ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0'
      }`}
    >
      {bannerImageUrl && (
        creativeType === 'logo' ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(6,10,20,0.96),rgba(18,28,45,0.92))] px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Partner Exchange
            </div>
            <div className="flex items-center justify-center rounded-lg bg-white px-4 py-4 shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
              <img
                src={bannerImageUrl}
                alt={`${title} logo`}
                className="block h-16 w-auto max-w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="mb-4 overflow-hidden rounded-lg border border-[color:var(--glass-border)]/60 bg-black/20">
            <img
              src={bannerImageUrl}
              alt={`${title} banner`}
              className="block h-auto w-full"
            />
          </div>
        )
      )}
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 bg-[var(--accent-primary)]/10 rounded-lg flex items-center justify-center text-[var(--accent-primary)] shadow-[0_0_10px_var(--chart-glow-color-1)]">
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-gray-400">{message}</p>
          {url && (
            <button
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              className="mt-2 inline-flex items-center text-sm font-medium text-[var(--accent-primary)] hover:text-white transition-colors cursor-pointer"
            >
              {t('ads.visit_link')}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          aria-label={t('common.dismiss')}
          className="ml-2 flex-shrink-0 text-gray-500 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default AdPopup;
