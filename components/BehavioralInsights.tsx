import React from 'react';
import { RiskPrediction } from '../services/behaviorLearner';

interface BehavioralInsightsProps {
  prediction: RiskPrediction | undefined;
  isLoading?: boolean;
}

export const BehavioralInsights: React.FC<BehavioralInsightsProps> = ({ prediction, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-bg-secondary p-6 rounded-2xl border border-white/5 animate-pulse">
        <div className="h-6 w-1/3 bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-white/5 rounded"></div>
          <div className="h-4 w-5/6 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const isHighRisk = prediction.riskScore >= 70;

  return (
    <div className={`p-6 rounded-2xl border relative overflow-hidden transition-colors ${
      isHighRisk 
        ? 'bg-red-500/10 border-red-500/20' 
        : 'bg-bg-secondary border-white/5'
    }`}>
      
      {/* Background Icon */}
      <div className={`absolute -right-4 -top-4 opacity-5 ${isHighRisk ? 'text-red-500' : 'text-primary'}`}>
        <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg ${isHighRisk ? 'bg-red-500/20 text-red-400' : 'bg-primary/20 text-primary'}`}>
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
             <path d="M2 12h4l2-9 5 18 3-10h4"/>
           </svg>
        </div>
        <h3 className="text-lg font-heading font-medium text-white">AI Behavioral Coach</h3>
      </div>

      <div className="space-y-4 relative z-10">
        <div>
          <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-1">Current Assessment</h4>
          <p className="text-gray-300 text-sm leading-relaxed">{prediction.prediction}</p>
        </div>

        <div className={`p-4 rounded-xl ${isHighRisk ? 'bg-red-500/10 border border-red-500/20 text-red-200' : 'bg-white/5 border border-white/5 text-gray-300'}`}>
          <div className="flex items-start gap-3">
             <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <circle cx="12" cy="12" r="10"/>
               <line x1="12" y1="16" x2="12" y2="12"/>
               <line x1="12" y1="8" x2="12.01" y2="8"/>
             </svg>
             <p className="text-sm font-medium">{prediction.advice}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
