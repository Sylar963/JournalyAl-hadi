import React, { useMemo, useState, useCallback } from 'react';
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
import { type EmotionEntry, type EmotionType } from '../types';
import { EMOTIONS_CONFIG } from '../constants';
import { getTrendsSummary } from '../services/geminiService';
import IconSparkles from './icons/IconSparkles';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TrendsViewProps {
  entries: EmotionEntry[];
}

const TrendsView: React.FC<TrendsViewProps> = ({ entries }) => {
    const [aiSummary, setAiSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState('');

    const currentMonthEntries = useMemo(() => {
        const today = new Date();
        const y = today.getFullYear();
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const currentMonthPrefix = `${y}-${m}`;

        return entries.filter(entry => entry.date.startsWith(currentMonthPrefix));
    }, [entries]);

    const stats = useMemo(() => {
        if (currentMonthEntries.length === 0) {
            return { total: 0, mostFrequent: 'N/A', avgIntensity: 0 };
        }

        const emotionCounts = {} as Record<EmotionType, number>;
        let totalIntensity = 0;

        for (const entry of currentMonthEntries) {
            emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
            totalIntensity += entry.intensity;
        }

        const mostFrequent = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as EmotionType | undefined;

        return {
            total: currentMonthEntries.length,
            mostFrequent: mostFrequent ? EMOTIONS_CONFIG[mostFrequent].label : 'N/A',
            avgIntensity: parseFloat((totalIntensity / currentMonthEntries.length).toFixed(1)),
        };
    }, [currentMonthEntries]);

    const emotionColors: Record<string, {bg: string, border: string}> = {
        Happy: {bg: 'rgba(250, 204, 21, 0.5)', border: 'rgb(250, 204, 21)'}, // yellow-400
        Calm: {bg: 'rgba(96, 165, 250, 0.5)', border: 'rgb(147, 197, 253)'}, // blue-400 / blue-300
        Anxious: {bg: 'rgba(245, 158, 11, 0.5)', border: 'rgb(245, 158, 11)'}, // amber-500
        Sad: {bg: 'rgba(37, 99, 235, 0.5)', border: 'rgb(59, 130, 246)'}, // blue-600 / blue-500
        Angry: {bg: 'rgba(239, 68, 68, 0.5)', border: 'rgb(248, 113, 113)'}, // red-500 / red-400
    };

    const chartData = useMemo(() => {
        const labels = Object.keys(EMOTIONS_CONFIG).map(key => EMOTIONS_CONFIG[key as EmotionType].label);
        const data = labels.map(label => {
            const emotionKey = (Object.keys(EMOTIONS_CONFIG) as EmotionType[]).find(key => EMOTIONS_CONFIG[key].label === label);
            return currentMonthEntries.filter(e => e.emotion === emotionKey).length;
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
    }, [currentMonthEntries]);


    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
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
    
    const handleGenerateSummary = useCallback(async () => {
        setIsSummaryLoading(true);
        setSummaryError('');
        setAiSummary('');
        try {
            const summary = await getTrendsSummary(currentMonthEntries);
            setAiSummary(summary);
        } catch(error: any) {
            setSummaryError(error.message || 'Failed to generate summary.');
        } finally {
            setIsSummaryLoading(false);
        }
    }, [currentMonthEntries]);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">This Month's Trends</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 p-5 rounded-lg border border-gray-800/50">
          <h3 className="text-sm font-medium text-gray-400">Total Entries</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-gray-900 p-5 rounded-lg border border-gray-800/50">
          <h3 className="text-sm font-medium text-gray-400">Most Frequent</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.mostFrequent}</p>
        </div>
        <div className="bg-gray-900 p-5 rounded-lg border border-gray-800/50">
          <h3 className="text-sm font-medium text-gray-400">Avg. Intensity</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.avgIntensity}</p>
        </div>
      </div>

      <div className="bg-gray-900 p-5 rounded-lg border border-gray-800/50">
        <h3 className="text-lg font-semibold text-white mb-4">Emotion Distribution</h3>
        <div className="h-64">
           {currentMonthEntries.length > 0 ? (
             <Bar options={chartOptions as any} data={chartData} />
           ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                No data for this month to display.
            </div>
           )}
        </div>
      </div>

      <div className="bg-gray-900 p-5 rounded-lg border border-gray-800/50">
         <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">AI-Powered Summary</h3>
              <p className="text-sm text-gray-400 mt-1">Get an analysis of your emotional patterns this month.</p>
            </div>
            <button onClick={handleGenerateSummary} disabled={isSummaryLoading || currentMonthEntries.length === 0} className="flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                <IconSparkles className="w-5 h-5 mr-2" />
                {isSummaryLoading ? 'Analyzing...' : 'Generate Summary'}
            </button>
         </div>
         {isSummaryLoading && <p className="text-center text-sm text-gray-400 mt-4">The AI is analyzing your monthly data...</p>}
         {summaryError && <p className="text-center text-sm text-red-400 mt-4">{summaryError}</p>}
         {aiSummary && (
             <div className="mt-4 p-4 bg-black/25 rounded-lg border border-gray-800">
                <p className="text-sm text-gray-300 whitespace-pre-wrap font-light leading-relaxed">{aiSummary}</p>
             </div>
         )}
         {!aiSummary && !isSummaryLoading && !summaryError && currentMonthEntries.length > 0 && (
             <p className="text-sm text-gray-500 mt-4 text-center sm:text-left">
                Click "Generate Summary" to get started.
             </p>
         )}
          {!aiSummary && !isSummaryLoading && !summaryError && currentMonthEntries.length === 0 && (
             <p className="text-sm text-gray-500 mt-4 text-center sm:text-left">
                Log some entries for the current month to enable AI summary.
             </p>
         )}
      </div>
    </div>
  );
};

export default TrendsView;