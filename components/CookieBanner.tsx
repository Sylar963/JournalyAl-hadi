
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsent } from '../hooks/useConsent';

const CookieBanner: React.FC = () => {
  const { hasConsented, saveConsent } = useConsent();
  const [showDetails, setShowDetails] = useState(false);
  
  // Local state for toggles in the details view
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  if (hasConsented) return null;

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false
    });
  };

  const handleSavePreferences = () => {
    saveConsent({
      essential: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 flex justify-center pointer-events-none">
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel w-full max-w-4xl rounded-xl p-6 pointer-events-auto shadow-2xl border border-white/10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="relative z-10">
          {!showDetails ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold text-white">We value your privacy</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                 <button 
                  onClick={() => setShowDetails(true)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Customize
                </button>
                <button 
                  onClick={handleRejectAll}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                >
                  Reject All
                </button>
                <button 
                  onClick={handleAcceptAll}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-black bg-white hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  Accept All
                </button>
              </div>
            </div>
          ) : (
             <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Cookie Preferences</h3>
                <button 
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Back
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div>
                    <div className="font-medium text-white">Essential</div>
                    <div className="text-xs text-gray-400">Required for the website to function.</div>
                  </div>
                  <div className="text-xs text-green-400 font-medium px-2 py-1 bg-green-400/10 rounded">Always Active</div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div>
                    <div className="font-medium text-white">Analytics</div>
                    <div className="text-xs text-gray-400">Help us improve our website by collecting usage data.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                  <div>
                    <div className="font-medium text-white">Marketing</div>
                    <div className="text-xs text-gray-400">Used to display personalized advertisements.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={marketingEnabled}
                      onChange={(e) => setMarketingEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/10">
                 <button 
                  onClick={handleSavePreferences}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-black bg-white hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                >
                  Save Preferences
                </button>
              </div>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CookieBanner;
