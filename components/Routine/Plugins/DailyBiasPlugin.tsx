import React, { useEffect, useState } from 'react';
import { DailyBiasWidgetData } from '../../../types';

const DailyBiasPlugin: React.FC<{ data: DailyBiasWidgetData; onUpdate: (data: DailyBiasWidgetData) => void }> = ({ data, onUpdate }) => {
  const [view, setView] = useState<BiasView>(data.view ?? 'daily');
  const [dailyBias, setDailyBias] = useState<BiasDirection>(data.dailyBias ?? 'neutral');
  const [dailyNotes, setDailyNotes] = useState(data.dailyNotes ?? '');
  const [weeklyBias, setWeeklyBias] = useState<BiasDirection>(data.weeklyBias ?? 'neutral');
  const [weeklyNotes, setWeeklyNotes] = useState(data.weeklyNotes ?? '');

  useEffect(() => {
    setView(data.view ?? 'daily');
    setDailyBias(data.dailyBias ?? 'neutral');
    setDailyNotes(data.dailyNotes ?? '');
    setWeeklyBias(data.weeklyBias ?? 'neutral');
    setWeeklyNotes(data.weeklyNotes ?? '');
  }, [data.view, data.dailyBias, data.dailyNotes, data.weeklyBias, data.weeklyNotes]);

  const syncData = (nextData: Partial<DailyBiasWidgetData>) => {
    onUpdate({
      view,
      dailyBias,
      dailyNotes,
      weeklyBias,
      weeklyNotes,
      ...nextData,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex bg-black/20 p-1 rounded-lg mb-3">
        {(['daily', 'weekly'] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              syncData({ view: v });
            }}
            className={`flex-1 text-xs py-1 rounded-md font-medium capitalize transition-all ${
              view === v 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
         {(['bullish', 'neutral', 'bearish'] as const).map((b) => (
            <button
              key={b}
              onClick={() => {
                if (view === 'daily') {
                  setDailyBias(b);
                  syncData({ dailyBias: b });
                } else {
                  setWeeklyBias(b);
                  syncData({ weeklyBias: b });
                }
              }}
              className={`border border-white/5 rounded-lg py-2 flex flex-col items-center justify-center transition-all ${
                 (view === 'daily' ? dailyBias : weeklyBias) === b
                   ? b === 'bullish' ? 'bg-green-500/20 border-green-500/50 text-green-400'
                   : b === 'bearish' ? 'bg-red-500/20 border-red-500/50 text-red-400'
                   : 'bg-gray-500/20 border-gray-500/50 text-gray-300'
                   : 'hover:bg-white/5 text-gray-500'
              }`}
            >
               <span className="text-lg mb-1">
                 {b === 'bullish' ? '🚀' : b === 'bearish' ? '🐻' : '⚖️'}
               </span>
               <span className="text-[10px] uppercase font-bold tracking-wider">{b}</span>
            </button>
         ))}
      </div>

      <textarea
        className="flex-grow bg-black/20 border border-white/5 rounded-lg p-3 text-sm text-gray-300 resize-none focus:outline-none focus:border-white/20 placeholder-gray-600"
        placeholder={`Write your ${view} market thesis...`}
        value={view === 'daily' ? dailyNotes : weeklyNotes}
        onChange={(e) => {
          const nextNotes = e.target.value;
          if (view === 'daily') {
            setDailyNotes(nextNotes);
            syncData({ dailyNotes: nextNotes });
          } else {
            setWeeklyNotes(nextNotes);
            syncData({ weeklyNotes: nextNotes });
          }
        }}
      />
    </div>
  );
};

export const dailyBiasConfig = {
    id: 'daily-bias',
    title: 'plugin.bias.title',
    description: 'plugin.bias.desc',
    defaultSize: { w: 1, h: 2 },
    component: DailyBiasPlugin,
    icon: <span className="text-lg">🧭</span>
};

export default DailyBiasPlugin;
