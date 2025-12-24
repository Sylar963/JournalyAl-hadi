import React, { useEffect, useRef } from 'react';

const WarpBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    // Star properties
    const stars: { x: number; y: number; z: number; o: number }[] = [];
    const count = 1000; // Number of stars
    const speed = 4; // Warp speed

    // Initialize stars
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * w - w / 2,
        y: Math.random() * h - h / 2,
        z: Math.random() * w, 
        o: Math.random() 
      });
    }

    const animate = () => {
      // Clear canvas with trail effect
      ctx.fillStyle = 'rgba(5, 5, 5, 0.4)'; // #050505 with opacity for trails
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      for (let i = 0; i < count; i++) {
        const star = stars[i];
        
        // Move star towards camera
        star.z -= speed;

        // Reset star if it passes camera
        if (star.z <= 0) {
          star.x = Math.random() * w - w / 2;
          star.y = Math.random() * h - h / 2;
          star.z = w;
          star.o = Math.random(); 
        }

        // Project 3D position to 2D
        const x = cx + star.x / (star.z * 0.001);
        const y = cy + star.y / (star.z * 0.001);

        // Calculate size based on depth
        const size = (1 - star.z / w) * 3;
        
        // Calculate opacity based on depth
        const opacity = (1 - star.z / w);

        if (x >= 0 && x <= w && y >= 0 && y <= h) {
          // Draw star line (warp effect)
          // Simple dot for now, trails created by clearRect opacity
          ctx.beginPath();
          // Color based on speed or random for the rainbow effect seen in screenshots
          // Screenshot shows orange/blue/white streaks. Let's vary colors.
          const colorVal = Math.random();
          if (colorVal > 0.9) {
             ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`; // Pure White
          } else if (colorVal > 0.8) {
             ctx.fillStyle = `rgba(212, 212, 216, ${opacity})`; // Zinc-300
          } else {
             ctx.fillStyle = `rgba(161, 161, 170, ${opacity})`; // Zinc-400
          }

          // Draw extended streak for warp feel
          const prevX = cx + star.x / ((star.z + speed * 2) * 0.001);
          const prevY = cy + star.y / ((star.z + speed * 2) * 0.001);
          
          ctx.beginPath();
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = size * 0.5;
          ctx.stroke();
        }
      }

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
        if (canvas) {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full block" 
      style={{ background: '#050505' }}
    />
  );
};

export default WarpBackground;
