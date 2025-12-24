import React, { useEffect, useRef, useState } from 'react';

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
  
  // Custom cursor visual state
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Hide default cursor
    document.body.style.cursor = 'none';

    // Event listeners
    const onMouseMove = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const onMouseEnter = () => setIsVisible(true);
    const onMouseLeave = () => setIsVisible(false);
    
    // Make sure links/buttons show pointer cursor logic if needed, 
    // but we are overriding everything with none. 
    // We can add logic here to expand cursor on hover if requested, 
    // but for now keeping it simple as per plan.

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
    if (dist > 2 && isVisible) {
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
    particlesRef.current.forEach((p, index) => {
      p.life -= 0.02;
      p.x += p.vx;
      p.y += p.vy;
      p.size *= 0.95;

      if (p.life <= 0) {
        particlesRef.current.splice(index, 1);
        return;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 50, 50, ${p.life})`;
      ctx.fill();
    });

    // Draw main cursor dot
    if (isVisible) {
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
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isVisible]); // Re-bind if visibility changes, though logic handles it inside loop too

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
