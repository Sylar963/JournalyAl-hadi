import React from 'react';
import { type EmotionEntry } from '../types';
import { WEEK_DAYS, EMOTIONS_CONFIG } from '../constants';
import IconChevronLeft from './icons/IconChevronLeft';
import IconChevronRight from './icons/IconChevronRight';

interface CalendarViewProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onDateClick: (date: Date) => void;
  entries: Record<string, EmotionEntry>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ currentDate, setCurrentDate, onDateClick, entries }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const renderCalendarDays = () => {
    const days = [];
    // Previous month's days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`prev-${i}`} className="border-r border-b border-gray-800/50 bg-black/10"></div>);
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

      let cellClasses = 'relative border-r border-b border-gray-800/50 p-2 text-left cursor-pointer transition-colors duration-200 min-h-[120px] flex flex-col';
      let dayNumberClasses = 'font-semibold';

      if(entry){
        cellClasses += ` ${EMOTIONS_CONFIG[entry.emotion].hoverColor} bg-black/20`;
      } else {
        cellClasses += ' bg-black/20 hover:bg-gray-800/40';
      }

      if (isToday) {
        dayNumberClasses += ' bg-yellow-600 text-black rounded-full w-7 h-7 flex items-center justify-center';
      } else {
        dayNumberClasses += ' text-gray-300';
      }

      days.push(
        <div key={dateKey} className={cellClasses} onClick={() => onDateClick(date)}>
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
        days.push(<div key={`next-${i}`} className="border-r border-b border-gray-800/50 bg-black/10"></div>);
    }

    return days;
  };
  
  const totalEntries = Object.values(entries).filter(e => {
    const entryDate = new Date(e.date + 'T00:00:00'); // Ensure local timezone parsing
    return entryDate.getMonth() === month && entryDate.getFullYear() === year;
  }).length;


  return (
    <div className="bg-gray-900 rounded-lg shadow-xl p-4 md:p-6 animate-content-entry">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
            <h2 className="text-xl font-bold text-white mr-4">
              {currentDate.toLocaleString('default', { month: 'long' })} {year}
            </h2>
            <div className="flex items-center space-x-1">
                <button onClick={prevMonth} className="p-2 rounded-md hover:bg-gray-800 transition-colors"><IconChevronLeft className="w-5 h-5"/></button>
                <button onClick={nextMonth} className="p-2 rounded-md hover:bg-gray-800 transition-colors"><IconChevronRight className="w-5 h-5"/></button>
            </div>
        </div>
        <div>
            <span className="text-sm text-gray-400 mr-4">{`${totalEntries} entries this month`}</span>
            <button onClick={goToToday} className="px-4 py-2 text-sm font-medium bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">Today</button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-t border-l border-gray-800/50">
        {WEEK_DAYS.map(day => (
          <div key={day} className="py-2 text-center text-xs font-bold uppercase text-gray-400 bg-black/20 border-r border-b border-gray-800/50">{day}</div>
        ))}
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default CalendarView;