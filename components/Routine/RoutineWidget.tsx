import React from 'react';

interface RoutineWidgetProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
}

const RoutineWidget: React.FC<RoutineWidgetProps> = ({ title, icon, children, onRemove, className = '' }) => {
  return (
    <div className={`glass-panel p-4 flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
        <div className="flex items-center space-x-2 text-gray-300">
          {icon && <span className="text-white/70">{icon}</span>}
          <h3 className="font-medium text-sm tracking-wide">{title}</h3>
        </div>
        {onRemove && (
          <button 
            onClick={onRemove}
            className="text-gray-500 hover:text-red-400 transition-colors"
            aria-label="Remove widget"
          >
            ×
          </button>
        )}
      </div>
      <div className="flex-grow overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default RoutineWidget;
