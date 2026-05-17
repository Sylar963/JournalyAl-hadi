import React, { useMemo, useState, useCallback } from 'react';
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
import { type EmotionEntry, type EmotionType } from '../types';
import { EMOTION_CHART_COLORS, EMOTION_KEYS, EMOTIONS_CONFIG, WEEK_DAYS } from '../constants';
import { getTrendsSummary } from '../services/geminiService';
import { getErrorMessage } from '../utils/errorHelpers';
import IconSparkles from './icons/IconSparkles';
import PNLCorrelationView from './PNLCorrelationView';
import { useI18n } from '../hooks/useI18n';
import { TranslationKey } from '../utils/translations';
import { TiltIndexGauge } from './TiltIndexGauge';
import { BehavioralInsights } from './BehavioralInsights';
import { calculateTiltIndex } from '../services/tiltEngineService';
import { learnTraderSignature, predictNextSessionRisk, RiskPrediction } from '../services/behaviorLearner';
import { isJournalAiEnabled } from '../services/journalAiService';
import { TiltMetrics } from '../types';

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

interface TrendsViewProps {
  entries: EmotionEntry[];
}

const TrendsView: React.FC<TrendsViewProps> = ({ entries }) => {
    const { t, language } = useI18n();
    const [aiSummary, setAiSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState('');

    const [tiltMetrics, setTiltMetrics] = useState<TiltMetrics | undefined>();
    const [riskPrediction, setRiskPrediction] = useState<RiskPrediction | undefined>();
    const [isTiltLoading, setIsTiltLoading] = useState(false);
    const aiEnabled = isJournalAiEnabled();

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
            if (!entry.emotion || !EMOTIONS_CONFIG[entry.emotion]) continue;
            emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
            totalIntensity += entry.intensity;
        }

        const mostFrequent = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as EmotionType | undefined;

        return {
            total: currentMonthEntries.length,
            mostFrequent: mostFrequent ? t(`emotion.${mostFrequent}` as TranslationKey) : 'N/A',
            avgIntensity: parseFloat((totalIntensity / currentMonthEntries.length).toFixed(1)),
        };
    }, [currentMonthEntries, t]);

    const distributionChartData = useMemo(() => {
        const labels = EMOTION_KEYS.map(key => t(`emotion.${key}` as TranslationKey));
        const data = EMOTION_KEYS.map(emotionKey => {
            return currentMonthEntries.filter(e => e.emotion === emotionKey).length;
        });

        return {
            labels,
            datasets: [{
                label: t('trends.chart_emotion_count'),
                data,
                backgroundColor: EMOTION_KEYS.map(key => EMOTION_CHART_COLORS[key].bg),
                borderColor: EMOTION_KEYS.map(key => EMOTION_CHART_COLORS[key].border),
                borderWidth: 1,
                borderRadius: 4,
            }]
        };
    }, [currentMonthEntries, t]);


    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#f9fafb',
                bodyColor: '#d1d5db',
                borderColor: 'rgba(250, 204, 21, 0.3)',
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
    
    const intensityChartData = useMemo(() => {
        if (currentMonthEntries.length === 0) return { labels: [], datasets: [] };
      
        const sortedEntries = [...currentMonthEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const labels = sortedEntries.map(e => new Date(e.date + 'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' }));
        const data = sortedEntries.map(e => e.intensity);
        const pointBgColors = sortedEntries.map(e => EMOTION_CHART_COLORS[e.emotion]?.border || '#ffffff');
      
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
    }, [currentMonthEntries, t, language]);
      
    const intensityChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                ...barChartOptions.plugins.tooltip,
                callbacks: {
                    title: (tooltipItems: any[]) => {
                        const index = tooltipItems[0].dataIndex;
                        const sorted = [...currentMonthEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        const entry = sorted[index];
                        return `${tooltipItems[0].label} - ${entry?.emotion ? t(`emotion.${entry.emotion}` as TranslationKey) : 'N/A'}`;
                    },
                    label: (context: any) => `${t('trends.chart_intensity_label')}: ${context.parsed.y}`,
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 1,
                max: 10,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#9ca3af', stepSize: 1 }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af' }
            }
        }
    };

    const dayOfWeekChartData = useMemo(() => {
        const counts = Object.fromEntries(
            EMOTION_KEYS.map((emotion) => [emotion, [0, 0, 0, 0, 0, 0, 0]])
        ) as Record<EmotionType, number[]>;
        currentMonthEntries.forEach(entry => {
            if (!entry.emotion || !counts[entry.emotion]) return;
            const dayIndex = new Date(entry.date + 'T00:00:00').getDay();
            counts[entry.emotion][dayIndex]++;
        });
        return {
            labels: WEEK_DAYS.map(day => t(`weekday.${day.toLowerCase()}` as TranslationKey)),
            datasets: EMOTION_KEYS.map(emotion => ({
                label: t(`emotion.${emotion}` as TranslationKey),
                data: counts[emotion],
                backgroundColor: EMOTION_CHART_COLORS[emotion].bg,
                borderColor: EMOTION_CHART_COLORS[emotion].border,
                borderWidth: 1.5,
                pointBackgroundColor: EMOTION_CHART_COLORS[emotion].border,
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: EMOTION_CHART_COLORS[emotion].border,
            }))
        };
    }, [currentMonthEntries, t]);

    const radarChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' as const, labels: { color: '#9ca3af' } },
            title: { display: false },
             tooltip: {
                ...barChartOptions.plugins.tooltip,
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

    const handleGenerateSummary = useCallback(async () => {
        setIsSummaryLoading(true);
        setSummaryError('');
        setAiSummary('');
        try {
            const summary = await getTrendsSummary(currentMonthEntries);
            setAiSummary(summary);
        } catch(error: unknown) {
            setSummaryError(getErrorMessage(error));
        } finally {
            setIsSummaryLoading(false);
        }
    }, [currentMonthEntries]);

    const [activeTab, setActiveTab] = useState<'general' | 'pnl' | 'tilt'>('general');

    React.useEffect(() => {
        const loadTiltData = async () => {
            if (activeTab === 'tilt' && entries.length > 0 && !tiltMetrics) {
                setIsTiltLoading(true);
                try {
                    // Using the most recent entry as current, others as historical
                    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                    const currentEntry = sortedEntries[sortedEntries.length - 1];
                    const historicalEntries = sortedEntries.slice(0, sortedEntries.length - 1);
                    
                    const metrics = calculateTiltIndex(currentEntry, historicalEntries);
                    setTiltMetrics(metrics);

                    if (!aiEnabled || historicalEntries.length === 0) {
                        setRiskPrediction(undefined);
                        return;
                    }

                    const profile = await learnTraderSignature(historicalEntries);
                    const prediction = await predictNextSessionRisk(profile, currentEntry);
                    setRiskPrediction(prediction);
                } catch (error) {
                    console.error("Failed to load tilt data", error);
                } finally {
                    setIsTiltLoading(false);
                }
            }
        };
        loadTiltData();
    }, [activeTab, aiEnabled, entries, tiltMetrics]);

  return (
    <div className="space-y-6 animate-content-entry">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="journal-kicker">Performance Analytics</p>
          <h1 className="text-2xl font-semibold text-[var(--text-main)] mt-1">{t('trends.title')}</h1>
        </div>
        
        <div className="journal-tabbar flex p-1 rounded-xl w-full md:w-auto">
            <button
                onClick={() => setActiveTab('general')}
                data-active={activeTab === 'general'}
                className="journal-tab flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all"
            >
                {t('trends.tab_general')}
            </button>
            <button
                onClick={() => setActiveTab('pnl')}
                data-active={activeTab === 'pnl'}
                className="journal-tab flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all"
            >
                {t('trends.tab_pnl')}
            </button>
            <button
                onClick={() => setActiveTab('tilt')}
                data-active={activeTab === 'tilt'}
                className="journal-tab flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all"
            >
                Tilt & Behavior
            </button>
        </div>
      </div>
      
      {activeTab === 'tilt' ? (
          <div className="space-y-6">
              <TiltIndexGauge metrics={tiltMetrics} />
              <BehavioralInsights prediction={riskPrediction} isLoading={isTiltLoading} />
          </div>
      ) : activeTab === 'pnl' ? (
          <PNLCorrelationView entries={entries} />
      ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="journal-panel p-6 rounded-2xl">
                <h3 className="journal-kicker">{t('trends.stat_total')}</h3>
                <p className="journal-metric text-3xl font-semibold text-[var(--text-main)] mt-3">{stats.total}</p>
                </div>
                <div className="journal-panel p-6 rounded-2xl">
                <h3 className="journal-kicker">{t('trends.stat_frequent')}</h3>
                <p className="text-2xl font-semibold text-[var(--text-main)] mt-3">{stats.mostFrequent}</p>
                </div>
                <div className="journal-panel p-6 rounded-2xl">
                <h3 className="journal-kicker">{t('trends.stat_intensity')}</h3>
                <p className="journal-metric text-3xl font-semibold text-[var(--text-main)] mt-3">{stats.avgIntensity}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="journal-panel p-6 rounded-2xl">
                    <p className="journal-kicker mb-2">Monthly Distribution</p>
                    <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">{t('trends.chart_distribution')}</h3>
                    <div className="h-80">
                    {currentMonthEntries.length > 0 ? (
                        <Bar options={barChartOptions as any} data={distributionChartData} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--text-subtle)]">
                            {t('trends.no_data')}
                        </div>
                    )}
                    </div>
                </div>
                <div className="journal-panel p-6 rounded-2xl">
                    <p className="journal-kicker mb-2">Session Intensity</p>
                    <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">{t('trends.chart_intensity')}</h3>
                    <div className="h-80">
                    {currentMonthEntries.length > 0 ? (
                        <Line options={intensityChartOptions as any} data={intensityChartData} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--text-subtle)]">
                            {t('trends.no_intensity')}
                        </div>
                    )}
                    </div>
                </div>
                <div className="journal-panel p-6 rounded-2xl lg:col-span-2">
                    <p className="journal-kicker mb-2">Weekly Profile</p>
                    <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">{t('trends.chart_weekly')}</h3>
                    <div className="h-96">
                    {currentMonthEntries.length > 0 ? (
                        <Radar options={radarChartOptions as any} data={dayOfWeekChartData} />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[var(--text-subtle)]">
                            {t('trends.no_weekly')}
                        </div>
                    )}
                    </div>
                </div>
            </div>

            <div className="journal-panel p-6 rounded-2xl">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div>
                    <p className="journal-kicker">AI Review</p>
                    <h3 className="text-lg font-semibold text-[var(--text-main)] mt-1">{t('trends.ai_title')}</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{t('trends.ai_subtitle')}</p>
                    </div>
                    <button onClick={handleGenerateSummary} disabled={!aiEnabled || isSummaryLoading || currentMonthEntries.length === 0} className="journal-button-primary flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        <IconSparkles className="w-5 h-5 mr-2" />
                        {isSummaryLoading ? t('trends.ai_analyzing') : t('trends.ai_button')}
                    </button>
                </div>
                {!aiEnabled && <p className="text-sm text-[var(--text-subtle)] mt-4">AI summaries and behavioral coaching require Supabase-backed mode.</p>}
                {isSummaryLoading && <p className="text-center text-sm text-[var(--text-muted)] mt-4">{t('trends.ai_thinking')}</p>}
                {summaryError && <p className="text-center text-sm text-red-400 mt-4">{summaryError}</p>}
                {aiSummary && (
                    <div className="mt-4 p-4 journal-panel-muted rounded-xl">
                        <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap font-light leading-relaxed">{aiSummary}</p>
                    </div>
                )}
                {!aiSummary && !isSummaryLoading && !summaryError && aiEnabled && currentMonthEntries.length > 0 && (
                    <p className="text-sm text-[var(--text-subtle)] mt-4 text-center sm:text-left">
                        {t('trends.ai_get_started')}
                    </p>
                )}
                {!aiSummary && !isSummaryLoading && !summaryError && aiEnabled && currentMonthEntries.length === 0 && (
                    <p className="text-sm text-[var(--text-subtle)] mt-4 text-center sm:text-left">
                        {t('trends.ai_log_entries')}
                    </p>
                )}
            </div>
          </>
      )}
    </div>
  );
};

export default TrendsView;
