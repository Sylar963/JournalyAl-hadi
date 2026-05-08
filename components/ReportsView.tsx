import React, { useState, useCallback, useMemo } from 'react';
import { type EmotionEntry, type ReportAnalysis } from '../types';
import { getReportAnalysis } from '../services/geminiService';
import { getErrorMessage } from '../utils/errorHelpers';
import IconSparkles from './icons/IconSparkles';
import IconCalendar from './icons/IconCalendar';
import { useI18n } from '../hooks/useI18n';

// Helper to format date to YYYY-MM-DD
const toISODateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

const ReportSection: React.FC<{title: string; content: string}> = ({ title, content }) => (
    <div>
        <p className="journal-kicker mb-2">{title}</p>
        <p className="text-[var(--text-main)] whitespace-pre-wrap font-light leading-relaxed">{content}</p>
    </div>
);


const ReportsView: React.FC<{ entries: EmotionEntry[] }> = ({ entries }) => {
    const { t, language } = useI18n();
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState<string>(toISODateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState<string>(toISODateString(today));
    const [report, setReport] = useState<ReportAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const filteredEntries = useMemo(() => {
        if (!startDate || !endDate) return [];
        // Use T00:00:00 to treat dates as local timezone
        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        
        // Adjust end date to include the entire day
        end.setDate(end.getDate() + 1);

        return entries.filter(entry => {
            const entryDate = new Date(entry.date + 'T00:00:00');
            return entryDate >= start && entryDate < end;
        });
    }, [entries, startDate, endDate]);

    const handleGenerateReport = useCallback(async () => {
        setIsLoading(true);
        setError('');
        setReport(null);
        try {
            const result = await getReportAnalysis(filteredEntries, startDate, endDate);
            setReport(result);
        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [filteredEntries, startDate, endDate]);
    
    return (
        <div className="space-y-6 animate-content-entry">
            <div>
                <p className="journal-kicker">AI Report Builder</p>
                <h1 className="text-2xl font-semibold text-[var(--text-main)] mt-1">{t('reports.title')}</h1>
            </div>
            
            <div className="journal-panel p-6 rounded-2xl">
                <p className="journal-kicker mb-2">Review Window</p>
                <h3 className="text-lg font-semibold text-[var(--text-main)] mb-4">{t('reports.select_range')}</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-full sm:w-auto">
                        <label htmlFor="start-date" className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('reports.start_date')}</label>
                        <input 
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={endDate}
                            className="journal-input w-full rounded-lg p-2.5 transition journal-metric"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <label htmlFor="end-date" className="block text-sm font-medium text-[var(--text-muted)] mb-1">{t('reports.end_date')}</label>
                         <input 
                            type="date"
                            id="end-date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            max={toISODateString(new Date())}
                            className="journal-input w-full rounded-lg p-2.5 transition journal-metric"
                        />
                    </div>
                     <div className="w-full sm:w-auto sm:self-end">
                          <button 
                            onClick={handleGenerateReport} 
                            disabled={isLoading || filteredEntries.length === 0}
                            className="journal-button-primary w-full flex-shrink-0 flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                             <IconSparkles className="w-5 h-5 mr-2" />
                             {isLoading ? t('reports.generating') : t('reports.generate_button')}
                          </button>
                     </div>
                 </div>
                  {filteredEntries.length === 0 && !isLoading && (
                     <p className="text-sm text-[var(--text-muted)] mt-3">{t('reports.no_entries')}</p>
                  )}
            </div>

            {isLoading && (
                 <div className="text-center p-8 journal-panel-muted rounded-2xl">
                      <div role="status" className="animate-spin inline-block w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full">
                          <span className="sr-only">Loading...</span>
                      </div>
                      <p className="mt-4 text-[var(--text-muted)]">{t('reports.ai_thinking')}</p>
                  </div>
             )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl backdrop-blur-sm">
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {report && (
                <div className="journal-panel p-6 rounded-2xl space-y-6 animate-fade-in">
                    <div className="border-b journal-divider pb-4">
                        <p className="journal-kicker">Generated Analysis</p>
                        <h2 className="text-xl font-semibold text-[var(--text-main)] mt-1">{t('reports.title')}</h2>
                        <p className="text-[var(--text-muted)] text-sm journal-metric">{t('reports.analysis_for')} {new Date(startDate+'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')} {t('reports.to')} {new Date(endDate+'T00:00:00').toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}</p>
                    </div>
                    
                    <ReportSection title={t('reports.summary')} content={report.summary} />
                    <ReportSection title={t('reports.frequency')} content={report.emotionFrequency} />
                    <ReportSection title={t('reports.trends')} content={report.intensityTrend} />
                    <ReportSection title={t('reports.insights')} content={report.insights} />
                </div>
            )}

            {!report && !isLoading && !error && (
                 <div className="text-center p-8 journal-panel-muted rounded-2xl border-2 border-dashed border-[var(--panel-border)]">
                     <IconCalendar className="w-12 h-12 mx-auto text-[var(--text-subtle)]" />
                     <h3 className="mt-4 text-lg font-medium text-[var(--text-muted)]">{t('reports.placeholder_title')}</h3>
                     <p className="mt-1 text-sm text-[var(--text-subtle)]">{t('reports.placeholder_subtitle')}</p>
                  </div>
             )}
        </div>
    );
};

export default ReportsView;
