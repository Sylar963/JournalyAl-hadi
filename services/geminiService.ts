import { GoogleGenAI, Type } from "@google/genai";
import { type EmotionEntry, type ReportAnalysis } from '../types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    // The API key is expected to be securely provided as an environment variable.
    // This is the standard and secure way to handle API keys.
    aiClient = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiClient;
}


export async function getEmotionInsight(entry: EmotionEntry): Promise<string> {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are an empathetic and insightful AI companion for Deltajournal.
    A user has logged the following entry:
    - Emotion: ${entry.emotion}
    - Intensity (1-10): ${entry.intensity}
    - Notes: "${entry.notes || 'No notes were provided.'}"

    Based on this, provide a short (2-3 sentences), constructive, and supportive reflection. 
    Speak like a wise and caring friend. Do not use markdown or lists. Just provide a gentle paragraph of text.
    If the notes are empty, reflect on the emotion and intensity itself.
    `;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            temperature: 0.7,
            topP: 1,
            topK: 32,
        }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Failed to communicate with the AI model.");
  }
}

export async function getTrendsSummary(entries: EmotionEntry[]): Promise<string> {
    if (entries.length === 0) {
        return "Not enough data to generate a summary. Start by logging your emotions daily!";
    }

    const model = "gemini-2.5-flash";

    const entriesSummary = entries
        .map(e => `- On ${e.date}, felt ${e.emotion} (Intensity: ${e.intensity}/10). Notes: "${e.notes || 'No notes.'}"`)
        .join("\n");
    
    const prompt = `
        You are an expert mental wellness and data analyst AI. You are analyzing a user's Deltajournal entries for the past month.
        Here is the data:
        ${entriesSummary}

        Please provide a concise, high-level summary of the user's emotional trends. Your response should be structured in a friendly and encouraging tone.
        - Start with a general observation about their overall emotional landscape.
        - Identify the most frequently logged emotions.
        - Point out any potential patterns or connections you notice (e.g., "It seems that feelings of anxiety often came up on weekdays...").
        - Conclude with a positive and encouraging note.

        Keep the entire response to about 4-5 sentences. Do not use markdown, just a single paragraph of text.
    `;

    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.8,
                topP: 1,
                topK: 40,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating trends summary from Gemini:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to communicate with the AI model for trends analysis.");
    }
}

export async function getReportAnalysis(entries: EmotionEntry[], startDate: string, endDate: string): Promise<ReportAnalysis> {
  if (entries.length === 0) {
      return {
          summary: "No entries found in the selected date range.",
          emotionFrequency: "Not applicable.",
          intensityTrend: "Not applicable.",
          insights: "Log some entries in this period to generate a report."
      };
  }

  const model = "gemini-2.5-flash";

  const entriesSummary = entries
      .map(e => `- On ${e.date}, felt ${e.emotion} (Intensity: ${e.intensity}/10). Notes: "${e.notes || 'No notes.'}"`)
      .join("\n");
  
  const prompt = `
      Analyze the following Deltajournal entries from ${startDate} to ${endDate} and generate a wellness report.
      Data:
      ${entriesSummary}
  `;
  
  const schema = {
      type: Type.OBJECT,
      properties: {
          summary: { 
              type: Type.STRING, 
              description: "A brief, high-level overview of the user's emotional state during this period. (2-3 sentences)" 
          },
          emotionFrequency: { 
              type: Type.STRING, 
              description: "Identify the most common emotions and their counts or percentages. Describe this pattern. (2-3 sentences)" 
          },
          intensityTrend: { 
              type: Type.STRING, 
              description: "Analyze the average emotional intensity. Was it high or low? Were there any noticeable spikes? (2-3 sentences)" 
          },
          insights: { 
              type: Type.STRING, 
              description: "Offer 2-3 thoughtful, actionable insights or reflective questions based on the data, speaking in a supportive and encouraging tone. (3-4 sentences)" 
          },
      },
      required: ["summary", "emotionFrequency", "intensityTrend", "insights"]
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

      const jsonString = response.text;
      return JSON.parse(jsonString) as ReportAnalysis;

  } catch (error) {
      console.error("Error generating report from Gemini:", error);
      if (error instanceof Error) {
          throw error;
      }
      throw new Error("Failed to communicate with the AI model for the report.");
  }
}