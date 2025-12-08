
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PayoffChartProps {
  type: string;
}

const PayoffChart: React.FC<PayoffChartProps> = ({ type }) => {
  // Normalize trade type to supported chart types
  const chartType = useMemo(() => {
    if (type === 'Long Future') return 'long_future';
    if (type === 'Short Future') return 'short_future';
    if (type.includes('Call') && (type.includes('BTO') || type.includes('Long'))) return 'buy_call';
    if (type.includes('Put') && (type.includes('BTO') || type.includes('Long'))) return 'buy_put';
    // Mapping for sell commands to their inverse or just hiding/defaulting? 
    // User only asked for these 4. Let's return null if not matched to hide it, 
    // or maybe just default to a "neutral" view if we want to be safe.
    // Given the prompt "according to its future or options", I will just hide if not relevant.
    return null;
  }, [type]);

  if (!chartType) return null;

  // SVG Configuration
  const width = 400;
  const height = 200;
  const padding = 20;
  const zeroY = height / 2; // Horizontal Zero Line
  const centerX = width / 2; // Strike/Entry Price

  // Define paths and gradients based on type
  const getChartData = (t: string) => {
      const strokeColor = '#818cf8'; // Indigo-400, consistent for all
      const fill = 'url(#pnl-gradient)';
      
      switch (t) {
        case 'long_future':
          // / Shape
          // Passes through center (Breakeven)
          return {
            path: `M ${padding},${height - padding} L ${width - padding},${padding}`,
            strokeColor,
            areaPath: `M ${padding},${height - padding} L ${width - padding},${padding} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`,
            fill
          };
        case 'short_future':
          // \ Shape
          return {
            path: `M ${padding},${padding} L ${width - padding},${height - padding}`,
            strokeColor,
            areaPath: `M ${padding},${padding} L ${width - padding},${height - padding} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`,
            fill
          };
        case 'buy_call':
          // _/ Shape. 
          // Breakeven is usually Strike + Premium. 
          // Visual: Flat loss starts at left, goes to Strike, then up. Crosses ZeroY at Breakeven.
          const strikeX_call = centerX - 40;
          const breakevenX_call = centerX + 10;
          const lossY_call = zeroY + 40; 
          
          // Path: Start(Left, LossY) -> Strike(StrikeX, LossY) -> End(Right, Top)
          // We need calculate Y at Right edge based on slope. 
          // Slope 1:1 visually.
          const rightY_call = lossY_call - ( (width - padding) - strikeX_call ); 
          
          return {
            path: `M ${padding},${lossY_call} L ${strikeX_call},${lossY_call} L ${width - padding},${rightY_call}`,
            strokeColor,
            areaPath: `M ${padding},${lossY_call} L ${strikeX_call},${lossY_call} L ${width - padding},${rightY_call} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`,
            fill
          };
        case 'buy_put':
          // \_ Shape.
          // Breakeven is Strike - Premium.
          // Visual: High Profit at Left -> Cross ZeroY -> Strike -> Flat Loss
          const strikeX_put = centerX + 40;
          const lossY_put = zeroY + 40;
          const leftY_put = lossY_put - (strikeX_put - padding);
          
          return {
            path: `M ${padding},${leftY_put} L ${strikeX_put},${lossY_put} L ${width - padding},${lossY_put}`,
            strokeColor,
            areaPath: `M ${padding},${leftY_put} L ${strikeX_put},${lossY_put} L ${width - padding},${lossY_put} L ${width - padding},${zeroY} L ${padding},${zeroY} Z`,
            fill
          };
        default:
          return { path: '', strokeColor: '', areaPath: '', fill: '' };
      }
  };

  const { path, strokeColor, areaPath, fill } = getChartData(chartType);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, maxHeight: 0 }}
      animate={{ opacity: 1, scale: 1, maxHeight: 500 }}
      exit={{ opacity: 0, scale: 0.98, maxHeight: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} // smooth cubic bezier
      className="w-full relative overflow-hidden rounded-xl border border-[color:var(--glass-border)] bg-black/40 backdrop-blur-md mb-6 shadow-2xl"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      
      {/* Chart Title / Data */}
      <div className="absolute top-4 left-4 z-10 flex flex-col">
        <h4 className="text-sm font-bold text-white tracking-wide shadow-black drop-shadow-md">{type.toUpperCase()}</h4>
        <span className="text-[10px] text-[var(--accent-primary)] font-mono">PAYOFF SIMULATION</span>
      </div>

      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-48 md:h-56 object-cover"
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
             <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Zero Line */}
        <line x1={0} y1={zeroY} x2={width} y2={zeroY} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        
        {/* Fill Area */}
        <motion.path 
          d={areaPath} 
          fill={fill} 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        />

        {/* Main Payoff Line */}
        <motion.path 
          d={path}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`drop-shadow(0 0 8px ${strokeColor})`}
        />
        
        {/* Breakeven Point(s) - Intersection with ZeroY */}
        {/* Technically I should calculate exact intersection, but for visual approximation... */}
         
      </svg>
    </motion.div>
  );
};

export default PayoffChart;
