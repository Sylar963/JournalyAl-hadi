
import React, { ReactNode } from 'react';
import { Theme } from '../types';
import '../src/styles/themes.css';

interface ThemeWrapperProps {
  theme: Theme;
  children: ReactNode;
  className?: string; // Allow passing className for layout
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ theme, children, className }) => {
  return (
    <div className={`dashboard-theme-scope ${className || ''}`} data-theme={theme}>
      {children}
    </div>
  );
};
