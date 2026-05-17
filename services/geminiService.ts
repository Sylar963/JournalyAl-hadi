import { type EmotionEntry, type ReportAnalysis } from '../types';
import { invokeJournalAi } from './journalAiService';

export async function getEmotionInsight(entry: EmotionEntry): Promise<string> {
  const response = await invokeJournalAi<{ insight: string }>('emotion-insight', { entry });
  return response.insight;
}

export async function getTrendsSummary(entries: EmotionEntry[]): Promise<string> {
  const response = await invokeJournalAi<{ summary: string }>('trends-summary', { entries });
  return response.summary;
}

export async function getReportAnalysis(entries: EmotionEntry[], startDate: string, endDate: string): Promise<ReportAnalysis> {
  const response = await invokeJournalAi<{ report: ReportAnalysis }>('report-analysis', {
    entries,
    startDate,
    endDate,
  });
  return response.report;
}
