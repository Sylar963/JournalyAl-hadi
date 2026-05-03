import React, { useState, useEffect } from 'react';
import { WidgetData } from '../../../types';
import { getAssetCorrelations } from '../../../services/hyperliquidService';

const CorrelationMatrixPlugin: React.FC<{ data: WidgetData; onUpdate: (data: any) => void }> = () => {
  const [pairs, setPairs] = useState<{ symbol: string; name: string; correlation: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAssetCorrelations('ES', ['US500', 'XYZ100', 'BTC']).then(data => {
      setPairs(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-b border-white/5 pb-1">
          <span>Asset</span>
          <span className="text-right">Corr (ES)</span>
          <span className="text-right">Status</span>
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="grid grid-cols-3 gap-2 items-center">
            <div className="h-4 bg-white/10 rounded animate-pulse" />
            <div className="h-4 bg-white/10 rounded animate-pulse ml-auto" />
            <div className="h-1.5 bg-white/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-b border-white/5 pb-1">
         <span>Asset</span>
         <span className="text-right">Corr (ES)</span>
         <span className="text-right">Status</span>
      </div>
      
      {pairs.map(pair => (
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
    title: 'plugin.correlation.title',
    description: 'plugin.correlation.desc',
    defaultSize: { w: 1, h: 2 },
    component: CorrelationMatrixPlugin,
    icon: <span className="text-lg">🔗</span>
};

export default CorrelationMatrixPlugin;
