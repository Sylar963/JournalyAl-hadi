import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import type { Group } from 'three';
import { type Theme } from '../types';

interface BackgroundProps {
    theme?: Theme;
}

const THEME_COLORS: Record<Theme, { color: string; light: string; ambient: number; bullColor: string; bearColor: string }> = {
    twilight: { color: '#71717a', light: '#ffffff', ambient: 0.4, bullColor: '#22c55e', bearColor: '#ef4444' },
    sunrise: { color: '#ffffff', light: '#a1a1aa', ambient: 0.8, bullColor: '#16a34a', bearColor: '#dc2626' },
    cyberpunk: { color: '#71717a', light: '#ffffff', ambient: 0.6, bullColor: '#00ff88', bearColor: '#ff0066' },
    forest: { color: '#71717a', light: '#ffffff', ambient: 0.4, bullColor: '#4ade80', bearColor: '#f87171' },
};

interface CandleData {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
}

const generateCandle = (prevClose: number, prevDirection?: number): CandleData => {
    const rand = Math.random();
    let volatility = 0.02;
    let direction: number;
    let change: number;

    if (rand < 0.08) {
        volatility = 0.08;
        direction = prevDirection && Math.random() > 0.4 ? -prevDirection : (Math.random() > 0.5 ? 1 : -1);
        change = prevClose * volatility * (Math.random() * 0.3 + 0.7) * direction;
    } else if (rand < 0.15) {
        volatility = 0.05;
        direction = Math.random() > 0.5 ? 1 : -1;
        change = prevClose * volatility * (Math.random() * 0.8 + 0.2) * direction;
    } else if (rand < 0.25) {
        volatility = 0.03;
        direction = prevDirection && Math.random() > 0.35 ? prevDirection : (Math.random() > 0.48 ? 1 : -1);
        change = prevClose * volatility * (Math.random() * 0.5 + 0.5) * direction;
    } else {
        direction = Math.random() > 0.48 ? 1 : -1;
        change = prevClose * volatility * (Math.random() * 0.5 + 0.5) * direction;
    }

    const open = prevClose;
    const close = open + change;
    const bodySize = Math.abs(change);
    const isLiquidation = rand < 0.15;
    const wickMultiplier = isLiquidation ? (1.5 + Math.random() * 2) : (0.3 + Math.random() * 0.7);
    const high = Math.max(open, close) + bodySize * wickMultiplier;
    const low = Math.min(open, close) - bodySize * wickMultiplier;

    return { time: Date.now(), open, high, low, close };
};

interface CandleStickProps {
    data: CandleData;
    index: number;
    bullColor: string;
    bearColor: string;
}

const CandleStick: React.FC<CandleStickProps> = ({ data, index, bullColor, bearColor }) => {
    const isBull = data.close >= data.open;
    const color = isBull ? bullColor : bearColor;
    const bodyTop = Math.max(data.open, data.close);
    const bodyBottom = Math.min(data.open, data.close);
    const bodyHeight = Math.max(bodyTop - bodyBottom, 0.02);
    const centerY = (bodyTop + bodyBottom) / 2;
    const wickHeight = data.high - data.low;
    const x = (index - 15) * 0.8;

    return (
        <group position={[x, 0, 0]}>
            <mesh position={[0, (data.high + data.low) / 2, 0]}>
                <boxGeometry args={[0.08, wickHeight, 0.08]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0, centerY, 0]}>
                <boxGeometry args={[0.5, bodyHeight, 0.25]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
};

const TradingChart: React.FC<{ theme: Theme }> = ({ theme }) => {
    const themeConfig = THEME_COLORS[theme] || THEME_COLORS.twilight;
    const groupRef = useRef<Group>(null);
    const [candles, setCandles] = useState<CandleData[]>(() => {
        let price = 100;
        let direction = 1;
        return Array.from({ length: 30 }, () => {
            const candle = generateCandle(price, direction);
            direction = candle.close >= candle.open ? 1 : -1;
            price = candle.close;
            return candle;
        });
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCandles(prev => {
                const prevDirection = prev[prev.length - 1].close >= prev[prev.length - 1].open ? 1 : -1;
                const newCandle = generateCandle(prev[prev.length - 1].close, prevDirection);
                return [...prev.slice(1), newCandle];
            });
        }, 180);
        return () => clearInterval(interval);
    }, []);

    const priceRange = useMemo(() => {
        const allPrices = candles.flatMap(c => [c.high, c.low]);
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);
        return { min, max, mid: (min + max) / 2 };
    }, [candles]);

    const candleSpacing = 0.8;
    const chartWidth = 30 * candleSpacing;

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.05;
            groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.3;
        }
    });

    return (
        <group ref={groupRef} scale={[0.5, 0.5, 0.5]} position={[0, 0, -10]}>
            {candles.map((candle, i) => {
                const x = (i - 15) * candleSpacing;
                const y = (candle.high + candle.low) / 2 - priceRange.mid;
                return (
                    <CandleStick
                        key={i}
                        index={i}
                        data={{
                            time: candle.time,
                            open: candle.open - priceRange.mid,
                            high: candle.high - priceRange.mid,
                            low: candle.low - priceRange.mid,
                            close: candle.close - priceRange.mid
                        }}
                        bullColor={themeConfig.bullColor}
                        bearColor={themeConfig.bearColor}
                    />
                );
            })}
        </group>
    );
};

const Background: React.FC<BackgroundProps> = ({ theme = 'twilight' }) => {
    const themeConfig = THEME_COLORS[theme] || THEME_COLORS.twilight;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -100,
                pointerEvents: 'none',
                transition: 'background 1s ease-in-out',
            }}
            className={theme === 'twilight' || theme === 'cyberpunk' || theme === 'forest' ? 'bg-gray-900' : 'bg-gray-100'}
        >
            <Canvas 
                style={{ pointerEvents: 'none' }}
                camera={{ position: [0, 0, 10], fov: 45 }} 
                eventSource={document.body}
            >
                <ambientLight intensity={themeConfig.ambient} />
                <directionalLight position={[10, 10, 5]} intensity={1} color={themeConfig.light} />
                <pointLight position={[-10, -10, -5]} intensity={1} color={themeConfig.color} />

                <TradingChart theme={theme} />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            </Canvas>
        </div>
    );
};

export default Background;
