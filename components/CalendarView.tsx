import React, { useState } from 'react';
import { type EmotionEntry } from '../types';
import { WEEK_DAYS, EMOTIONS_CONFIG } from '../constants';
import IconChevronLeft from './icons/IconChevronLeft';
import IconChevronRight from './icons/IconChevronRight';
import IconChevronsLeft from './icons/IconChevronsLeft';

interface CalendarViewProps {
  currentDate: Date;
  onMonthChange: (offset: number) => void;
  onYearChange: (offset: number) => void;
  onGoToToday: () => void;
  onDateClick: (date: Date) => void;
  entries: Record<string, EmotionEntry>;
}

const DAY_TEXT_CLASSES = [
  'day-su', 'day-mo', 'day-tu', 'day-we', 'day-th', 'day-fr', 'day-sa'
];

const CalendarView: React.FC<CalendarViewProps> = ({ currentDate, onMonthChange, onYearChange, onGoToToday, onDateClick, entries }) => {
  const [animatingDateKey, setAnimatingDateKey] = useState<string | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleCellClick = (date: Date) => {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    setAnimatingDateKey(dateKey);

    // Call parent handler after animation duration
    setTimeout(() => {
      onDateClick(date);
    }, 400);

    // Clear animation class after it completes
    setTimeout(() => {
      setAnimatingDateKey(null);
    }, 400);
  };


  const renderCalendarDays = () => {
    const days = [];
    // Previous month's days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`prev-${i}`} className="border-r border-b border-[color:var(--calendar-border)] bg-transparent"></div>);
    }
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);

      const y = date.getFullYear();
      const m = (date.getMonth() + 1).toString().padStart(2, '0');
      const d = date.getDate().toString().padStart(2, '0');
      const dateKey = `${y}-${m}-${d}`;

      const entry = entries[dateKey];
      const isToday = date.getTime() === today.getTime();

      let cellClasses = 'relative border-r border-b border-[color:var(--calendar-border)] p-2 text-left cursor-pointer transition-colors duration-200 min-h-[120px] flex flex-col';
      let dayNumberClasses = 'font-semibold';

      if (entry) {
        cellClasses += ` ${EMOTIONS_CONFIG[entry.emotion].hoverColor} bg-black/40 hover:bg-black/60`;
      } else {
        cellClasses += ' bg-transparent hover:bg-white/10';
      }

      if (isToday) {
        dayNumberClasses += ' bg-yellow-600 text-black rounded-full w-7 h-7 flex items-center justify-center';
      } else {
        dayNumberClasses += ' text-gray-300';
      }

      if (animatingDateKey === dateKey) {
        cellClasses += ' animate-cell-click';
      }

      days.push(
        <div key={dateKey} className={cellClasses} onClick={() => handleCellClick(date)}>
          <div className={dayNumberClasses}>{day}</div>
          {entry && (
            <div className="mt-2 flex-grow flex flex-col justify-end">
              <span className={`text-2xl mb-1`}>{EMOTIONS_CONFIG[entry.emotion].emoji}</span>
              <p className={`font-bold text-lg ${EMOTIONS_CONFIG[entry.emotion].textColor}`}>{EMOTIONS_CONFIG[entry.emotion].label}</p>
              <p className="text-xs text-gray-400">{`Intensity: ${entry.intensity}/10`}</p>
            </div>
          )}
        </div>
      );
    }

    // Next month's days to fill the grid
    const totalCells = days.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`next-${i}`} className="border-r border-b border-[color:var(--calendar-border)] bg-transparent"></div>);
    }

    return days;
  };

  const [isFolded, setIsFolded] = useState(false);

  const totalEntries = Object.values(entries).filter((e: EmotionEntry) => {
    const entryDate = new Date(e.date + 'T00:00:00'); // Ensure local timezone parsing
    return entryDate.getMonth() === month && entryDate.getFullYear() === year;
  }).length;

  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className={`rounded-lg shadow-xl p-4 md:p-6 animate-content-entry transition-all duration-500 ease-in-out ${isFolded ? 'bg-gray-900/40 backdrop-blur-sm' : 'bg-gray-900/80 backdrop-blur-md'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-white mr-4">
            {capitalizedMonth} {year}
          </h2>
          <div className="flex items-center space-x-1">
            <button onClick={() => onYearChange(-1)} className="p-2 rounded-md hover:bg-white/10 transition-colors" title="Previous Year"><IconChevronsLeft className="w-5 h-5" /></button>
            <button onClick={() => onMonthChange(-1)} className="p-2 rounded-md hover:bg-white/10 transition-colors" title="Previous Month"><IconChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => onMonthChange(1)} className="p-2 rounded-md hover:bg-white/10 transition-colors" title="Next Month"><IconChevronRight className="w-5 h-5" /></button>
            <button onClick={() => onYearChange(1)} className="p-2 rounded-md hover:bg-white/10 transition-colors" title="Next Year"><IconChevronsLeft className="w-5 h-5 rotate-180" /></button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-300 hidden md:inline">{`${totalEntries} entries this month`}</span>
          <button onClick={onGoToToday} className="px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white">Today</button>
          <button
            onClick={() => setIsFolded(!isFolded)}
            className="px-4 py-2 text-sm font-medium bg-blue-600/80 hover:bg-blue-500/80 text-white rounded-lg transition-colors flex items-center"
          >
            {isFolded ? 'Unfold' : 'Fold'}
          </button>
        </div>
      </div>

      {!isFolded && (
        <div className="grid grid-cols-7 border-t border-l border-[color:var(--calendar-border)] animate-in fade-in slide-in-from-top-4 duration-500">
          {WEEK_DAYS.map((day, index) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-bold uppercase bg-black/40 border-r border-b border-[color:var(--calendar-border)] text-gray-300 ${DAY_TEXT_CLASSES[index]}`}
            >
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      )}
    </div>
  );
};

export default CalendarView;