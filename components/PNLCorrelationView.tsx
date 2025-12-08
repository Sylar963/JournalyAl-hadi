import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ScatterController
} from 'chart.js';
import { Scatter, Bar, Line } from 'react-chartjs-2';
import { type EmotionEntry, type EmotionType } from '../types';
import { EMOTIONS_CONFIG } from '../constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ScatterController,
  Title,
  Tooltip,
  Legend
);

interface PNLCorrelationViewProps {
  entries: EmotionEntry[];
}

const PNLCorrelationView: React.FC<PNLCorrelationViewProps> = ({ entries }) => {
    
    // Filter entries that have PNL data
    const entriesWithPNL = useMemo(() => {
        return entries.filter(e => e.pnl !== undefined && e.pnl !== null);
    }, [entries]);

    const stats = useMemo(() => {
        let totalPNL = 0;
        let winDays = 0;
        let lossDays = 0;
        let totalTrades = 0;

        entriesWithPNL.forEach(e => {
            const val = e.pnl || 0;
            totalPNL += val;
            if (val > 0) winDays++;
            if (val < 0) lossDays++;
            if (e.tradingData?.trades) {
                totalTrades += e.tradingData.trades.length;
            }
        });

        return {
            totalPNL: totalPNL.toFixed(2),
            winRate: entriesWithPNL.length > 0 ? Math.round((winDays / entriesWithPNL.length) * 100) : 0,
            avgPNL: entriesWithPNL.length > 0 ? (totalPNL / entriesWithPNL.length).toFixed(2) : '0.00',
            totalTrades
        };
    }, [entriesWithPNL]);


    // 1. Emotional Alpha (Scatter: Intensity vs PNL)
    const emotionalAlphaData = useMemo(() => {
        const dataPoints = entriesWithPNL.map(e => ({
            x: e.intensity,
            y: e.pnl
        }));

        return {
            datasets: [{
                label: 'PNL vs Intensity',
                data: dataPoints,
                backgroundColor: entriesWithPNL.map(e => {
                    return e.pnl && e.pnl > 0 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(248, 113, 113, 0.6)';
                }),
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };
    }, [entriesWithPNL]);

    const scatterOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Emotional Alpha (Intensity vs PNL)', color: '#9ca3af' },
        },
        scales: {
            x: {
                title: { display: true, text: 'Emotion Intensity (1-10)', color: '#6b7280' },
                min: 0,
                max: 11,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af' }
            },
            y: {
                title: { display: true, text: 'Daily PNL ($)', color: '#6b7280' },
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af' }
            }
        }
    };


    // 2. Average PNL by Emotion (Bar Chart)
    const pnlByEmotionData = useMemo(() => {
        const emotionKeys = Object.keys(EMOTIONS_CONFIG) as EmotionType[];
        const grouped: Record<string, { total: number, count: number }> = {};

        emotionKeys.forEach(k => grouped[k] = { total: 0, count: 0 });

        entriesWithPNL.forEach(e => {
            if (grouped[e.emotion]) {
                grouped[e.emotion].total += (e.pnl || 0);
                grouped[e.emotion].count += 1;
            }
        });

        const labels = emotionKeys.map(k => EMOTIONS_CONFIG[k].label);
        const data = emotionKeys.map(k => {
            const g = grouped[k];
            return g.count > 0 ? g.total / g.count : 0;
        });

        return {
            labels,
            datasets: [{
                label: 'Avg PNL',
                data,
                backgroundColor: data.map(val => val >= 0 ? 'rgba(74, 222, 128, 0.5)' : 'rgba(248, 113, 113, 0.5)'),
                borderColor: data.map(val => val >= 0 ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)'),
                borderWidth: 1
            }]
        };
    }, [entriesWithPNL]);

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Avg PNL by Emotion', color: '#9ca3af' }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' }
            }
        }
    };

    // 3. Equity Curve (Line Chart)
    const equityCurveData = useMemo(() => {
        const sorted = [...entriesWithPNL].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningTotal = 0;
        const dataPoints = sorted.map(e => {
            runningTotal += (e.pnl || 0);
            return runningTotal;
        });
        const labels = sorted.map(e => new Date(e.date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));

        return {
            labels,
            datasets: [{
                label: 'Cumulative PNL',
                data: dataPoints,
                borderColor: 'rgba(96, 165, 250, 1)',
                backgroundColor: 'rgba(96, 165, 250, 0.1)',
                tension: 0.2,
                fill: true
            }]
        };
    }, [entriesWithPNL]);

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Equity Curve', color: '#9ca3af' }
        },
        scales: {
            y: {
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' }
            }
        }
    };


    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 rounded-xl">
                    <h4 className="text-xs text-gray-400 font-medium uppercase">Total PNL</h4>
                    <p className={`text-2xl font-bold mt-1 ${parseFloat(stats.totalPNL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${stats.totalPNL}
                    </p>
                </div>
                <div className="glass-panel p-4 rounded-xl">
                    <h4 className="text-xs text-gray-400 font-medium uppercase">Win Rate</h4>
                    <p className="text-2xl font-bold text-white mt-1">{stats.winRate}%</p>
                </div>
                 <div className="glass-panel p-4 rounded-xl">
                    <h4 className="text-xs text-gray-400 font-medium uppercase">Avg Daily PNL</h4>
                    <p className={`text-2xl font-bold mt-1 ${parseFloat(stats.avgPNL) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${stats.avgPNL}
                    </p>
                </div>
                 <div className="glass-panel p-4 rounded-xl">
                    <h4 className="text-xs text-gray-400 font-medium uppercase">Total Trades</h4>
                    <p className="text-2xl font-bold text-white mt-1">{stats.totalTrades}</p>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl h-80">
                     <Scatter options={scatterOptions as any} data={emotionalAlphaData} />
                </div>
                <div className="glass-panel p-6 rounded-2xl h-80">
                     <Bar options={barOptions as any} data={pnlByEmotionData} />
                </div>
                <div className="glass-panel p-6 rounded-2xl h-80 lg:col-span-2">
                     <Line options={lineOptions as any} data={equityCurveData} />
                </div>
            </div>
            
            {entriesWithPNL.length === 0 && (
                <div className="text-center p-8 bg-white/5 rounded-xl border border-dashed border-gray-700">
                    <p className="text-gray-400">No PNL data found. Log your daily PNL in the "Trading" tab of your entries to see analytics here.</p>
                </div>
            )}
        </div>
    );
};

export default PNLCorrelationView;
