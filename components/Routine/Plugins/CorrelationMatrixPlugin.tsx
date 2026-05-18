import React, { useState, useEffect } from 'react';
import { CorrelationMatrixWidgetData } from '../../../types';
import { getAssetCorrelations } from '../../../services/hyperliquidService';
import { getErrorMessage } from '../../../utils/errorHelpers';

const DEFAULT_BASE_ASSET = 'SP500';
const DEFAULT_TARGET_ASSETS = ['XYZ100', 'BTC'];

const CorrelationMatrixPlugin: React.FC<{ data: CorrelationMatrixWidgetData; onUpdate: (data: CorrelationMatrixWidgetData) => void }> = ({ data }) => {
  const [pairs, setPairs] = useState<{ symbol: string; name: string; correlation: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const baseAsset = data.baseAsset ?? DEFAULT_BASE_ASSET;
  const targetAssets = data.targetAssets ?? DEFAULT_TARGET_ASSETS;

  useEffect(() => {
    getAssetCorrelations(baseAsset, targetAssets).then(nextPairs => {
      setPairs(nextPairs);
      setError(null);
      setLoading(false);
    }).catch((err: unknown) => {
      setError(getErrorMessage(err));
      setLoading(false);
    });
  }, [baseAsset, targetAssets]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-b border-white/5 pb-1">
          <span>Asset</span>
          <span className="text-right">Corr ({baseAsset})</span>
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

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
        <p className="text-sm font-medium text-red-300">Correlation data is unavailable right now.</p>
        <p className="mt-1 text-xs text-red-200/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 border-b border-white/5 pb-1">
         <span>Asset</span>
         <span className="text-right">Corr ({baseAsset})</span>
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
