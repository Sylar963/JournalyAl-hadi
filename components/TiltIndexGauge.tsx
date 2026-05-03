import React from 'react';
import { TiltMetrics } from '../types';

interface TiltIndexGaugeProps {
  metrics: TiltMetrics | undefined;
}

export const TiltIndexGauge: React.FC<TiltIndexGaugeProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="bg-bg-secondary p-6 rounded-2xl border border-white/5 flex items-center justify-center h-48">
        <p className="text-gray-400 font-mono text-sm">Waiting for sufficient data...</p>
      </div>
    );
  }

  const { score, riskLevel, triggers } = metrics;
  
  // Calculate stroke dash array for the gauge arc
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  // Arc is half a circle
  const arcLength = circumference / 2;
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  const getColor = (level: string) => {
    switch(level) {
      case 'low': return 'text-green-500';
      case 'moderate': return 'text-yellow-500';
      case 'high': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStrokeColor = (level: string) => {
    switch(level) {
      case 'low': return 'stroke-green-500';
      case 'moderate': return 'stroke-yellow-500';
      case 'high': return 'stroke-orange-500';
      case 'critical': return 'stroke-red-500';
      default: return 'stroke-gray-500';
    }
  };

  return (
    <div className="bg-bg-secondary p-6 rounded-2xl border border-white/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      </div>

      <h3 className="text-lg font-heading font-medium text-white mb-6">Tilt Index</h3>
      
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Gauge Visual */}
        <div className="relative w-40 h-24 overflow-hidden flex-shrink-0">
          <svg className="w-full h-[200%] transform origin-bottom" viewBox="0 0 140 140">
             {/* Background Arc */}
             <circle 
               cx="70" cy="70" r={radius} 
               fill="none" 
               className="stroke-white/10" 
               strokeWidth="12" 
               strokeLinecap="round"
               strokeDasharray={`${arcLength} ${circumference}`}
               strokeDashoffset={0}
               transform="rotate(180 70 70)"
             />
             {/* Value Arc */}
             <circle 
               cx="70" cy="70" r={radius} 
               fill="none" 
               className={`${getStrokeColor(riskLevel)} transition-all duration-1000 ease-out`} 
               strokeWidth="12" 
               strokeLinecap="round"
               strokeDasharray={`${arcLength} ${circumference}`}
               strokeDashoffset={strokeDashoffset}
               transform="rotate(180 70 70)"
             />
          </svg>
          <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pb-2">
            <span className="text-3xl font-mono font-bold text-white">{score}</span>
            <span className={`text-xs font-medium uppercase tracking-wider ${getColor(riskLevel)}`}>
              {riskLevel} RISK
            </span>
          </div>
        </div>

        {/* Triggers & Info */}
        <div className="flex-1 w-full">
          {triggers.length > 0 ? (
            <div>
               <h4 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Detected Triggers</h4>
               <ul className="space-y-2">
                 {triggers.map((trigger, i) => (
                   <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                     <span className="text-red-500 mt-0.5">•</span>
                     <span>{trigger}</span>
                   </li>
                 ))}
               </ul>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-gray-400 text-sm">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                 <polyline points="22 4 12 14.01 9 11.01"/>
               </svg>
               No negative behavioral markers detected. Maintain discipline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
