import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

const CustomCursor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const cursorRef = useRef<{ x: number, y: number }>({ x: -100, y: -100 });
  const particlesRef = useRef<Particle[]>([]);
  const lastPosRef = useRef<{ x: number, y: number }>({ x: -100, y: -100 });
  const isVisibleRef = useRef(false);

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }

    // Hide default cursor
    document.body.style.cursor = 'none';

    const onMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
      isVisibleRef.current = true;
    };

    const onMouseEnter = () => {
      isVisibleRef.current = true;
    };
    const onMouseLeave = () => {
      isVisibleRef.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);

    return () => {
      document.body.style.cursor = 'auto'; // Restore cursor
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas if needed
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { x, y } = cursorRef.current;
    const { x: lastX, y: lastY } = lastPosRef.current;

    // Create new particles based on movement distance
    const dist = Math.hypot(x - lastX, y - lastY);
    if (dist > 2 && isVisibleRef.current) {
      const particleCount = Math.min(Math.floor(dist), 5); // Cap particles per frame
      for (let i = 0; i < particleCount; i++) {
        // Interpolate position for smoother trail
        const t = Math.random();
        const px = lastX + (x - lastX) * t;
        const py = lastY + (y - lastY) * t;
        
        particlesRef.current.push({
          x: px,
          y: py,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: 1.0,
          size: Math.random() * 2 + 1,
        });
      }
    }
    
    lastPosRef.current = { x, y };

    // Update and draw particles
    particlesRef.current = particlesRef.current.filter((p) => {
      p.life -= 0.02;
      p.x += p.vx;
      p.y += p.vy;
      p.size *= 0.95;

      if (p.life <= 0) {
        return false;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 50, 50, ${p.life})`;
      ctx.fill();
      return true;
    });

    // Draw main cursor dot
    if (isVisibleRef.current) {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff3333';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff3333';
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) {
      return;
    }

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999, // Ensure it's on top of everything
      }}
    />
  );
};

export default CustomCursor;
