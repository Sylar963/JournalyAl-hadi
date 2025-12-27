import React, { useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import IconChevronRight from '../icons/IconChevronRight'; // Reusing existing icons
import RoutineDashboard from './RoutineDashboard';

const PreMarketRoutine: React.FC = () => {
  const { t } = useI18n(); // Assuming translations exist, or fallback
  const [isFolded, setIsFolded] = useState(true);

  // Hardcoded date for header for now, or pass as prop
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className={`rounded-2xl glass-panel p-4 md:p-6 mb-6 transition-all duration-500 ease-in-out`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
             <div className="h-10 w-1 bg-gradient-to-b from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full"></div>
             <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Pre-Market Routine</h2>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{dateStr}</p>
             </div>
        </div>

        <div className="flex items-center space-x-4">
           {/* Progress Indicator (Mock) */}
           <div className="hidden md:flex items-center space-x-2 text-sm text-gray-400">
              <span>Status:</span>
              <span className="text-orange-400 font-bold">Pending</span>
           </div>

           <button
             onClick={() => setIsFolded(!isFolded)}
             className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white flex items-center group"
           >
             <span className="mr-2">{isFolded ? 'Unfold' : 'Fold'}</span>
             <IconChevronRight className={`w-4 h-4 transition-transform duration-300 ${isFolded ? 'rotate-90' : '-rotate-90'}`} />
           </button>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFolded ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100 mt-6'}`}>
          <div className="border-t border-white/5 pt-6">
             <RoutineDashboard />
          </div>
      </div>
    </div>
  );
};

export default PreMarketRoutine;
