import React from 'react';
import { type Theme } from '../types';

interface BackgroundProps {
    theme?: Theme;
}

const THEME_BACKGROUNDS: Record<Theme, string> = {
    twilight: 'radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 26%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.06), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.015), transparent 18%), #07111a',
    sunrise: 'radial-gradient(circle at top right, rgba(180, 83, 9, 0.08), transparent 24%), radial-gradient(circle at bottom left, rgba(217, 119, 6, 0.06), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.45), transparent 18%), #f3f0eb',
    cyberpunk: 'radial-gradient(circle at top right, rgba(96, 165, 250, 0.08), transparent 25%), radial-gradient(circle at bottom left, rgba(129, 140, 248, 0.07), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.015), transparent 18%), #0d1320',
    forest: 'radial-gradient(circle at top right, rgba(163, 177, 138, 0.08), transparent 24%), radial-gradient(circle at bottom left, rgba(210, 197, 154, 0.06), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.015), transparent 18%), #0d1510',
};

const Background: React.FC<BackgroundProps> = ({ theme = 'twilight' }) => {
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
                background: THEME_BACKGROUNDS[theme],
                transition: 'background 0.35s ease-in-out',
            }}
        />
    );
};

export default Background;
