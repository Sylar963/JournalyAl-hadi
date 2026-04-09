import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TradeDetails } from '../types';
import { useI18n } from '../hooks/useI18n';

interface PayoffChartProps {
  type: string;
  trade?: Partial<TradeDetails> | null;
}

const width = 400;
const height = 220;
const padding = 24;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isFutureType(type: string) {
  return type === 'Long Future' || type === 'Short Future';
}

function getChartType(type: string) {
  if (type === 'Long Future') return 'long_future';
  if (type === 'Short Future') return 'short_future';
  if (type.includes('Call') && (type.includes('BTO') || type.includes('Long'))) return 'buy_call';
  if (type.includes('Put') && (type.includes('BTO') || type.includes('Long'))) return 'buy_put';
  return null;
}

const PayoffChart: React.FC<PayoffChartProps> = ({ type, trade }) => {
  const { t } = useI18n();

  const chartType = useMemo(() => getChartType(type), [type]);

  const liveFutureView = useMemo(() => {
    if (!trade || !isFutureType(type)) return null;

    const entryPrice = trade.entryPrice ?? trade.price;
    const markPrice = trade.markPrice;
    const liquidationPrice = trade.liquidationPrice;
    const quantity = Math.abs(trade.quantity ?? trade.contracts ?? 1);

    if (!isFiniteNumber(entryPrice) || !Number.isFinite(quantity) || quantity <= 0) {
      return null;
    }

    const referencePrices = [entryPrice, markPrice, liquidationPrice].filter(isFiniteNumber);
    if (referencePrices.length === 0) return null;

    const rawMin = Math.min(...referencePrices);
    const rawMax = Math.max(...referencePrices);
    const span = Math.max(rawMax - rawMin, entryPrice * 0.08, 1);
    const domainMin = Math.max(0, rawMin - span * 0.35);
    const domainMax = rawMax + span * 0.35;

    const sampleCount = 28;
    const prices = Array.from({ length: sampleCount }, (_, index) => {
      const ratio = index / (sampleCount - 1);
      return domainMin + (domainMax - domainMin) * ratio;
    });

    const pnlForPrice = (price: number) => {
      if (type === 'Short Future') {
        return (entryPrice - price) * quantity;
      }
      return (price - entryPrice) * quantity;
    };

    const pnlValues = prices.map(pnlForPrice);
    const minPnl = Math.min(...pnlValues, 0);
    const maxPnl = Math.max(...pnlValues, 0);
    const pnlSpan = Math.max(maxPnl - minPnl, Math.abs(maxPnl) * 0.25, Math.abs(minPnl) * 0.25, 1);
    const yMin = minPnl - pnlSpan * 0.08;
    const yMax = maxPnl + pnlSpan * 0.08;

    const priceToX = (price: number) => padding + ((price - domainMin) / (domainMax - domainMin)) * (width - padding * 2);
    const pnlToY = (pnl: number) => height - padding - ((pnl - yMin) / (yMax - yMin)) * (height - padding * 2);
    const zeroY = pnlToY(0);

    const points = prices.map((price) => ({
      price,
      pnl: pnlForPrice(price),
      x: priceToX(price),
      y: pnlToY(pnlForPrice(price)),
    }));

    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${zeroY.toFixed(2)} L ${points[0].x.toFixed(2)} ${zeroY.toFixed(2)} Z`;

    const markers = [
      isFiniteNumber(entryPrice) ? { label: t('bybit.entry_price'), price: entryPrice, color: '#cbd5e1' } : null,
      isFiniteNumber(markPrice) ? { label: t('bybit.mark_price'), price: markPrice, color: '#22d3ee' } : null,
      isFiniteNumber(liquidationPrice) ? { label: t('bybit.liquidation_price'), price: liquidationPrice, color: '#f59e0b' } : null,
    ].filter((marker): marker is { label: string; price: number; color: string } => marker !== null);

    const currentPnl = isFiniteNumber(trade.unrealizedPnl) ? trade.unrealizedPnl : (isFiniteNumber(markPrice) ? pnlForPrice(markPrice) : undefined);

    return {
      areaPath,
      currentPnl,
      linePath,
      markers,
      points,
      pnlToY,
      priceToX,
      yMax,
      yMin,
      zeroY,
    };
  }, [trade, type, t]);

  if (!chartType) return null;

  const fallbackData = (() => {
    const zeroY = height / 2;
    const centerX = width / 2;
    const strokeColor = '#818cf8';
    const fill = 'url(#pnl-gradient)';

    switch (chartType) {
      case 'long_future':
        return {
          path: `M ${padding},${height - padding} L ${width - padding},${padding}`,
          areaPath: `M ${padding},${height - padding} L ${width - padding},${padding} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`,
          zeroY,
          strokeColor,
          fill,
        };
      case 'short_future':
        return {
          path: `M ${padding},${padding} L ${width - padding},${height - padding}`,
          areaPath: `M ${padding},${padding} L ${width - padding},${height - padding} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`,
          zeroY,
          strokeColor,
          fill,
        };
      case 'buy_call': {
        const strikeX = centerX - 40;
        const lossY = zeroY + 40;
        const rightY = lossY - ((width - padding) - strikeX);
        return {
          path: `M ${padding},${lossY} L ${strikeX},${lossY} L ${width - padding},${rightY}`,
          areaPath: `M ${padding},${lossY} L ${strikeX},${lossY} L ${width - padding},${rightY} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`,
          zeroY,
          strokeColor,
          fill,
        };
      }
      case 'buy_put': {
        const strikeX = centerX + 40;
        const lossY = zeroY + 40;
        const leftY = lossY - (strikeX - padding);
        return {
          path: `M ${padding},${leftY} L ${strikeX},${lossY} L ${width - padding},${lossY}`,
          areaPath: `M ${padding},${leftY} L ${strikeX},${lossY} L ${width - padding},${lossY} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`,
          zeroY,
          strokeColor,
          fill,
        };
      }
      default:
        return null;
    }
  })();

  const subtitle = liveFutureView ? t('modal.entry.payoff_live') : t('modal.entry.payoff_simulation');
  const accentColor = liveFutureView ? '#22d3ee' : '#818cf8';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, maxHeight: 0 }}
      animate={{ opacity: 1, scale: 1, maxHeight: 500 }}
      exit={{ opacity: 0, scale: 0.98, maxHeight: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-full relative overflow-hidden rounded-xl border border-[color:var(--glass-border)] bg-black/40 backdrop-blur-md mb-6 shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      <div className="absolute top-4 left-4 z-10 flex flex-col">
        <h4 className="text-sm font-bold text-white tracking-wide shadow-black drop-shadow-md">{type.toUpperCase()}</h4>
        <span className="text-[10px] font-mono" style={{ color: accentColor }}>{subtitle.toUpperCase()}</span>
      </div>

      {liveFutureView?.currentPnl !== undefined && (
        <div className="absolute top-4 right-4 z-10 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-mono text-white backdrop-blur-sm">
          {t('bybit.unrealized_pnl')}: {liveFutureView.currentPnl >= 0 ? '+' : ''}{liveFutureView.currentPnl.toFixed(2)}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-52 md:h-60 object-cover"
        style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.5))' }}
      >
        <defs>
          <linearGradient id="pnl-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(46, 213, 115, 0.25)" />
            <stop offset="45%" stopColor="rgba(46, 213, 115, 0.1)" />
            <stop offset="50%" stopColor="rgba(46, 213, 115, 0)" />
            <stop offset="50%" stopColor="rgba(255, 71, 87, 0)" />
            <stop offset="55%" stopColor="rgba(255, 71, 87, 0.1)" />
            <stop offset="100%" stopColor="rgba(255, 71, 87, 0.25)" />
          </linearGradient>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        <line
          x1={0}
          y1={liveFutureView ? liveFutureView.zeroY : fallbackData?.zeroY ?? height / 2}
          x2={width}
          y2={liveFutureView ? liveFutureView.zeroY : fallbackData?.zeroY ?? height / 2}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />

        {liveFutureView ? (
          <>
            {liveFutureView.markers.map((marker) => {
              const x = liveFutureView.priceToX(marker.price);
              return (
                <g key={`${marker.label}-${marker.price}`}>
                  <line x1={x} y1={padding} x2={x} y2={height - padding} stroke={marker.color} strokeOpacity="0.7" strokeDasharray="4 4" />
                  <text x={x + 4} y={padding + 12} fill={marker.color} fontSize="10" fontWeight="600">
                    {marker.label}
                  </text>
                </g>
              );
            })}

            <motion.path
              d={liveFutureView.areaPath}
              fill="url(#pnl-gradient)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />

            <motion.path
              d={liveFutureView.linePath}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0 0 10px rgba(34,211,238,0.65))"
            />

            {trade?.markPrice !== undefined && liveFutureView.currentPnl !== undefined && (
              <circle
                cx={liveFutureView.priceToX(trade.markPrice)}
                cy={liveFutureView.pnlToY(liveFutureView.currentPnl)}
                r="4.5"
                fill="#22d3ee"
                stroke="rgba(255,255,255,0.85)"
                strokeWidth="1.5"
              />
            )}
          </>
        ) : fallbackData ? (
          <>
            <motion.path
              d={fallbackData.areaPath}
              fill={fallbackData.fill}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
            />

            <motion.path
              d={fallbackData.path}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              fill="none"
              stroke={fallbackData.strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`drop-shadow(0 0 8px ${fallbackData.strokeColor})`}
            />
          </>
        ) : null}
      </svg>

      {liveFutureView && trade && (
        <div className="grid grid-cols-3 gap-2 border-t border-white/5 bg-black/20 px-4 py-3 text-[11px] text-gray-300">
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <div className="text-gray-500">{t('bybit.entry_price')}</div>
            <div className="font-mono text-white">{isFiniteNumber(trade.entryPrice ?? trade.price) ? (trade.entryPrice ?? trade.price)!.toFixed(4) : '--'}</div>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <div className="text-gray-500">{t('bybit.mark_price')}</div>
            <div className="font-mono text-white">{isFiniteNumber(trade.markPrice) ? trade.markPrice.toFixed(4) : '--'}</div>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <div className="text-gray-500">{t('bybit.liquidation_price')}</div>
            <div className="font-mono text-amber-200">{isFiniteNumber(trade.liquidationPrice) ? trade.liquidationPrice.toFixed(4) : '--'}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PayoffChart;
