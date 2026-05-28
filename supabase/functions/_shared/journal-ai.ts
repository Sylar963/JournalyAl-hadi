import { GoogleGenAI, Type } from 'npm:@google/genai@1.28.0';
import { getEnv } from './integration-runtime.ts';

interface EmotionEntryPayload {
  date: string;
  emotion: string;
  intensity: number;
  notes: string | null;
  pnl?: number;
  tradingData?: {
    trades?: Array<{
      symbol?: string;
      type?: string;
      pnl?: number;
      closedPnl?: number;
    }>;
  };
}

interface TraderProfilePayload {
  summary: string;
  identifiedTriggers: string[];
  behavioralPatterns: string[];
}

interface RiskPredictionPayload {
  prediction: string;
  riskScore: number;
  advice: string;
}

interface ReportAnalysisPayload {
  summary: string;
  emotionFrequency: string;
  intensityTrend: string;
  insights: string;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: getEnv('GEMINI_API_KEY') });
  }

  return aiClient;
}

function clampText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function clampNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function sanitizeEntry(entry: unknown): EmotionEntryPayload | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const candidate = entry as Record<string, unknown>;
  const trades = Array.isArray(candidate.tradingData && typeof candidate.tradingData === 'object'
    ? (candidate.tradingData as { trades?: unknown }).trades
    : undefined)
    ? ((candidate.tradingData as { trades?: Array<Record<string, unknown>> }).trades ?? []).slice(-25).map((trade) => ({
        symbol: clampText(trade.symbol, 24),
        type: clampText(trade.type, 32),
        pnl: clampNumber(trade.pnl),
        closedPnl: clampNumber(trade.closedPnl),
      }))
    : [];

  return {
    date: clampText(candidate.date, 32),
    emotion: clampText(candidate.emotion, 24),
    intensity: Math.min(10, Math.max(1, Number(candidate.intensity) || 1)),
    notes: clampText(candidate.notes, 2000) || null,
    pnl: clampNumber(candidate.pnl),
    tradingData: trades.length > 0 ? { trades } : undefined,
  };
}

function sanitizeEntries(entries: unknown, limit: number): EmotionEntryPayload[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .slice(-limit)
    .map(sanitizeEntry)
    .filter((entry): entry is EmotionEntryPayload => entry !== null && !!entry.date && !!entry.emotion);
}

function sanitizeMemoryNotes(value: unknown): string {
  return clampText(value, 24000);
}

async function generateText(prompt: string, temperature: number): Promise<string> {
  const response = await getAiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature,
      topP: 1,
      topK: 32,
    },
  });

  return response.text.trim();
}

async function generateJson<T>(prompt: string, schema: Record<string, unknown>, temperature: number): Promise<T> {
  const response = await getAiClient().models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature,
    },
  });

  return JSON.parse(response.text) as T;
}

function formatEntries(entries: EmotionEntryPayload[]): string {
  return entries
    .map((entry) => {
      const tradeCount = entry.tradingData?.trades?.length ?? 0;
      const pnlPart = typeof entry.pnl === 'number' ? ` PnL: ${entry.pnl}.` : '';
      return `- Date: ${entry.date}, Emotion: ${entry.emotion} (Intensity: ${entry.intensity}/10).${pnlPart} Trades: ${tradeCount}. Notes: "${entry.notes ?? 'No notes.'}"`;
    })
    .join('\n');
}

export async function buildEmotionInsight(entryInput: unknown): Promise<string> {
  const entry = sanitizeEntry(entryInput);
  if (!entry) {
    throw new Error('A valid journal entry is required.');
  }

  return generateText(
    `
You are an empathetic and insightful AI companion for Deltajournal.
A user has logged the following entry:
- Emotion: ${entry.emotion}
- Intensity (1-10): ${entry.intensity}
- Notes: "${entry.notes ?? 'No notes were provided.'}"

Provide a short (2-3 sentences), constructive, supportive reflection.
Speak like a wise and caring friend. Do not use markdown or lists.
If the notes are empty, reflect on the emotion and intensity itself.
    `,
    0.7,
  );
}

export async function buildTrendsSummary(entriesInput: unknown): Promise<string> {
  const entries = sanitizeEntries(entriesInput, 90);
  if (entries.length === 0) {
    return 'Not enough data to generate a summary. Start by logging your emotions daily!';
  }

  return generateText(
    `
You are an expert mental wellness and data analyst AI. You are analyzing a user's Deltajournal entries for the past month.
Here is the data:
${formatEntries(entries)}

Please provide a concise, high-level summary of the user's emotional trends.
- Start with a general observation about their overall emotional landscape.
- Identify the most frequently logged emotions.
- Point out any patterns or connections you notice.
- Conclude with a positive and encouraging note.

Keep the entire response to about 4-5 sentences. Do not use markdown.
    `,
    0.8,
  );
}

export async function buildReportAnalysis(entriesInput: unknown, startDate: unknown, endDate: unknown): Promise<ReportAnalysisPayload> {
  const entries = sanitizeEntries(entriesInput, 120);
  if (entries.length === 0) {
    return {
      summary: 'No entries found in the selected date range.',
      emotionFrequency: 'Not applicable.',
      intensityTrend: 'Not applicable.',
      insights: 'Log some entries in this period to generate a report.',
    };
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      emotionFrequency: { type: Type.STRING },
      intensityTrend: { type: Type.STRING },
      insights: { type: Type.STRING },
    },
    required: ['summary', 'emotionFrequency', 'intensityTrend', 'insights'],
  };

  return generateJson<ReportAnalysisPayload>(
    `
Analyze the following Deltajournal entries from ${clampText(startDate, 32)} to ${clampText(endDate, 32)} and generate a wellness report.
Data:
${formatEntries(entries)}
    `,
    schema,
    0.7,
  );
}

export async function buildTraderProfile(entriesInput: unknown): Promise<TraderProfilePayload> {
  const entries = sanitizeEntries(entriesInput, 60);
  if (entries.length === 0) {
    return {
      summary: 'Not enough data to form a profile.',
      identifiedTriggers: [],
      behavioralPatterns: [],
    };
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      identifiedTriggers: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      behavioralPatterns: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: ['summary', 'identifiedTriggers', 'behavioralPatterns'],
  };

  return generateJson<TraderProfilePayload>(
    `
You are an expert trading psychologist AI. Analyze the following journal entries to build a behavioral profile of the trader.
Look for correlations between emotions, PnL, trade volume, and the notes provided.
Data:
${formatEntries(entries)}
    `,
    schema,
    0.7,
  );
}

export async function buildRiskPrediction(profileInput: unknown, currentStateInput: unknown): Promise<RiskPredictionPayload> {
  const profile = profileInput as TraderProfilePayload | null;
  const currentState = sanitizeEntry(currentStateInput);

  if (!profile || !currentState) {
    throw new Error('A trader profile and current entry are required.');
  }

  const schema = {
    type: Type.OBJECT,
    properties: {
      prediction: { type: Type.STRING },
      riskScore: { type: Type.NUMBER },
      advice: { type: Type.STRING },
    },
    required: ['prediction', 'riskScore', 'advice'],
  };

  return generateJson<RiskPredictionPayload>(
    `
You are an expert trading coach AI.
Trader Profile:
Summary: ${clampText(profile.summary, 1200)}
Triggers: ${(profile.identifiedTriggers ?? []).map((value) => clampText(value, 160)).join(', ')}
Patterns: ${(profile.behavioralPatterns ?? []).map((value) => clampText(value, 160)).join(', ')}

Current State before trading:
Emotion: ${currentState.emotion} (Intensity: ${currentState.intensity}/10)
Notes: "${currentState.notes ?? 'None'}"

Based on their profile and current state, predict their risk of emotional trading today and provide advice.
    `,
    schema,
    0.6,
  );
}

export async function buildMemoryChatReply(memoryNotesInput: unknown, messageInput: unknown, entriesInput: unknown, languageInput: unknown): Promise<string> {
  const memoryNotes = sanitizeMemoryNotes(memoryNotesInput);
  const message = clampText(messageInput, 4000);
  const entries = sanitizeEntries(entriesInput, 45);
  const responseLanguage = clampText(languageInput, 8) === 'es' ? 'Spanish' : 'English';

  if (!message) {
    throw new Error('A message is required to chat with Memory.');
  }

  return generateText(
    `
You are Delta Journal Memory, a concise AI trading coach inside a journaling app.

Your job:
- Treat the trader's MEMORY.md notes as the primary source of truth.
- Help them stay aligned with their own written process and pattern recognition.
- Point out contradictions between what they are asking now and what they previously wrote.
- If the notes do not support an answer, say that clearly instead of inventing context.
- Do not give financial guarantees. Keep the response practical, grounded, and short.

Reply in ${responseLanguage}.
Use short paragraphs or compact bullet points when they help clarity.

MEMORY.md:
${memoryNotes || 'No memory notes have been saved yet.'}

Recent journal entries:
${entries.length > 0 ? formatEntries(entries) : 'No recent journal entries available.'}

User message:
${message}
    `,
    0.5,
  );
}
