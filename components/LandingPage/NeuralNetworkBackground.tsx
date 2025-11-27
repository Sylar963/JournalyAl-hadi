import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { type EmotionType } from '../../types';
import { EMOTIONS_CONFIG } from '../../constants';

interface Neuron {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  activated: boolean;
  activationTime: number;
  pulseOffset: number;
}

const NeuralNetworkBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const neuronsRef = useRef<Neuron[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const emotions: EmotionType[] = ['happy', 'calm', 'anxious', 'sad', 'angry'];
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('happy');
  const [nextEmotion, setNextEmotion] = useState<EmotionType>('calm');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Emotion color mapping
  const emotionColors: Record<EmotionType, { primary: string; secondary: string; rgb: string }> = {
    happy: { primary: '#fbbf24', secondary: '#f59e0b', rgb: '251, 191, 36' },
    calm: { primary: '#60a5fa', secondary: '#3b82f6', rgb: '96, 165, 250' },
    anxious: { primary: '#fb923c', secondary: '#f97316', rgb: '251, 146, 60' },
    sad: { primary: '#3b82f6', secondary: '#2563eb', rgb: '59, 130, 246' },
    angry: { primary: '#ef4444', secondary: '#dc2626', rgb: '239, 68, 68' },
  };

  // Initialize neurons
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width = window.innerWidth;
    const height = canvas.height = window.innerHeight;

    // Create neurons
    const neuronCount = window.innerWidth < 768 ? 40 : 70;
    neuronsRef.current = [];

    for (let i = 0; i < neuronCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      neuronsRef.current.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 2,
        activated: false,
        activationTime: 0,
        pulseOffset: Math.random() * Math.PI * 2,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Emotion cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      
      setCurrentEmotion((prev) => {
        const currentIndex = emotions.indexOf(prev);
        const nextIndex = (currentIndex + 1) % emotions.length;
        setNextEmotion(emotions[(nextIndex + 1) % emotions.length]);
        return emotions[nextIndex];
      });

      // Trigger activation wave
      triggerActivationWave();

      setTimeout(() => setIsTransitioning(false), 1000);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Trigger activation wave from center
  const triggerActivationWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    neuronsRef.current.forEach((neuron) => {
      const dx = neuron.x - centerX;
      const dy = neuron.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delay = distance / 2; // Wave speed

      setTimeout(() => {
        neuron.activated = true;
        neuron.activationTime = Date.now();
        
        setTimeout(() => {
          neuron.activated = false;
        }, 600);
      }, delay);
    });
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const connectionDistance = 150;
    const mouseDistance = 150;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);

      const currentColor = emotionColors[currentEmotion];
      const time = Date.now();

      // Update and draw neurons
      neuronsRef.current.forEach((neuron, i) => {
        // Mouse interaction
        const dx = mouseRef.current.x - neuron.x;
        const dy = mouseRef.current.y - neuron.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseDistance) {
          const force = (mouseDistance - distance) / mouseDistance;
          const directionX = (dx / distance) * force * 8;
          const directionY = (dy / distance) * force * 8;
          neuron.x -= directionX;
          neuron.y -= directionY;
        } else {
          // Return to base position
          neuron.x += (neuron.baseX - neuron.x) * 0.05;
          neuron.y += (neuron.baseY - neuron.y) * 0.05;
        }

        // Floating motion
        neuron.x += neuron.vx;
        neuron.y += neuron.vy;

        // Boundary bounce
        if (neuron.x < 0 || neuron.x > width) neuron.vx *= -1;
        if (neuron.y < 0 || neuron.y > height) neuron.vy *= -1;

        // Draw connections
        for (let j = i + 1; j < neuronsRef.current.length; j++) {
          const other = neuronsRef.current[j];
          const dx = neuron.x - other.x;
          const dy = neuron.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.3;
            const shimmer = Math.sin(time * 0.002 + dist * 0.01) * 0.1 + 0.9;
            
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${currentColor.rgb}, ${opacity * shimmer})`;
            ctx.lineWidth = 1;
            ctx.moveTo(neuron.x, neuron.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw neuron
        const pulsePhase = Math.sin(time * 0.003 + neuron.pulseOffset) * 0.5 + 0.5;
        let scale = 1 + pulsePhase * 0.2;
        let opacity = 0.6 + pulsePhase * 0.2;

        // Activation effect
        if (neuron.activated) {
          const activationProgress = Math.min((time - neuron.activationTime) / 600, 1);
          const activationScale = Math.sin(activationProgress * Math.PI) * 0.6;
          scale += activationScale;
          opacity = Math.min(opacity + activationScale, 1);
        }

        const radius = neuron.size * scale;

        // Outer glow (glassmorphic effect)
        const gradient = ctx.createRadialGradient(
          neuron.x, neuron.y, 0,
          neuron.x, neuron.y, radius * 3
        );
        gradient.addColorStop(0, `rgba(${currentColor.rgb}, ${opacity * 0.4})`);
        gradient.addColorStop(0.5, `rgba(${currentColor.rgb}, ${opacity * 0.1})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Inner core with glassmorphic border
        const coreGradient = ctx.createRadialGradient(
          neuron.x, neuron.y, 0,
          neuron.x, neuron.y, radius
        );
        coreGradient.addColorStop(0, `rgba(${currentColor.rgb}, ${opacity})`);
        coreGradient.addColorStop(0.7, `rgba(${currentColor.rgb}, ${opacity * 0.6})`);
        coreGradient.addColorStop(1, `rgba(${currentColor.rgb}, ${opacity * 0.3})`);

        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Glassmorphic border
        ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.3})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentEmotion]);

  return (
    <motion.div
      className="absolute top-0 left-0 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1, ease: 'easeInOut' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </motion.div>
  );
};

export default NeuralNetworkBackground;
