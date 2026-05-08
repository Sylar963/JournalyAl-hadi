import React from 'react';
import { type Theme } from '../types';

interface BackgroundProps {
    theme?: Theme;
}

const THEME_BACKGROUNDS: Record<Theme, string> = {
    insilico: 'radial-gradient(circle at top right, rgba(96, 165, 250, 0.09), transparent 24%), radial-gradient(circle at bottom left, rgba(129, 140, 248, 0.08), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.015), transparent 18%), #09121f',
    cscalp: 'radial-gradient(circle at top right, rgba(148, 163, 184, 0.06), transparent 24%), radial-gradient(circle at bottom left, rgba(34, 197, 94, 0.05), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.012), transparent 18%), #0a0d12',
    bloomberg: 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.09), transparent 22%), radial-gradient(circle at bottom left, rgba(251, 191, 36, 0.06), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.012), transparent 18%), #0d0d0f',
};

const Background: React.FC<BackgroundProps> = ({ theme = 'insilico' }) => {
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
