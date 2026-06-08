const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

export const CORRELATION_CRYPTO_ASSETS = ['BTC', 'ETH', 'SOL', 'LINK', 'AVAX', 'HYPE', 'LIT', 'ARB', 'OP', 'ONDO', 'SUI', 'XLM', 'ENA', 'HBAR', 'ZEC'];

const KNOWN_CRYPTO_SYMBOLS = CORRELATION_CRYPTO_ASSETS;

const XYZ_MARKET_SYMBOLS_FALLBACK = [
  'AAPL', 'ALUMINIUM', 'AMD', 'AMZN', 'ARM', 'ASML', 'AVGO', 'BABA', 'BB', 'BIRD', 'BRENTOIL', 'BX', 'CBRS', 'CL',
  'COIN', 'COPPER', 'CORN', 'COST', 'CRCL', 'CRWV', 'DELL', 'DKNG', 'DRAM', 'DXY', 'EBAY', 'EUR', 'EWJ', 'EWT',
  'EWY', 'EWZ', 'GBP', 'GME', 'GOLD', 'GOOGL', 'H100', 'HIMS', 'HOOD', 'HYUNDAI', 'IBM', 'IBOV', 'INTC', 'JP225',
  'JPY', 'KIOXIA', 'KR200', 'KRW', 'LITE', 'LLY', 'META', 'MINIMAX', 'MRVL', 'MSFT', 'MSTR', 'MU', 'NATGAS', 'NBIS',
  'NFLX', 'NIFTY', 'NOW', 'NVDA', 'ORCL', 'PALLADIUM', 'PLATINUM', 'PLTR', 'PURRDAT', 'QNT', 'RIVN', 'RKLB',
  'SILVER', 'SKHX', 'SMSN', 'SNDK', 'SOFTBANK', 'SP500', 'SPCX', 'TSLA', 'TSM', 'TTF', 'URANIUM', 'URNM', 'USAR',
  'VIX', 'VOL', 'WDC', 'WHEAT', 'XLE', 'XYZ100', 'ZM',
];

let xyzMarketSymbolCache: string[] | null = null;

interface CandleSnapshot {
  t: number;
  o: string;
  h: string;
  l: string;
  c: string;
  v: string;
}

function isCandleSnapshot(value: unknown): value is CandleSnapshot {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candle = value as Partial<CandleSnapshot>;
  return typeof candle.t === 'number'
    && typeof candle.o === 'string'
    && typeof candle.h === 'string'
    && typeof candle.l === 'string'
    && typeof candle.c === 'string'
    && typeof candle.v === 'string';
}

function formatCoinSymbol(coin: string): string {
  const knownXyzSymbols = xyzMarketSymbolCache ?? XYZ_MARKET_SYMBOLS_FALLBACK;
  if (knownXyzSymbols.includes(coin)) {
    return `xyz:${coin}`;
  }
  return coin;
}

function getFormattedCoinCandidates(coin: string): string[] {
  if (coin.startsWith('xyz:')) {
    return [coin];
  }

  const formattedCoin = formatCoinSymbol(coin);
  if (formattedCoin !== coin || KNOWN_CRYPTO_SYMBOLS.includes(coin)) {
    return [formattedCoin];
  }

  return [`xyz:${coin}`, coin];
}

function getSymbolName(symbol: string): string {
  return SYMBOL_NAMES[symbol] || symbol;
}

function parseXyzMarketSymbols(data: unknown): string[] {
  if (!Array.isArray(data)) {
    return [];
  }

  const symbols = data.flatMap((dex) => {
    if (!dex || typeof dex !== 'object' || !Array.isArray((dex as { assetToStreamingOiCap?: unknown }).assetToStreamingOiCap)) {
      return [];
    }

    return (dex as { assetToStreamingOiCap: unknown[] }).assetToStreamingOiCap.flatMap((entry) => {
      if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !entry[0].startsWith('xyz:')) {
        return [];
      }
      return entry[0].replace('xyz:', '');
    });
  });

  return Array.from(new Set(symbols)).sort((a, b) => a.localeCompare(b));
}

async function fetchCandlesWithRetry(coin: string, interval: string = '1d', days: number = 30, retries: number = 3): Promise<Candle[]> {
  for (const formattedCoin of getFormattedCoinCandidates(coin)) {
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
          console.warn(`Attempt ${attempt + 1} failed for ${formattedCoin}: ${response.status} - ${errorText}`);
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

        const candles = data.filter(isCandleSnapshot).map((c) => ({
          time: c.t,
          open: parseFloat(c.o),
          high: parseFloat(c.h),
          low: parseFloat(c.l),
          close: parseFloat(c.c),
          volume: parseFloat(c.v),
        }));

        if (candles.length > 0) {
          return candles;
        }
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} error for ${formattedCoin}:`, error);
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
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

export interface CorrelationAssetOption {
  symbol: string;
  name: string;
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
  'HYPE': 'Hyperliquid',
  'LIT': 'Litentry',
  'ONDO': 'Ondo',
  'SUI': 'Sui',
  'XLM': 'Stellar',
  'ENA': 'Ethena',
  'HBAR': 'Hedera',
  'ZEC': 'Zcash',
  'ES': 'E-Mini S&P',
  'SP500': 'S&P 500',
  'XYZ100': 'Nasdaq 100',
  'AAPL': 'Apple',
  'AMD': 'AMD',
  'AMZN': 'Amazon',
  'AVGO': 'Broadcom',
  'COIN': 'Coinbase',
  'GOOGL': 'Alphabet',
  'META': 'Meta',
  'MSFT': 'Microsoft',
  'MSTR': 'MicroStrategy',
  'NVDA': 'Nvidia',
  'PLTR': 'Palantir',
  'TSLA': 'Tesla',
  'TSM': 'TSMC',
};

export async function getCorrelationAssetOptions(): Promise<{ crypto: CorrelationAssetOption[]; stocks: CorrelationAssetOption[] }> {
  let xyzSymbols = xyzMarketSymbolCache;

  if (!xyzSymbols) {
    try {
      const response = await fetch(HYPERLIQUID_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'perpDexs' }),
      });

      if (response.ok) {
        const data = await response.json();
        xyzSymbols = parseXyzMarketSymbols(data);
      }
    } catch (error) {
      console.warn('Unable to load Hyperliquid XYZ market symbols:', error);
    }
  }

  xyzMarketSymbolCache = xyzSymbols && xyzSymbols.length > 0 ? xyzSymbols : XYZ_MARKET_SYMBOLS_FALLBACK;

  return {
    crypto: CORRELATION_CRYPTO_ASSETS.map((symbol) => ({ symbol, name: getSymbolName(symbol) })),
    stocks: xyzMarketSymbolCache.map((symbol) => ({ symbol, name: getSymbolName(symbol) })),
  };
}

export async function getAssetCorrelations(baseAsset: string, targetAssets: string[]): Promise<CorrelationData[]> {
  const [baseCandles, ...targetCandlesResults] = await Promise.all(
    [baseAsset, ...targetAssets].map(asset => fetchCandlesWithRetry(asset, '1d', 30))
  );

  if (baseCandles.length === 0) {
    return targetAssets.map(symbol => ({
      symbol,
      name: getSymbolName(symbol),
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
        name: getSymbolName(targetAsset),
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
        name: getSymbolName(targetAsset),
        correlation: 0,
      });
      return;
    }

    const correlation = calculatePearsonCorrelation(alignedBasePrices, targetPrices);
    
    correlations.push({
      symbol: targetAsset,
      name: getSymbolName(targetAsset),
      correlation,
    });
  });

  return correlations;
}
