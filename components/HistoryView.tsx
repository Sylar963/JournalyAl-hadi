
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { type EmotionEntry, type EmotionType, type MonthlySummary } from '../types';
import { EMOTIONS_CONFIG, WEEK_DAYS } from '../constants';
import IconHistory from './icons/IconHistory';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface HistoryViewProps {
  entries: EmotionEntry[];
}

const emotionColors: Record<string, {bg: string, border: string}> = {
    Happy: {bg: 'rgba(250, 204, 21, 0.5)', border: 'rgb(250, 204, 21)'}, // yellow-400
    Calm: {bg: 'rgba(96, 165, 250, 0.5)', border: 'rgb(147, 197, 253)'}, // blue-400 / blue-300
    Anxious: {bg: 'rgba(245, 158, 11, 0.5)', border: 'rgb(245, 158, 11)'}, // amber-500
    Sad: {bg: 'rgba(37, 99, 235, 0.5)', border: 'rgb(59, 130, 246)'}, // blue-600 / blue-500
    Angry: {bg: 'rgba(239, 68, 68, 0.5)', border: 'rgb(248, 113, 113)'}, // red-500 / red-400
};

const MonthlyHeatmap: React.FC<{ year: number; month: number; entries: EmotionEntry[] }> = ({ year, month, entries }) => {
    const entriesMap = useMemo(() => new Map(entries.map(e => [e.date, e])), [entries]);

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`pad-${i}`} className="w-full aspect-square"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = entriesMap.get(dateKey);

        let cell;
        if (entry) {
            const config = EMOTIONS_CONFIG[entry.emotion];
            const intensityOpacity = 0.2 + (entry.intensity / 10) * 0.8;
            
            cell = (
                <div 
                  key={dateKey} 
                  className={`w-full aspect-square rounded-sm ${config.solidColor}`} 
                  style={{ opacity: intensityOpacity }} 
                  title={`${config.label} (${entry.intensity}/10) on ${date.toLocaleDateString()}`}
                >
                </div>
            );
        } else {
            cell = <div key={dateKey} className="w-full aspect-square rounded-sm bg-gray-800/50"></div>;
        }
        days.push(cell);
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-white mb-3">Daily Heatmap</h3>
            <div className="grid grid-cols-7 gap-1">
                {WEEK_DAYS.map(day => <div key={day} className="text-xs text-center text-gray-500 font-medium uppercase">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {days}
            </div>
        </div>
    );
};


const MonthlySummaryCard: React.FC<{ summary: MonthlySummary, entries: EmotionEntry[] }> = ({ summary, entries }) => {
    const monthName = new Date(summary.year, summary.month).toLocaleString('default', { month: 'long' });

    const chartData = useMemo(() => {
        const labels = Object.keys(EMOTIONS_CONFIG).map(key => EMOTIONS_CONFIG[key as EmotionType].label);
        const data = labels.map(label => {
            const emotionKey = (Object.keys(EMOTIONS_CONFIG) as EmotionType[]).find(key => EMOTIONS_CONFIG[key].label === label);
            return emotionKey ? summary.emotionCounts[emotionKey] || 0 : 0;
        });

        return {
            labels,
            datasets: [{
                label: 'Emotion Count',
                data,
                backgroundColor: labels.map(l => emotionColors[l]?.bg || 'rgba(255, 255, 255, 0.5)'),
                borderColor: labels.map(l => emotionColors[l]?.border || 'rgb(255, 255, 255)'),
                borderWidth: 1,
                borderRadius: 4,
            }]
        };
    }, [summary.emotionCounts]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
             tooltip: {
                enabled: true,
                backgroundColor: 'rgba(31, 41, 55, 0.9)', // bg-gray-800 with opacity
                titleColor: '#f9fafb', // text-gray-50
                bodyColor: '#d1d5db', // text-gray-300
                borderColor: '#374151', // border-gray-700
                borderWidth: 1,
                padding: 8,
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += `${context.parsed.y} ${context.parsed.y === 1 ? 'day' : 'days'}`;
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af', precision: 0 }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' }
            }
        }
    };

    return (
        <div className="bg-gray-900 p-5 rounded-lg border border-gray-800/50">
            <h2 className="text-xl font-bold text-white">{monthName} {summary.year}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 mb-5">
                <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400">Total Entries</h3>
                    <p className="text-2xl font-bold text-white mt-1">{summary.totalEntries}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400">Most Frequent</h3>
                    <p className="text-2xl font-bold text-white mt-1">{summary.mostFrequent !== 'N/A' ? EMOTIONS_CONFIG[summary.mostFrequent].label : 'N/A'}</p>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-400">Avg. Intensity</h3>
                    <p className="text-2xl font-bold text-white mt-1">{summary.avgIntensity}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Emotion Distribution</h3>
                    <div className="h-60">
                        <Bar options={chartOptions as any} data={chartData} />
                    </div>
                </div>
                <MonthlyHeatmap year={summary.year} month={summary.month} entries={entries} />
            </div>
        </div>
    );
};

interface MonthlyData {
    summary: MonthlySummary;
    entries: EmotionEntry[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ entries }) => {
    const monthlyData = useMemo<MonthlyData[]>(() => {
        const groupedByMonth: Record<string, EmotionEntry[]> = {};
        const today = new Date();
        const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        for (const entry of entries) {
            const monthKey = entry.date.substring(0, 7); // YYYY-MM
            
            // We don't want to show the current, ongoing month in history
            if(monthKey === currentMonthKey) continue;

            if (!groupedByMonth[monthKey]) {
                groupedByMonth[monthKey] = [];
            }
            groupedByMonth[monthKey].push(entry);
        }

        const data = Object.entries(groupedByMonth).map(([monthKey, monthEntries]) => {
            const [year, month] = monthKey.split('-').map(Number);
            
            const emotionCounts: Record<EmotionType, number> = { happy: 0, calm: 0, anxious: 0, sad: 0, angry: 0 };
            let totalIntensity = 0;

            for (const entry of monthEntries) {
                emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
                totalIntensity += entry.intensity;
            }
            
            const sortedEmotions = (Object.keys(emotionCounts) as EmotionType[]).sort(
                (a, b) => emotionCounts[b] - emotionCounts[a]
            );

            const mostFrequent: EmotionType | 'N/A' = 
                sortedEmotions.length > 0 && emotionCounts[sortedEmotions[0]] > 0
                    ? sortedEmotions[0]
                    : 'N/A';
            
            const summary: MonthlySummary = {
                year,
                month: month - 1, // month is 1-based from key, convert to 0-based for Date object
                totalEntries: monthEntries.length,
                mostFrequent,
                avgIntensity: monthEntries.length > 0 ? parseFloat((totalIntensity / monthEntries.length).toFixed(1)) : 0,
                emotionCounts,
            };
            return { summary, entries: monthEntries };
        });

        // Sort by year then month, descending
        return data.sort((a, b) => {
            if (a.summary.year !== b.summary.year) return b.summary.year - a.summary.year;
            return b.summary.month - a.summary.month;
        });

    }, [entries]);

    return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-white">Monthly History</h1>
            
            {monthlyData.length > 0 ? (
                <div className="space-y-6">
                    {monthlyData.map(({ summary, entries }) => (
                        <MonthlySummaryCard key={`${summary.year}-${summary.month}`} summary={summary} entries={entries} />
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-800">
                     <IconHistory className="w-12 h-12 mx-auto text-gray-600" />
                     <h3 className="mt-4 text-lg font-medium text-gray-400">Your history is empty</h3>
                     <p className="mt-1 text-sm text-gray-500">Completed monthly summaries will appear here over time. Keep logging your entries!</p>
                 </div>
            )}
        </div>
    );
};

export default HistoryView;