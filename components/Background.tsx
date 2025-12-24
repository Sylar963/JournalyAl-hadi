import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { type Theme } from '../types';

interface BackgroundProps {
    theme?: Theme;
}

const THEME_COLORS: Record<Theme, { color: string; light: string; ambient: number }> = {
    twilight: { color: '#71717a', light: '#ffffff', ambient: 0.4 },
    sunrise: { color: '#ffffff', light: '#a1a1aa', ambient: 0.8 },
    cyberpunk: { color: '#71717a', light: '#ffffff', ambient: 0.6 },
    forest: { color: '#71717a', light: '#ffffff', ambient: 0.4 },
};

const Whale: React.FC<{ theme: Theme; startPos: [number, number, number]; speed: number; scale?: number }> = ({ theme, startPos, speed, scale = 1 }) => {
    const groupRef = useRef<THREE.Group>(null);
    const bodyRef = useRef<THREE.Mesh>(null);
    const tailRef = useRef<THREE.Group>(null);
    const themeConfig = THEME_COLORS[theme] || THEME_COLORS.twilight;

    // Load the whale texture
    const texture = useTexture('/whale.png');

    // Random offset for swimming animation phase
    const offset = useMemo(() => Math.random() * 100, []);

    useFrame((state) => {
        if (groupRef.current && tailRef.current && bodyRef.current) {
            const time = state.clock.getElapsedTime();

            // Move forward (slide from left to right)
            groupRef.current.position.x += speed * 0.01;

            // Reset position when it goes off screen (assuming camera at z=5, view width approx 10-15)
            if (groupRef.current.position.x > 15) {
                groupRef.current.position.x = -15;
                groupRef.current.position.y = (Math.random() - 0.5) * 10; // New random Y
            }

            // Swimming motion (sine wave on Y and rotation)
            const swimCycle = time * 2 + offset;
            groupRef.current.position.y += Math.sin(swimCycle) * 0.002;

            // Rotation logic fixed:
            // 1. Face direction of movement (+X). The default geometry is aligned along X (tail at -X, head at +X).
            // 2. Add slight roll (Z) and yaw (Y) for swimming effect.
            // Removed the + Math.PI / 2 offset which was making them face North/Z.
            groupRef.current.rotation.z = Math.sin(swimCycle) * 0.05; // Slight roll
            groupRef.current.rotation.y = Math.sin(swimCycle * 0.5) * 0.1; // Slight yaw, centered around 0 (facing +X)

            // Tail wag
            tailRef.current.rotation.y = Math.sin(swimCycle * 3) * 0.2;
        }
    });

    const materialProps = {
        color: themeConfig.color,
        emissive: themeConfig.light,
        emissiveIntensity: 0.2,
        metalness: 0.5,
        roughness: 0.2,
        distort: 0.4, // Keep the bubble effect
        speed: 2,
        map: texture, // Apply the texture to the 3D form
    };

    return (
        <group ref={groupRef} position={startPos} scale={scale}>
            {/* Head/Snout - positioned forward */}
            <mesh position={[1.8, 0.1, 0]}>
                <sphereGeometry args={[0.6, 32, 32]} />
                <MeshDistortMaterial {...materialProps} distort={0.3} />
            </mesh>

            {/* Main Body - elongated sphere */}
            <mesh ref={bodyRef} position={[0, 0, 0]} scale={[2.8, 1, 1.2]}>
                <sphereGeometry args={[1, 32, 32]} />
                <MeshDistortMaterial {...materialProps} />
            </mesh>

            {/* Mid-body section for smoother transition */}
            <mesh position={[-1.5, 0, 0]} scale={[1.2, 0.8, 0.9]}>
                <sphereGeometry args={[0.8, 32, 32]} />
                <MeshDistortMaterial {...materialProps} distort={0.3} />
            </mesh>

            {/* Dorsal Fin - on top of the whale */}
            <mesh position={[0.3, 1, 0]} rotation={[0, 0, -0.3]}>
                <coneGeometry args={[0.3, 0.8, 32]} />
                <MeshDistortMaterial {...materialProps} distort={0.1} />
            </mesh>

            {/* Tail Section */}
            <group ref={tailRef} position={[-2.5, 0, 0]}>
                {/* Tail body taper */}
                <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.8, 1.2, 0.8]}>
                    <coneGeometry args={[0.6, 1.2, 32]} />
                    <MeshDistortMaterial {...materialProps} distort={0.2} />
                </mesh>

                {/* Tail Flukes - horizontal (more realistic whale tail) */}
                <mesh position={[-0.8, 0, 0]} rotation={[0, 0, 0]} scale={[0.15, 1, 2.2]}>
                    <boxGeometry args={[1, 0.1, 1]} />
                    <MeshDistortMaterial {...materialProps} distort={0.05} />
                </mesh>
            </group>

            {/* Pectoral Fins (side fins) - better positioned */}
            <mesh position={[0.8, -0.4, 1]} rotation={[0.3, -0.2, 0.8]} scale={[1.2, 0.15, 0.5]}>
                <boxGeometry args={[1, 0.1, 1]} />
                <MeshDistortMaterial {...materialProps} distort={0.05} />
            </mesh>
            <mesh position={[0.8, -0.4, -1]} rotation={[-0.3, 0.2, -0.8]} scale={[1.2, 0.15, 0.5]}>
                <boxGeometry args={[1, 0.1, 1]} />
                <MeshDistortMaterial {...materialProps} distort={0.05} />
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
