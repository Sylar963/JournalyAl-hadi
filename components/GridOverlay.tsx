import React from 'react';

const GridOverlay: React.FC = () => {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                pointerEvents: 'none',
                backgroundImage: `
          linear-gradient(var(--grid-line-color) 1px, transparent 1px),
          linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
          radial-gradient(ellipse at 70% 80%, var(--chart-glow-color-1) 0%, transparent 50%),
          radial-gradient(ellipse at 30% 20%, var(--chart-glow-color-2) 0%, transparent 40%)
        `,
                backgroundSize: '50px 50px, 50px 50px, 100% 100%, 100% 100%',
                backgroundAttachment: 'fixed',
                transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            }}
        />
    );
};

export default GridOverlay;
