import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
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

const generateCandle = (prevClose: number): CandleData => {
    const volatility = 0.02;
    const direction = Math.random() > 0.48 ? 1 : -1;
    const change = prevClose * volatility * (Math.random() * 0.5 + 0.5) * direction;
    const open = prevClose;
    const close = open + change;
    const high = Math.max(open, close) + Math.abs(change) * Math.random() * 0.5;
    const low = Math.min(open, close) - Math.abs(change) * Math.random() * 0.5;
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
    const bodyHeight = Math.max(bodyTop - bodyBottom, 0.01);
    const x = (index - 15) * 0.6;
    const centerY = (bodyTop + bodyBottom) / 2;
    const scale = 1.2;

    return (
        <group position={[x, 0, 0]}>
            {/* Wick (high to low) */}
            <mesh position={[0, (data.high + data.low) / 2 * scale, 0]}>
                <boxGeometry args={[0.05 * scale, (data.high - data.low) * scale, 0.05 * scale]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
            </mesh>
            {/* Body */}
            <mesh position={[0, centerY * scale, 0]}>
                <boxGeometry args={[0.4 * scale, bodyHeight * scale, 0.2 * scale]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
            </mesh>
        </group>
    );
};

const TradingChart: React.FC<{ theme: Theme }> = ({ theme }) => {
    const themeConfig = THEME_COLORS[theme] || THEME_COLORS.twilight;
    const groupRef = useRef<THREE.Group>(null);
    const [candles, setCandles] = useState<CandleData[]>(() => {
        const initial: CandleData[] = [];
        let price = 100;
        for (let i = 0; i < 30; i++) {
            const candle = generateCandle(price);
            price = candle.close;
            initial.push(candle);
        }
        return initial;
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setCandles(prev => {
                const newCandle = generateCandle(prev[prev.length - 1].close);
                return [...prev.slice(1), newCandle];
            });
        }, 800);
        return () => clearInterval(interval);
    }, []);

    const priceRange = useMemo(() => {
        const allPrices = candles.flatMap(c => [c.high, c.low]);
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);
        const padding = (max - min) * 0.1;
        return { min: min - padding, max: max + padding };
    }, [candles]);

    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
            groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.2;
        }
    });

    return (
        <group ref={groupRef} scale={[0.8, 0.8, 0.8]} position={[0, 0, -3]}>
            {candles.map((candle, i) => {
                const normalizedHigh = ((candle.high - priceRange.min) / (priceRange.max - priceRange.min)) - 0.5;
                const normalizedLow = ((candle.low - priceRange.min) / (priceRange.max - priceRange.min)) - 0.5;
                const normalizedOpen = ((candle.open - priceRange.min) / (priceRange.max - priceRange.min)) - 0.5;
                const normalizedClose = ((candle.close - priceRange.min) / (priceRange.max - priceRange.min)) - 0.5;
                return (
                    <CandleStick
                        key={i}
                        index={i}
                        data={{
                            time: candle.time,
                            open: normalizedOpen,
                            high: normalizedHigh,
                            low: normalizedLow,
                            close: normalizedClose
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
                zIndex: -2,
                pointerEvents: 'none',
                transition: 'background 1s ease-in-out',
            }}
            className={theme === 'twilight' || theme === 'cyberpunk' || theme === 'forest' ? 'bg-gray-900' : 'bg-gray-100'}
        >
            <Canvas camera={{ position: [0, 0, 10], fov: 45 }} eventSource={document.body}>
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
