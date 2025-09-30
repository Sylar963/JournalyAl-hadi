import React, { useState, useCallback, useMemo } from 'react';
import { type EmotionEntry, type ReportAnalysis } from '../types';
import { getReportAnalysis } from '../services/geminiService';
import IconSparkles from './icons/IconSparkles';
import IconCalendar from './icons/IconCalendar';

// Helper to format date to YYYY-MM-DD
const toISODateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

const ReportSection: React.FC<{title: string; content: string}> = ({ title, content }) => (
    <div>
        <h3 className="text-lg font-semibold text-yellow-400 mb-2">{title}</h3>
        <p className="text-gray-300 whitespace-pre-wrap font-light leading-relaxed">{content}</p>
    </div>
);


const ReportsView: React.FC<{ entries: EmotionEntry[] }> = ({ entries }) => {
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
        } catch (err: any) {
            setError(err.message || "An unknown error occurred while generating the report.");
        } finally {
            setIsLoading(false);
        }
    }, [filteredEntries, startDate, endDate]);
    
    return (
        <div className="space-y-6 animate-content-entry">
            <h1 className="text-2xl font-bold text-white">Wellness Reports</h1>
            
            <div className="bg-gray-900 p-5 rounded-lg border border-gray-800/50">
                <h3 className="text-lg font-semibold text-white mb-4">Select Date Range</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-full sm:w-auto">
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                        <input 
                            type="date"
                            id="start-date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={endDate}
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                        />
                    </div>
                    <div className="relative w-full sm:w-auto">
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                         <input 
                            type="date"
                            id="end-date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            max={toISODateString(new Date())}
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                        />
                    </div>
                     <div className="w-full sm:w-auto sm:self-end">
                         <button 
                            onClick={handleGenerateReport} 
                            disabled={isLoading || filteredEntries.length === 0}
                            className="w-full flex-shrink-0 flex items-center justify-center bg-yellow-600 text-black px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-yellow-700 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                            <IconSparkles className="w-5 h-5 mr-2" />
                            {isLoading ? 'Generating...' : 'Generate Report'}
                         </button>
                    </div>
                </div>
                 {filteredEntries.length === 0 && !isLoading && (
                     <p className="text-sm text-yellow-400 mt-3">No entries found for the selected date range. Adjust the dates or add new entries.</p>
                 )}
            </div>

            {isLoading && (
                 <div className="text-center p-8 bg-gray-900/50 rounded-lg">
                     <div role="status" className="animate-spin inline-block w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full">
                         <span className="sr-only">Loading...</span>
                     </div>
                     <p className="mt-4 text-gray-400">The AI is analyzing your data. This may take a moment...</p>
                 </div>
            )}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
                    <p className="font-semibold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            {report && (
                <div className="bg-gray-900 p-6 rounded-lg border border-gray-800/50 space-y-6 animate-fade-in">
                    <div className="border-b border-gray-800 pb-4">
                        <h2 className="text-xl font-bold text-white">Wellness Report</h2>
                        <p className="text-gray-400 text-sm">Analysis for {new Date(startDate+'T00:00:00').toLocaleDateString()} to {new Date(endDate+'T00:00:00').toLocaleDateString()}</p>
                    </div>
                    
                    <ReportSection title="Overall Summary" content={report.summary} />
                    <ReportSection title="Emotion Frequency" content={report.emotionFrequency} />
                    <ReportSection title="Intensity Trends" content={report.intensityTrend} />
                    <ReportSection title="Reflective Insights" content={report.insights} />
                </div>
            )}

            {!report && !isLoading && !error && (
                 <div className="text-center p-8 bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-800">
                     <IconCalendar className="w-12 h-12 mx-auto text-gray-600" />
                     <h3 className="mt-4 text-lg font-medium text-gray-400">Your report will appear here</h3>
                     <p className="mt-1 text-sm text-gray-500">Select a date range and click "Generate Report" to get started.</p>
                 </div>
            )}
        </div>
    );
};

export default ReportsView;