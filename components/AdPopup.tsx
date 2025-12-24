import React, { useState, useEffect } from 'react';

interface AdPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon: React.ReactNode;
}

const AdPopup: React.FC<AdPopupProps> = ({ isOpen, onClose, title, message, icon }) => {
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
      <div className="flex items-start">
        <div className="flex-shrink-0 w-10 h-10 bg-[var(--accent-primary)]/10 rounded-lg flex items-center justify-center text-[var(--accent-primary)] shadow-[0_0_10px_var(--chart-glow-color-1)]">
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-base font-semibold text-white">{title}</p>
          <p className="mt-1 text-sm text-gray-400">{message}</p>
        </div>
        <button
          onClick={onClose}
          aria-label="Dismiss"
          className="ml-2 flex-shrink-0 text-gray-500 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
      </div>
    </div>
  );
};

export default AdPopup;