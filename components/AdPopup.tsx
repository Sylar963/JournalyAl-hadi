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
  creativeType?: 'banner' | 'logo' | 'site-preview';
  previewUrl?: string;
  previewHighlights?: string[];
}

const AdPopup: React.FC<AdPopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  icon,
  url,
  bannerImageUrl,
  creativeType = 'banner',
  previewUrl,
  previewHighlights,
}) => {
  const { t } = useI18n();
  const [isShowing, setIsShowing] = useState(false);
  const previewHost = previewUrl ? (() => {
    try {
      return new URL(previewUrl).hostname.replace(/^www\./, '');
    } catch {
      return previewUrl;
    }
  })() : null;

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
      style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      className={`fixed left-4 right-4 z-50 w-auto max-w-[calc(100vw-2rem)] glass-panel border-[color:var(--glass-border)] rounded-2xl p-4 shadow-2xl transition-all duration-500 ease-out sm:left-auto sm:right-5 sm:w-full sm:max-w-sm ${
        isShowing ? 'translate-x-0 translate-y-0 opacity-100' : 'translate-y-6 opacity-0 sm:translate-x-[110%] sm:translate-y-0'
      }`}
    >
      {(bannerImageUrl || creativeType === 'site-preview') && (
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
        ) : creativeType === 'site-preview' ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-[#d9a441]/30 bg-[linear-gradient(160deg,rgba(10,13,22,0.98),rgba(20,27,40,0.96))] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
            <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0a0f18]">
              <div className="flex items-center gap-2 border-b border-white/10 bg-[#121926] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#f7b955]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#4cd38a]" />
                <div className="ml-2 flex-1 rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-slate-400">
                  {previewHost}
                </div>
              </div>
              <div className="space-y-3 bg-[radial-gradient(circle_at_top_right,rgba(217,164,65,0.16),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))] p-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#d9a441]">
                    Funded Account
                  </div>
                  <div className="mt-1 text-lg font-semibold leading-tight text-white">
                    1x Profit Boost
                  </div>
                  <div className="mt-1 text-xs text-slate-300">
                    Start from 1k ABC, be profitable, and earn more ABCs.
                  </div>
                </div>
                {previewHighlights && previewHighlights.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {previewHighlights.map((highlight) => (
                      <span
                        key={highlight}
                        className="rounded-full border border-[#d9a441]/30 bg-[#d9a441]/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-[#f6d28d]"
                      >
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 overflow-hidden rounded-xl border border-[color:var(--glass-border)]/60 bg-[linear-gradient(160deg,rgba(7,17,26,0.96),rgba(16,30,45,0.92))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
            <div className="flex h-40 items-center justify-center rounded-lg bg-black/20 px-3 py-2">
              <img
                src={bannerImageUrl}
                alt={`${title} banner`}
                className="block max-h-full w-full object-contain"
              />
            </div>
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
