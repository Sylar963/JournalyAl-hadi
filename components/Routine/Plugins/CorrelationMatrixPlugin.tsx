import React from 'react';
import { WidgetData } from '../../../types';

// Hardcoded examples as requested
const PAIRS = [
  { symbol: 'ES', name: 'E-Mini S&P', correlation: 1.0 },
  { symbol: 'NQ', name: 'Nasdaq 100', correlation: 0.92 },
  { symbol: 'BTC', name: 'Bitcoin', correlation: 0.45 },
  { symbol: 'ZB', name: 'T-Bond', correlation: -0.32 },
];

const CorrelationMatrixPlugin: React.FC<{ data: WidgetData; onUpdate: (data: any) => void }> = () => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-b border-white/5 pb-1">
         <span>Asset</span>
         <span className="text-right">Corr (ES)</span>
         <span className="text-right">Status</span>
      </div>
      
      {PAIRS.map(pair => (
        <div key={pair.symbol} className="grid grid-cols-3 gap-2 items-center text-sm">
          <div className="font-bold text-white/90">{pair.symbol}</div>
          <div className={`text-right ${pair.correlation > 0.8 ? 'text-green-400' : pair.correlation < -0.3 ? 'text-red-400' : 'text-gray-400'}`}>
            {pair.correlation.toFixed(2)}
          </div>
          <div className="text-right">
             <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full ${pair.correlation > 0 ? 'bg-blue-500' : 'bg-orange-500'}`} 
                  style={{ width: `${Math.abs(pair.correlation) * 100}%` }}
                />
             </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const correlationMatrixConfig = {
    id: 'correlation-matrix',
    title: 'Correlation Matrix',
    description: 'Real-time correlation with ES',
    defaultSize: { w: 1, h: 2 },
    component: CorrelationMatrixPlugin,
    icon: <span className="text-lg">🔗</span>
};

export default CorrelationMatrixPlugin;
