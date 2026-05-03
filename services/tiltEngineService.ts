import { EmotionEntry, TradeDetails, TiltMetrics, EmotionType } from '../types';

// Constants for weights
const WEIGHT_EMOTIONAL = 0.4;
const WEIGHT_REVENGE = 0.4;
const WEIGHT_LEVERAGE = 0.2;

const NEGATIVE_EMOTIONS: EmotionType[] = ['angry', 'anxious', 'sad'];

/**
 * Calculates a 'Tilt Index' (0-100) indicating the likelihood of emotional trading.
 */
export function calculateTiltIndex(
  currentEntry: EmotionEntry,
  historicalEntries: EmotionEntry[] = []
): TiltMetrics {
  
  const allEntries = [...historicalEntries, currentEntry];
  const allTrades = allEntries.flatMap(e => e.tradingData?.trades ?? []);

  // 1. Emotional Factor (0-100)
  const emotionalFactor = calculateEmotionalFactor(currentEntry);

  // 2. Revenge Trading Factor (0-100)
  const revengeFactor = calculateRevengeFactor(currentEntry, allTrades);

  // 3. Leverage Inflation Factor (0-100)
  const leverageFactor = calculateLeverageFactor(currentEntry, allTrades);

  // Composite Score
  const rawScore = 
    (emotionalFactor * WEIGHT_EMOTIONAL) + 
    (revengeFactor * WEIGHT_REVENGE) + 
    (leverageFactor * WEIGHT_LEVERAGE);

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Determine Risk Level
  let riskLevel: TiltMetrics['riskLevel'] = 'low';
  if (score >= 80) riskLevel = 'critical';
  else if (score >= 50) riskLevel = 'high';
  else if (score >= 25) riskLevel = 'moderate';

  // Generate Triggers
  const triggers: string[] = [];
  if (emotionalFactor > 70) triggers.push(`High intensity negative emotion (${currentEntry.emotion})`);
  if (revengeFactor > 50) triggers.push('Potential revenge trading pattern detected');
  if (leverageFactor > 60) triggers.push('Higher than usual leverage/position size');

  return {
    score,
    riskLevel,
    triggers,
  };
}

function calculateEmotionalFactor(entry: EmotionEntry): number {
  if (NEGATIVE_EMOTIONS.includes(entry.emotion)) {
    // Maps intensity 1-10 to 10-100
    return entry.intensity * 10; 
  }
  return 0; // 'happy' or 'calm' don't contribute to baseline emotional tilt
}

function calculateRevengeFactor(currentEntry: EmotionEntry, allTrades: TradeDetails[]): number {
  const currentTrades = currentEntry.tradingData?.trades ?? [];
  if (currentTrades.length === 0) return 0;

  // Simplified revenge detection: High number of trades today after recent losses.
  // A real implementation might look at timestamps if available, but we use what we have.
  
  // Find recent losses
  const recentLosses = allTrades.filter(t => (t.pnl ?? t.closedPnl ?? 0) < 0);
  
  if (recentLosses.length > 0 && currentTrades.length > 3) {
    // Arbitrary metric: >3 trades after losses suggests overtrading
    return Math.min(100, (currentTrades.length / 5) * 100); 
  }
  
  return 0;
}

function calculateLeverageFactor(currentEntry: EmotionEntry, allTrades: TradeDetails[]): number {
  const currentTrades = currentEntry.tradingData?.trades ?? [];
  if (currentTrades.length === 0) return 0;

  const currentAvgLeverage = getAverageLeverage(currentTrades);
  if (currentAvgLeverage === 0) return 0;

  const historicalTrades = allTrades.filter(t => !currentTrades.find(ct => ct.id === t.id));
  const historicalAvgLeverage = getAverageLeverage(historicalTrades);

  if (historicalAvgLeverage === 0) {
     // No baseline
     return currentAvgLeverage > 10 ? 50 : 0; 
  }

  // If current leverage is > historical leverage, increase factor
  if (currentAvgLeverage > historicalAvgLeverage) {
    const ratio = currentAvgLeverage / historicalAvgLeverage;
    return Math.min(100, (ratio - 1) * 50); // Double leverage = 50 factor
  }

  return 0;
}

function getAverageLeverage(trades: TradeDetails[]): number {
  const leveragedTrades = trades.filter(t => t.leverage && t.leverage > 0);
  if (leveragedTrades.length === 0) return 0;
  
  const sum = leveragedTrades.reduce((acc, t) => acc + (t.leverage ?? 0), 0);
  return sum / leveragedTrades.length;
}
