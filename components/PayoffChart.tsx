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
const chartPadding = {
  top: 28,
  right: 24,
  bottom: 24,
  left: 24,
};

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
    const priceMagnitude = Math.max(Math.abs(entryPrice), Math.abs(rawMin), Math.abs(rawMax));
    const minimumPriceSpan = priceMagnitude > 0 ? priceMagnitude * 0.08 : 1;
    const span = Math.max(rawMax - rawMin, minimumPriceSpan);
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
    const pnlMagnitude = Math.max(Math.abs(maxPnl), Math.abs(minPnl));
    const minimumPnlSpan = pnlMagnitude > 0 ? pnlMagnitude * 0.25 : 1;
    const pnlSpan = Math.max(maxPnl - minPnl, minimumPnlSpan);
    const yMin = minPnl - pnlSpan * 0.08;
    const yMax = maxPnl + pnlSpan * 0.08;

    const priceToX = (price: number) => chartPadding.left + ((price - domainMin) / (domainMax - domainMin)) * (width - chartPadding.left - chartPadding.right);
    const pnlToY = (pnl: number) => height - chartPadding.bottom - ((pnl - yMin) / (yMax - yMin)) * (height - chartPadding.top - chartPadding.bottom);
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
          path: `M ${chartPadding.left},${height - chartPadding.bottom} L ${width - chartPadding.right},${chartPadding.top}`,
          areaPath: `M ${chartPadding.left},${height - chartPadding.bottom} L ${width - chartPadding.right},${chartPadding.top} L ${width - chartPadding.right},${zeroY} L ${chartPadding.left},${zeroY} Z`,
          zeroY,
          strokeColor,
          fill,
        };
      case 'short_future':
        return {
          path: `M ${chartPadding.left},${chartPadding.top} L ${width - chartPadding.right},${height - chartPadding.bottom}`,
          areaPath: `M ${chartPadding.left},${chartPadding.top} L ${width - chartPadding.right},${height - chartPadding.bottom} L ${width - chartPadding.right},${zeroY} L ${chartPadding.left},${zeroY} Z`,
          zeroY,
          strokeColor,
          fill,
        };
      case 'buy_call': {
        const strikeX = centerX - 40;
        const lossY = zeroY + 40;
        const rightY = lossY - ((width - chartPadding.right) - strikeX);
        return {
          path: `M ${chartPadding.left},${lossY} L ${strikeX},${lossY} L ${width - chartPadding.right},${rightY}`,
          areaPath: `M ${chartPadding.left},${lossY} L ${strikeX},${lossY} L ${width - chartPadding.right},${rightY} L ${width - chartPadding.right},${zeroY} L ${chartPadding.left},${zeroY} Z`,
          zeroY,
          strokeColor,
          fill,
        };
      }
      case 'buy_put': {
        const strikeX = centerX + 40;
        const lossY = zeroY + 40;
        const leftY = lossY - (strikeX - chartPadding.left);
        return {
          path: `M ${chartPadding.left},${leftY} L ${strikeX},${lossY} L ${width - chartPadding.right},${lossY}`,
          areaPath: `M ${chartPadding.left},${leftY} L ${strikeX},${lossY} L ${width - chartPadding.right},${lossY} L ${width - chartPadding.right},${zeroY} L ${chartPadding.left},${zeroY} Z`,
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
  const accentColor = liveFutureView ? '#38bdf8' : '#8eb8ff';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, maxHeight: 0 }}
      animate={{ opacity: 1, scale: 1, maxHeight: 500 }}
      exit={{ opacity: 0, scale: 0.98, maxHeight: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-full relative overflow-hidden rounded-xl journal-panel mb-6"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-3 px-4 pt-4">
        <div className="flex flex-col">
          <p className="journal-kicker">Trade Structure</p>
          <h4 className="text-sm font-semibold text-[var(--text-main)] tracking-wide mt-1 journal-metric">{type.toUpperCase()}</h4>
          <span className="text-[10px] font-mono mt-1" style={{ color: accentColor }}>{subtitle.toUpperCase()}</span>
        </div>

        {liveFutureView?.currentPnl !== undefined && (
          <div className="rounded-full border border-[var(--panel-border)] bg-[var(--surface-2)] px-3 py-1 text-[11px] font-mono text-[var(--text-main)]">
            {t('bybit.unrealized_pnl')}: {liveFutureView.currentPnl >= 0 ? '+' : ''}{liveFutureView.currentPnl.toFixed(2)}
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-52 md:h-60 object-cover"
        style={{ filter: 'drop-shadow(0 0 12px rgba(0,0,0,0.35))' }}
      >
        <defs>
          <linearGradient id="pnl-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(74, 222, 128, 0.22)" />
            <stop offset="45%" stopColor="rgba(74, 222, 128, 0.08)" />
            <stop offset="50%" stopColor="rgba(74, 222, 128, 0)" />
            <stop offset="50%" stopColor="rgba(248, 113, 113, 0)" />
            <stop offset="55%" stopColor="rgba(248, 113, 113, 0.08)" />
            <stop offset="100%" stopColor="rgba(248, 113, 113, 0.22)" />
          </linearGradient>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        <line
          x1={0}
          y1={liveFutureView ? liveFutureView.zeroY : fallbackData?.zeroY ?? height / 2}
          x2={width}
          y2={liveFutureView ? liveFutureView.zeroY : fallbackData?.zeroY ?? height / 2}
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="1"
        />

        {liveFutureView ? (
          <>
            {liveFutureView.markers.map((marker) => {
              const x = liveFutureView.priceToX(marker.price);
              const useRightAnchor = x > width - 88;
              return (
                <g key={`${marker.label}-${marker.price}`}>
                  <line x1={x} y1={chartPadding.top} x2={x} y2={height - chartPadding.bottom} stroke={marker.color} strokeOpacity="0.7" strokeDasharray="4 4" />
                  <text
                    x={useRightAnchor ? x - 6 : x + 6}
                    y={chartPadding.top - 8}
                    fill={marker.color}
                    fontSize="10"
                    fontWeight="600"
                    textAnchor={useRightAnchor ? 'end' : 'start'}
                  >
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
               stroke="#38bdf8"
               strokeWidth="3"
               strokeLinecap="round"
               strokeLinejoin="round"
               filter="drop-shadow(0 0 8px rgba(56,189,248,0.45))"
             />

            {trade?.markPrice !== undefined && liveFutureView.currentPnl !== undefined && (
              <circle
                cx={liveFutureView.priceToX(trade.markPrice)}
                cy={liveFutureView.pnlToY(liveFutureView.currentPnl)}
                r="4.5"
                fill="#38bdf8"
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
        <div className="grid grid-cols-3 gap-2 border-t journal-divider bg-[var(--surface-1)] px-4 py-3 text-[11px] text-[var(--text-muted)]">
          <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
            <div className="text-[var(--text-subtle)]">{t('bybit.entry_price')}</div>
            <div className="font-mono text-[var(--text-main)]">{isFiniteNumber(trade.entryPrice ?? trade.price) ? (trade.entryPrice ?? trade.price)!.toFixed(4) : '--'}</div>
          </div>
          <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
            <div className="text-[var(--text-subtle)]">{t('bybit.mark_price')}</div>
            <div className="font-mono text-[var(--text-main)]">{isFiniteNumber(trade.markPrice) ? trade.markPrice.toFixed(4) : '--'}</div>
          </div>
          <div className="rounded-lg bg-[var(--surface-2)] px-3 py-2">
            <div className="text-[var(--text-subtle)]">{t('bybit.liquidation_price')}</div>
            <div className="font-mono text-amber-200">{isFiniteNumber(trade.liquidationPrice) ? trade.liquidationPrice.toFixed(4) : '--'}</div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PayoffChart;
