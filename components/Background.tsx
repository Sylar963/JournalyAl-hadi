import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { type Theme } from '../types';

interface BackgroundProps {
    theme?: Theme;
}

const THEME_COLORS: Record<Theme, { color: string; light: string; ambient: number }> = {
    twilight: { color: '#4A90E2', light: '#00ffff', ambient: 0.5 },
    sunrise: { color: '#ff9a9e', light: '#fad0c4', ambient: 0.8 },
    cyberpunk: { color: '#ff00cc', light: '#3333ff', ambient: 0.6 },
    forest: { color: '#2d6a4f', light: '#d8f3dc', ambient: 0.4 },
};

const Whale: React.FC<{ theme: Theme; startPos: [number, number, number]; speed: number; scale?: number }> = ({ theme, startPos, speed, scale = 1 }) => {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Mesh>(null);
    const tailRef = useRef<THREE.Group>(null);
    const themeConfig = THEME_COLORS[theme] || THEME_COLORS.twilight;

    // Random offset for swimming animation phase
    const offset = useMemo(() => Math.random() * 100, []);

    useFrame((state) => {
        if (groupRef.current && tailRef.current && bodyRef.current) {
            const time = state.clock.getElapsedTime();

            // Move forward (slide)
            groupRef.current.position.x += speed * 0.01;

            // Reset position when it goes off screen (assuming camera at z=5, view width approx 10-15)
            if (groupRef.current.position.x > 15) {
                groupRef.current.position.x = -15;
                groupRef.current.position.y = (Math.random() - 0.5) * 10; // New random Y
            }

            // Swimming motion (sine wave on Y and rotation)
            const swimCycle = time * 2 + offset;
            groupRef.current.position.y += Math.sin(swimCycle) * 0.002;
            groupRef.current.rotation.z = Math.sin(swimCycle) * 0.05; // Slight roll
            groupRef.current.rotation.y = Math.sin(swimCycle * 0.5) * 0.1 + Math.PI / 2; // Face direction + slight yaw

            // Tail wag
            tailRef.current.rotation.y = Math.sin(swimCycle * 3) * 0.2;
        }
    });

    const materialProps = {
        color: themeConfig.color,
        emissive: themeConfig.light,
        emissiveIntensity: 0.2,
        metalness: 0.8,
        roughness: 0.2,
        distort: 0.4, // Add the "bubble" distortion effect
        speed: 2,
    };

    return (
        <group ref={groupRef} position={startPos} scale={scale}>
            {/* Main Body */}
            <mesh ref={bodyRef} position={[0, 0, 0]}>
                <sphereGeometry args={[1, 32, 32]} />
                <MeshDistortMaterial {...materialProps} />
                {/* Scale the body to be elongated like a whale */}
                <group scale={[2.5, 1, 1]}>
                </group>
            </mesh>

            {/* Tail Section */}
            <group ref={tailRef} position={[-2, 0, 0]}>
                <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <coneGeometry args={[0.6, 1.5, 32]} />
                    <MeshDistortMaterial {...materialProps} distort={0.2} />
                </mesh>
                {/* Flukes */}
                <mesh position={[-1.2, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <boxGeometry args={[0.2, 1.5, 0.1]} />
                    <MeshDistortMaterial {...materialProps} distort={0} />
                </mesh>
            </group>

            {/* Side Fins */}
            <mesh position={[0.5, -0.5, 0.8]} rotation={[0.5, 0, 0.5]}>
                <boxGeometry args={[0.8, 0.1, 0.4]} />
                <MeshDistortMaterial {...materialProps} distort={0} />
            </mesh>
            <mesh position={[0.5, -0.5, -0.8]} rotation={[-0.5, 0, -0.5]}>
                <boxGeometry args={[0.8, 0.1, 0.4]} />
                <MeshDistortMaterial {...materialProps} distort={0} />
            </mesh>
        </group>
    );
};

const Background: React.FC<BackgroundProps> = ({ theme = 'twilight' }) => {
    const themeConfig = THEME_COLORS[theme] || THEME_COLORS.twilight;

    // Generate a school of whales
    const whales = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => ({
            startPos: [
                (Math.random() - 0.5) * 20, // Random X
                (Math.random() - 0.5) * 8,  // Random Y
                (Math.random() - 0.5) * 5 - 2 // Random Z (slightly behind)
            ] as [number, number, number],
            speed: 0.5 + Math.random() * 1.5, // Random speed
            scale: 0.5 + Math.random() * 0.5, // Random size
        }));
    }, []);

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

                {whales.map((props, i) => (
                    <Whale key={i} theme={theme} {...props} />
                ))}

                {/* Add some floating particles/bubbles for atmosphere */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            </Canvas>
        </div>
    );
};

export default Background;
