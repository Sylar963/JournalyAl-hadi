import React, { useMemo } from 'react';
import { Bar, Line, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { type EmotionEntry, type EmotionType, type MonthlySummary } from '../types';
import { EMOTIONS_CONFIG, WEEK_DAYS } from '../constants';
import IconHistory from './icons/IconHistory';
import { useI18n } from '../hooks/useI18n';
import { TranslationKey } from '../utils/translations';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  Filler,
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
    const { t } = useI18n();
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
                  title={`${t(`emotion.${entry.emotion}` as TranslationKey)} (${entry.intensity}/10) on ${date.toLocaleDateString()}`}
                >
                </div>
            );
        } else {
            cell = <div key={dateKey} className="w-full aspect-square rounded-sm bg-gray-800/50"></div>;
        }
        days.push(cell);
    }

    return (
        <>
            <div className="grid grid-cols-7 gap-1">
                {WEEK_DAYS.map(day => <div key={day} className="text-xs text-center text-gray-500 font-medium uppercase">{t(`weekday.${day.toLowerCase()}` as TranslationKey)}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 mt-2">
                {days}
            </div>
        </>
    );
};


const MonthlySummaryCard: React.FC<{ summary: MonthlySummary, entries: EmotionEntry[] }> = ({ summary, entries }) => {
    const { t, language } = useI18n();
    const monthName = t(`month.${summary.month}` as TranslationKey);
    const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
             tooltip: {
                enabled: true,
                backgroundColor: 'rgba(17, 24, 39, 0.9)', // bg-gray-900/90
                titleColor: '#f9fafb', // text-gray-50
                bodyColor: '#d1d5db', // text-gray-300
                borderColor: 'rgba(250, 204, 21, 0.3)', // border-yellow-400/30
                borderWidth: 1,
                padding: 12,
                caretPadding: 10,
                caretSize: 8,
                cornerRadius: 8,
                displayColors: true,
                boxPadding: 5,
                callbacks: {
                    title: (tooltipItems: any[]) => tooltipItems[0].label,
                    label: (context: any) => {
                        const count = context.parsed.y;
                        if (count !== null) {
                           return `${count} ${count === 1 ? t('trends.chart_day') : t('trends.chart_days')}`;
                        }
                        return '';
                   },
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

    const distChartData = useMemo(() => {
        const labels = (Object.keys(EMOTIONS_CONFIG) as EmotionType[]).map(key => t(`emotion.${key}` as TranslationKey));
        const data = (Object.keys(EMOTIONS_CONFIG) as EmotionType[]).map(emotionKey => {
            return summary.emotionCounts[emotionKey] || 0;
        });

        return {
            labels,
            datasets: [{
                label: t('trends.chart_emotion_count'),
                data,
                backgroundColor: (Object.keys(EMOTIONS_CONFIG) as EmotionType[]).map(key => emotionColors[EMOTIONS_CONFIG[key].label]?.bg || 'rgba(255, 255, 255, 0.5)'),
                borderColor: (Object.keys(EMOTIONS_CONFIG) as EmotionType[]).map(key => emotionColors[EMOTIONS_CONFIG[key].label]?.border || 'rgb(255, 255, 255)'),
                borderWidth: 1,
                borderRadius: 4,
            }]
        };
    }, [summary.emotionCounts, t]);

    const sortedEntriesForIntensity = useMemo(() => {
        return [...entries].sort((a, b) => new Date(a.date).getDate() - new Date(b.date).getDate());
    }, [entries]);

    const intensityChartData = useMemo(() => {
        if (sortedEntriesForIntensity.length === 0) return { labels: [], datasets: [] };
        
        const labels = sortedEntriesForIntensity.map(e => new Date(e.date + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' }));
        const data = sortedEntriesForIntensity.map(e => e.intensity);
        const pointBgColors = sortedEntriesForIntensity.map(e => emotionColors[EMOTIONS_CONFIG[e.emotion].label]?.border || '#ffffff');
      
        return {
          labels,
          datasets: [{
            label: t('trends.chart_intensity_label'),
            data,
            fill: true,
            backgroundColor: 'rgba(250, 204, 21, 0.05)',
            borderColor: 'rgba(250, 204, 21, 0.4)',
            tension: 0.3,
            pointBackgroundColor: pointBgColors,
            pointBorderColor: '#0000',
            pointRadius: 5,
            pointHoverRadius: 7,
          }]
        };
    }, [sortedEntriesForIntensity, language, t]);

    const intensityChartOptions = {
        ...chartOptions,
        plugins: {
            ...chartOptions.plugins,
            tooltip: {
                ...chartOptions.plugins.tooltip,
                callbacks: {
                    title: (tooltipItems: any[]) => {
                        const index = tooltipItems[0].dataIndex;
                        const entry = sortedEntriesForIntensity[index];
                        return `${tooltipItems[0].label} - ${t(`emotion.${entry.emotion}` as TranslationKey)}`;
                    },
                    label: (context: any) => `${t('trends.chart_intensity_label')}: ${context.parsed.y}`,
                }
            }
        },
        scales: {
            y: { ...chartOptions.scales.y, min: 1, max: 10, beginAtZero: false, ticks: { ...chartOptions.scales.y.ticks, stepSize: 1 } },
            x: chartOptions.scales.x,
        }
    };
    
    const dayOfWeekChartData = useMemo(() => {
        const counts: Record<EmotionType, number[]> = { happy: [0,0,0,0,0,0,0], calm: [0,0,0,0,0,0,0], anxious: [0,0,0,0,0,0,0], sad: [0,0,0,0,0,0,0], angry: [0,0,0,0,0,0,0] };
        entries.forEach(entry => {
            const dayIndex = new Date(entry.date + 'T00:00:00').getDay();
            counts[entry.emotion][dayIndex]++;
        });
        const emotionKeys = Object.keys(EMOTIONS_CONFIG) as EmotionType[];
        return {
            labels: WEEK_DAYS.map(day => t(`weekday.${day.toLowerCase()}` as TranslationKey)),
            datasets: emotionKeys.map(emotion => ({
                label: t(`emotion.${emotion}` as TranslationKey),
                data: counts[emotion],
                backgroundColor: emotionColors[EMOTIONS_CONFIG[emotion].label]?.bg,
                borderColor: emotionColors[EMOTIONS_CONFIG[emotion].label]?.border,
                borderWidth: 1.5,
                pointBackgroundColor: emotionColors[EMOTIONS_CONFIG[emotion].label]?.border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: emotionColors[EMOTIONS_CONFIG[emotion].label]?.border,
            }))
        };
    }, [entries, t]);

    const radarChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, labels: { color: '#9ca3af' } },
            title: { display: false },
             tooltip: {
                ...chartOptions.plugins.tooltip,
                callbacks: {
                    title: (tooltipItems: any[]) => tooltipItems[0].label,
                    label: (context: any) => `${context.dataset.label}: ${context.parsed.r} ${context.parsed.r === 1 ? t('trends.chart_day') : t('trends.chart_days')}`,
                }
            }
        },
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' },
                pointLabels: { color: '#d1d5db' },
                ticks: {
                    color: '#9ca3af',
                    backdropColor: 'rgba(0,0,0,0.5)',
                    backdropPadding: 4,
                    precision: 0,
                },
                beginAtZero: true,
            }
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{capitalizedMonthName} {summary.year}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 mb-8">
                <div className="bg-white/5 p-4 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-400">{t('trends.stat_total')}</h3>
                    <p className="text-2xl font-bold text-white mt-1">{summary.totalEntries}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-400">{t('trends.stat_frequent')}</h3>
                    <p className="text-2xl font-bold text-white mt-1">{summary.mostFrequent !== 'N/A' ? t(`emotion.${summary.mostFrequent}` as TranslationKey) : 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm">
                    <h3 className="text-sm font-medium text-gray-400">{t('trends.stat_intensity')}</h3>
                    <p className="text-2xl font-bold text-white mt-1">{summary.avgIntensity.toFixed(1)}</p>
                    <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                        <div 
                            className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] h-2 rounded-full shadow-[0_0_10px_var(--chart-glow-color-1)]" 
                            style={{ width: `${(summary.avgIntensity / 10) * 100}%` }}
                            title={`${t('trends.stat_intensity')}: ${summary.avgIntensity.toFixed(1)} / 10`}
                        ></div>
                    </div>
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 p-5 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">{t('trends.chart_distribution')}</h3>
                    <div className="h-64">
                        <Bar options={chartOptions as any} data={distChartData} />
                    </div>
                </div>
                <div className="bg-white/5 p-5 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">{t('trends.chart_intensity')}</h3>
                    <div className="h-64">
                         <Line options={intensityChartOptions as any} data={intensityChartData} />
                    </div>
                </div>
                <div className="bg-white/5 p-5 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">{t('trends.chart_weekly')}</h3>
                    <div className="h-64">
                        <Radar options={radarChartOptions as any} data={dayOfWeekChartData} />
                    </div>
                </div>
                <div className="bg-white/5 p-5 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">{t('history.chart_heatmap')}</h3>
                    <MonthlyHeatmap year={summary.year} month={summary.month} entries={entries} />
                </div>
            </div>
        </div>
    );
};

interface MonthlyData {
    summary: MonthlySummary;
    entries: EmotionEntry[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ entries }) => {
    const { t } = useI18n();
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
        <div className="space-y-6 animate-content-entry">
            <h1 className="text-2xl font-bold text-white">{t('history.title')}</h1>
            
            {monthlyData.length > 0 ? (
                <div className="space-y-6">
                    {monthlyData.map(({ summary, entries }) => (
                        <MonthlySummaryCard key={`${summary.year}-${summary.month}`} summary={summary} entries={entries} />
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-800">
                     <IconHistory className="w-12 h-12 mx-auto text-gray-600" />
                     <h3 className="mt-4 text-lg font-medium text-gray-400">{t('history.empty_title')}</h3>
                     <p className="mt-1 text-sm text-gray-500">{t('history.empty_subtitle')}</p>
                 </div>
            )}
        </div>
    );
};

export default HistoryView;