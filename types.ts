import type { Session, User } from '@supabase/supabase-js';

export type { Session, User };

export type EmotionType = 'happy' | 'calm' | 'anxious' | 'sad' | 'angry';

export type ActiveView = 'journal' | 'trends' | 'reports' | 'history' | 'settings';

export type Theme = 'twilight' | 'sunrise' | 'cyberpunk' | 'forest';

export interface ThemeConfig {
  id: Theme;
  label: string;
  colors: {
    background: string;
    primary: string;
    secondary: string;
    accent: string;
  };
}


export interface EmotionEntry {
  date: string; // YYYY-MM-DD
  emotion: EmotionType;
  intensity: number; // 1-10
  notes: string | null;
  imageUrl?: string; // base64 encoded image
}

export interface ReportAnalysis {
    summary: string;
    emotionFrequency: string;
    intensityTrend: string;
    insights: string;
}

export interface UserProfile {
  name: string;
  alias: string;
  picture?: string; // base64 encoded image
  journalPurpose?: string;
}

export interface MonthlySummary {
    year: number;
    month: number; // 0-11
    totalEntries: number;
    mostFrequent: EmotionType | 'N/A';
    avgIntensity: number;
    emotionCounts: Record<EmotionType, number>;
}

export interface Quest {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}