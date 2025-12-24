import React, { useState } from 'react';
import { type EmotionEntry } from '../types';
import { WEEK_DAYS, EMOTIONS_CONFIG } from '../constants';
import IconChevronLeft from './icons/IconChevronLeft';
import IconChevronRight from './icons/IconChevronRight';
import IconChevronsLeft from './icons/IconChevronsLeft';
import { useI18n } from '../hooks/useI18n';
import { TranslationKey } from '../utils/translations';

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
  const { t } = useI18n();
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
      days.push(<div key={`prev-${i}`} className="border-r border-b border-[color:var(--glass-border)] bg-transparent"></div>);
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

      let cellClasses = 'relative border-r border-b border-[color:var(--glass-border)] p-2 text-left cursor-pointer transition-all duration-300 min-h-[120px] flex flex-col group hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.05)]';
      let dayNumberClasses = 'font-semibold transition-colors duration-300';

      if (entry) {
        cellClasses += ` ${EMOTIONS_CONFIG[entry.emotion].hoverColor} bg-white/5 hover:bg-white/10 backdrop-blur-sm`;
      } else {
        cellClasses += ' bg-transparent hover:bg-white/5';
      }

      if (isToday) {
        dayNumberClasses += ' bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-full w-7 h-7 flex items-center justify-center shadow-[0_0_15px_var(--accent-primary)]';
      } else {
        dayNumberClasses += ' text-gray-400 group-hover:text-white';
      }

      if (animatingDateKey === dateKey) {
        cellClasses += ' animate-cell-click';
      }

      days.push(
        <div key={dateKey} className={cellClasses} onClick={() => handleCellClick(date)}>
          <div className={dayNumberClasses}>{day}</div>
          {entry && (
            <div className="mt-2 flex-grow flex flex-col justify-end">
              <span className={`text-2xl mb-1 drop-shadow-md`}>{EMOTIONS_CONFIG[entry.emotion].emoji}</span>
              <p className={`font-bold text-lg ${EMOTIONS_CONFIG[entry.emotion].textColor} drop-shadow-sm`}>
                {t(`emotion.${entry.emotion}` as TranslationKey)}
              </p>
              <p className="text-xs text-gray-400">{`${t('calendar.intensity')}: ${entry.intensity}/10`}</p>
            </div>
          )}
        </div>
      );
    }

    // Next month's days to fill the grid
    const totalCells = days.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<div key={`next-${i}`} className="border-r border-b border-[color:var(--glass-border)] bg-transparent"></div>);
    }

    return days;
  };

  const [isFolded, setIsFolded] = useState(false);

  const totalEntries = Object.values(entries).filter((e: EmotionEntry) => {
    const entryDate = new Date(e.date + 'T00:00:00'); // Ensure local timezone parsing
    return entryDate.getMonth() === month && entryDate.getFullYear() === year;
  }).length;

  const monthName = t(`month.${month}` as TranslationKey);
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className={`rounded-2xl glass-panel p-4 md:p-6 animate-content-entry transition-all duration-500 ease-in-out ${isFolded ? 'h-auto' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mr-6 tracking-tight">
            {capitalizedMonth} {year}
          </h2>
          <div className="flex items-center space-x-2">
            <button onClick={() => onYearChange(-1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white" title={t('calendar.prev_year')}><IconChevronsLeft className="w-5 h-5" /></button>
            <button onClick={() => onMonthChange(-1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white" title={t('calendar.prev_month')}><IconChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => onMonthChange(1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white" title={t('calendar.next_month')}><IconChevronRight className="w-5 h-5" /></button>
            <button onClick={() => onYearChange(1)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white" title={t('calendar.next_year')}><IconChevronsLeft className="w-5 h-5 rotate-180" /></button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400 hidden md:inline font-medium tracking-wide">{`${totalEntries} ${t('calendar.entries_count')}`}</span>
          <button onClick={onGoToToday} className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-white hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]">{t('calendar.today')}</button>
          <button
            onClick={() => setIsFolded(!isFolded)}
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 text-white rounded-lg transition-all shadow-[0_0_15px_var(--chart-glow-color-1)] flex items-center"
          >
            {isFolded ? t('calendar.unfold') : t('calendar.fold')}
          </button>
        </div>
      </div>

      {!isFolded && (
        <div className="grid grid-cols-7 border-t border-l border-[color:var(--glass-border)] animate-in fade-in slide-in-from-top-4 duration-500 rounded-tl-lg rounded-tr-lg overflow-hidden">
          {WEEK_DAYS.map((day, index) => (
            <div
              key={day}
              className={`py-3 text-center text-xs font-bold uppercase bg-white/5 border-r border-b border-[color:var(--glass-border)] text-gray-400 tracking-wider ${DAY_TEXT_CLASSES[index]}`}
            >
              {t(`weekday.${day.toLowerCase()}` as TranslationKey)}
            </div>
          ))}
          {renderCalendarDays()}
        </div>
      )}
    </div>
  );
};

export default CalendarView;