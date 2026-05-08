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
          linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px)
        `,
                backgroundSize: '64px 64px, 64px 64px',
                opacity: 0.5,
                backgroundAttachment: 'fixed',
                transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
            }}
        />
    );
};

export default GridOverlay;
