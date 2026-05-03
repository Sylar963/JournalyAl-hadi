import { GoogleGenAI, Type } from "@google/genai";
import { EmotionEntry } from '../types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
}

export interface TraderProfile {
  summary: string;
  identifiedTriggers: string[];
  behavioralPatterns: string[];
}

export interface RiskPrediction {
  prediction: string;
  riskScore: number; // 0-100
  advice: string;
}

export async function learnTraderSignature(entries: EmotionEntry[]): Promise<TraderProfile> {
  if (entries.length === 0) {
    return {
      summary: "Not enough data to form a profile.",
      identifiedTriggers: [],
      behavioralPatterns: []
    };
  }

  const model = "gemini-2.5-flash";
  const recentEntries = entries.slice(-30); // Use last 30 for relevance

  const entriesSummary = recentEntries
    .map(e => {
        const pnlStr = e.pnl !== undefined ? ` PnL: ${e.pnl}` : '';
        const tradeCount = e.tradingData?.trades?.length || 0;
        return `- Date: ${e.date}, Emotion: ${e.emotion} (Intensity: ${e.intensity}/10).${pnlStr} Trades: ${tradeCount}. Notes: "${e.notes || 'No notes.'}"`;
    })
    .join("\n");
  
  const prompt = `
      You are an expert trading psychologist AI. Analyze the following journal entries to build a behavioral profile of the trader.
      Look for correlations between emotions, PnL, trade volume, and the notes provided.
      Data:
      ${entriesSummary}
  `;
  
  const schema = {
      type: Type.OBJECT,
      properties: {
          summary: { 
              type: Type.STRING, 
              description: "A high-level summary of the trader's psychological profile (2-3 sentences)." 
          },
          identifiedTriggers: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of specific events or emotions that trigger poor trading behavior." 
          },
          behavioralPatterns: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of recurring behavioral patterns observed (e.g., 'Increases trade frequency after a loss')." 
          },
      },
      required: ["summary", "identifiedTriggers", "behavioralPatterns"]
  };

  try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
              responseMimeType: "application/json",
              responseSchema: schema,
              temperature: 0.7,
          }
      });

      return JSON.parse(response.text) as TraderProfile;
  } catch (error) {
      console.error("Error learning trader signature from Gemini:", error);
      throw new Error("Failed to communicate with AI for behavior learning.");
  }
}

export async function predictNextSessionRisk(profile: TraderProfile, currentState: EmotionEntry): Promise<RiskPrediction> {
    const model = "gemini-2.5-flash";
    
    const prompt = `
        You are an expert trading coach AI. 
        Trader Profile:
        Summary: ${profile.summary}
        Triggers: ${profile.identifiedTriggers.join(', ')}
        Patterns: ${profile.behavioralPatterns.join(', ')}

        Current State before trading:
        Emotion: ${currentState.emotion} (Intensity: ${currentState.intensity}/10)
        Notes: "${currentState.notes || 'None'}"

        Based on their profile and current state, predict their risk of emotional trading (tilt) today and provide advice.
    `;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            prediction: { 
                type: Type.STRING, 
                description: "A short assessment of their current state relative to their patterns." 
            },
            riskScore: { 
                type: Type.NUMBER, 
                description: "Estimated risk of tilt from 0 (Safe) to 100 (High Risk)." 
            },
            advice: { 
                type: Type.STRING, 
                description: "Actionable, empathetic advice for the upcoming session (1-2 sentences)." 
            },
        },
        required: ["prediction", "riskScore", "advice"]
    };
  
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.6,
            }
        });
  
        return JSON.parse(response.text) as RiskPrediction;
    } catch (error) {
        console.error("Error predicting risk from Gemini:", error);
        throw new Error("Failed to predict session risk.");
    }
}
