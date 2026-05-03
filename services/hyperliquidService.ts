const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

const HIP3_SYMBOLS = ['SP500', 'XYZ100'];

function formatCoinSymbol(coin: string): string {
  if (HIP3_SYMBOLS.includes(coin)) {
    return `xyz:${coin}`;
  }
  return coin;
}

async function fetchCandlesWithRetry(coin: string, interval: string = '1d', days: number = 30, retries: number = 3): Promise<Candle[]> {
  const formattedCoin = formatCoinSymbol(coin);
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const endTime = Date.now();
      const startTime = endTime - days * 24 * 60 * 60 * 1000;

      const response = await fetch(HYPERLIQUID_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'candleSnapshot',
          req: {
            coin: formattedCoin,
            interval,
            startTime,
            endTime,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Attempt ${attempt + 1} failed for ${coin}: ${response.status} - ${errorText}`);
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        return [];
      }

      return data.map((c: any) => ({
        time: c.t,
        open: parseFloat(c.o),
        high: parseFloat(c.h),
        low: parseFloat(c.l),
        close: parseFloat(c.c),
        volume: parseFloat(c.v),
      }));
    } catch (error) {
      console.warn(`Attempt ${attempt + 1} error for ${coin}:`, error);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  return [];
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CorrelationData {
  symbol: string;
  name: string;
  correlation: number;
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
  const sumX2 = x.reduce((total, xi) => total + xi * xi, 0);
  const sumY2 = y.reduce((total, yi) => total + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

const SYMBOL_NAMES: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'SOL': 'Solana',
  'OP': 'Optimism',
  'APE': 'ApeCoin',
  'MATIC': 'Polygon',
  'AVAX': 'Avalanche',
  'LINK': 'Chainlink',
  'UNI': 'Uniswap',
  'APT': 'Aptos',
  'ARB': 'Arbitrum',
  'ES': 'E-Mini S&P',
  'SP500': 'S&P 500',
  'XYZ100': 'Nasdaq 100',
};

export async function getAssetCorrelations(baseAsset: string, targetAssets: string[]): Promise<CorrelationData[]> {
  const [baseCandles, ...targetCandlesResults] = await Promise.all(
    [baseAsset, ...targetAssets].map(asset => fetchCandlesWithRetry(asset, '1d', 30))
  );

  if (baseCandles.length === 0) {
    return targetAssets.map(symbol => ({
      symbol,
      name: SYMBOL_NAMES[symbol] || symbol,
      correlation: 0,
    }));
  }

  const basePrices = baseCandles.map(c => c.close);
  const baseTimes = baseCandles.map(c => c.time);

  const correlations: CorrelationData[] = [];

  targetAssets.forEach((targetAsset, index) => {
    const targetCandles = targetCandlesResults[index];
    
    if (!targetCandles || targetCandles.length === 0) {
      correlations.push({
        symbol: targetAsset,
        name: SYMBOL_NAMES[targetAsset] || targetAsset,
        correlation: 0,
      });
      return;
    }

    const targetPrices: number[] = [];
    const alignedBasePrices: number[] = [];

    targetCandles.forEach(candle => {
      const matchingIndex = baseTimes.findIndex(t => Math.abs(t - candle.time) < 24 * 60 * 60 * 1000);
      if (matchingIndex !== -1) {
        targetPrices.push(candle.close);
        alignedBasePrices.push(basePrices[matchingIndex]);
      }
    });

    if (alignedBasePrices.length < 5) {
      correlations.push({
        symbol: targetAsset,
        name: SYMBOL_NAMES[targetAsset] || targetAsset,
        correlation: 0,
      });
      return;
    }

    const correlation = calculatePearsonCorrelation(alignedBasePrices, targetPrices);
    
    correlations.push({
      symbol: targetAsset,
      name: SYMBOL_NAMES[targetAsset] || targetAsset,
      correlation,
    });
  });

  return correlations;
}