import { EmotionEntry } from '../types';
import { invokeJournalAi } from './journalAiService';

export interface TraderProfile {
  summary: string;
  identifiedTriggers: string[];
  behavioralPatterns: string[];
}

export interface RiskPrediction {
  prediction: string;
  riskScore: number;
  advice: string;
}

export async function learnTraderSignature(entries: EmotionEntry[]): Promise<TraderProfile> {
  const response = await invokeJournalAi<{ profile: TraderProfile }>('learn-trader-signature', { entries });
  return response.profile;
}

export async function predictNextSessionRisk(profile: TraderProfile, currentState: EmotionEntry): Promise<RiskPrediction> {
  const response = await invokeJournalAi<{ prediction: RiskPrediction }>('predict-session-risk', {
    profile,
    currentState,
  });
  return response.prediction;
}
