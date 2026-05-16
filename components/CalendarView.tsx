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

const getDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');

  return `${y}-${m}-${d}`;
};

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
    const dateKey = getDateKey(date);

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
      const dateKey = getDateKey(date);

      const entry = entries[dateKey];
      const isToday = date.getTime() === today.getTime();
      const hasTrades = entry?.tradingData?.trades && entry.tradingData.trades.length > 0;
      const hasValidEmotion = entry && entry.emotion && EMOTIONS_CONFIG[entry.emotion];

      let cellClasses = 'relative border-r border-b border-[color:var(--calendar-border)] p-3 text-left cursor-pointer transition-all duration-200 min-h-[126px] flex flex-col group';
      let dayNumberClasses = 'font-semibold transition-colors duration-300';

      if (hasValidEmotion) {
        cellClasses += ` ${EMOTIONS_CONFIG[entry.emotion].hoverColor} bg-[var(--surface-2)] hover:bg-[var(--surface-3)]`;
      } else if (hasTrades) {
        cellClasses += ' bg-emerald-500/10 hover:bg-emerald-500/20 border-l-2 border-l-emerald-400/50';
      } else {
        cellClasses += ' bg-transparent hover:bg-[var(--surface-2)]';
      }

      if (isToday) {
        dayNumberClasses += ' journal-button-primary rounded-full w-8 h-8 flex items-center justify-center journal-metric';
      } else {
        dayNumberClasses += ' text-[var(--text-muted)] group-hover:text-[var(--text-main)] journal-metric';
      }

      if (animatingDateKey === dateKey) {
        cellClasses += ' animate-cell-click';
      }

      days.push(
        <div key={dateKey} className={cellClasses} onClick={() => handleCellClick(date)}>
          <div className={dayNumberClasses}>{day}</div>
          {entry && entry.emotion && EMOTIONS_CONFIG[entry.emotion] && (
            <div className="mt-2 flex-grow flex flex-col justify-end">
              <span className={`text-2xl mb-1 drop-shadow-md`}>{EMOTIONS_CONFIG[entry.emotion].emoji}</span>
              <p className={`font-bold text-lg ${EMOTIONS_CONFIG[entry.emotion].textColor} drop-shadow-sm`}>
                {t(`emotion.${entry.emotion}` as TranslationKey)}
              </p>
              <p className="text-xs text-gray-400">{`${t('calendar.intensity')}: ${entry.intensity}/10`}</p>
            </div>
          )}
          {hasTrades && !hasValidEmotion && (
            <div className="mt-2 flex-grow flex flex-col justify-end">
              <span className="text-xl mb-1 drop-shadow-md">📈</span>
              <p className="font-bold text-lg text-emerald-400 drop-shadow-sm">
                {entry.tradingData?.trades?.length} {entry.tradingData?.trades?.length === 1 ? 'Trade' : 'Trades'}
              </p>
              <p className="text-xs text-gray-400">{t('calendar.synced')}</p>
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

  const getFoldedCellClasses = (entry?: EmotionEntry) => {
    if (entry?.emotion && EMOTIONS_CONFIG[entry.emotion]) {
      return `${EMOTIONS_CONFIG[entry.emotion].solidColor} opacity-90 hover:opacity-100`;
    }

    if ((entry?.tradingData?.trades?.length ?? 0) > 0) {
      return 'bg-emerald-400/80 hover:bg-emerald-300';
    }

    return 'bg-[var(--surface-3)]/60 hover:bg-[var(--surface-3)]';
  };

  const renderFoldedCalendar = () => {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);
    const gridStart = new Date(startOfYear);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());

    const gridEnd = new Date(endOfYear);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const weeks: Date[][] = [];
    const monthLabels: Array<{ column: number; label: string }> = [];
    const shortMonthLabel = (monthIndex: number) => {
      const translatedMonth = t(`month.${monthIndex}` as TranslationKey);
      return translatedMonth.charAt(0).toUpperCase() + translatedMonth.slice(1, 3);
    };

    const cursor = new Date(gridStart);

    while (cursor <= gridEnd) {
      const week: Date[] = [];
      const weekIndex = weeks.length;

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const currentDate = new Date(cursor);
        week.push(currentDate);

        if (currentDate.getFullYear() === year && currentDate.getDate() === 1) {
          monthLabels.push({
            column: weekIndex,
            label: shortMonthLabel(currentDate.getMonth())
          });
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      weeks.push(week);
    }

    const columnWidth = 20;

    return (
      <div className="animate-in fade-in slide-in-from-top-4 duration-500 rounded-xl border border-[color:var(--calendar-border)] bg-[linear-gradient(180deg,rgba(245,158,11,0.07),rgba(245,158,11,0)_55%)] p-3 sm:p-4">
        <div className="overflow-x-auto pb-1">
          <div className="min-w-max">
            <div className="relative ml-10 h-5">
              {monthLabels.map(({ column, label }) => (
                <span
                  key={`${label}-${column}`}
                  className="absolute top-0 text-xs text-[var(--text-main)]"
                  style={{ left: `${column * columnWidth}px` }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <div className="grid grid-rows-7 gap-1.5 pr-1 text-xs text-[var(--text-main)]">
                {WEEK_DAYS.map((day, index) => (
                  <div key={`folded-label-${day}`} className="flex h-3.5 items-center justify-end">
                    {index === 1 || index === 3 || index === 5 ? t(`weekday.${day.toLowerCase()}` as TranslationKey) : ''}
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5">
                {weeks.map((week, weekIndex) => (
                  <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1.5">
                    {week.map((date, dayIndex) => {
                      const isInSelectedYear = date.getFullYear() === year;

                      if (!isInSelectedYear) {
                        return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-3.5 w-3.5 rounded-[4px] bg-[var(--surface-3)]/25" />;
                      }

                      const dateKey = getDateKey(date);
                      const entry = entries[dateKey];
                      const emotionLabel = entry?.emotion && EMOTIONS_CONFIG[entry.emotion] ? t(`emotion.${entry.emotion}` as TranslationKey) : null;
                      const tradeCount = entry?.tradingData?.trades?.length ?? 0;
                      const isTodayCell = date.getTime() === today.getTime();
                      const titleParts = [date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })];

                      if (emotionLabel) {
                        titleParts.push(`${emotionLabel} ${entry.intensity}/10`);
                      }

                      if (tradeCount > 0) {
                        titleParts.push(`${tradeCount} ${tradeCount === 1 ? 'trade' : 'trades'}`);
                      }

                      return (
                        <button
                          key={dateKey}
                          type="button"
                          onClick={() => handleCellClick(date)}
                          title={titleParts.join(' • ')}
                          aria-label={titleParts.join(', ')}
                          className={`h-3.5 w-3.5 rounded-[4px] border border-black/10 transition-all duration-200 hover:scale-[1.18] hover:-translate-y-0.5 ${getFoldedCellClasses(entry)} ${isTodayCell ? 'ring-1 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--surface-1)]' : ''}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const [isFolded, setIsFolded] = useState(false);

  const totalEntries = Object.values(entries).filter((e: EmotionEntry) => {
    const entryDate = new Date(e.date + 'T00:00:00'); // Ensure local timezone parsing
    return entryDate.getMonth() === month && entryDate.getFullYear() === year;
  }).length;
  const yearlyEntries = Object.values(entries).filter((e: EmotionEntry) => {
    const entryDate = new Date(e.date + 'T00:00:00');
    return entryDate.getFullYear() === year;
  }).length;

  const monthName = t(`month.${month}` as TranslationKey);
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className={`rounded-2xl journal-panel p-4 md:p-6 animate-content-entry transition-all duration-500 ease-in-out ${isFolded ? 'h-auto' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-6">
            <p className="journal-kicker">Session Calendar</p>
            <h2 className="text-2xl font-semibold text-[var(--text-main)] tracking-tight mt-1">
              {isFolded ? <span className="journal-metric">{year}</span> : <>{capitalizedMonth} <span className="journal-metric">{year}</span></>}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => onYearChange(-1)} className="journal-button-secondary p-2 rounded-lg transition-colors" title={t('calendar.prev_year')}><IconChevronsLeft className="w-5 h-5" /></button>
            <button onClick={() => onMonthChange(-1)} className="journal-button-secondary p-2 rounded-lg transition-colors" title={t('calendar.prev_month')}><IconChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => onMonthChange(1)} className="journal-button-secondary p-2 rounded-lg transition-colors" title={t('calendar.next_month')}><IconChevronRight className="w-5 h-5" /></button>
            <button onClick={() => onYearChange(1)} className="journal-button-secondary p-2 rounded-lg transition-colors" title={t('calendar.next_year')}><IconChevronsLeft className="w-5 h-5 rotate-180" /></button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-[var(--text-muted)] hidden md:inline font-medium tracking-wide journal-metric">{`${isFolded ? yearlyEntries : totalEntries} ${t(isFolded ? 'calendar.entries_count_year' : 'calendar.entries_count')}`}</span>
          <button onClick={onGoToToday} className="journal-button-secondary px-4 py-2 text-sm font-medium rounded-lg transition-all">{t('calendar.today')}</button>
          <button
            onClick={() => setIsFolded(!isFolded)}
            className="journal-button-primary px-4 py-2 text-sm font-medium hover:opacity-95 rounded-lg transition-all flex items-center"
          >
            {isFolded ? t('calendar.unfold') : t('calendar.fold')}
          </button>
        </div>
      </div>

      {isFolded ? (
        renderFoldedCalendar()
      ) : (
        <div className="grid grid-cols-7 border-t border-l border-[color:var(--calendar-border)] animate-in fade-in slide-in-from-top-4 duration-500 rounded-tl-lg rounded-tr-lg overflow-hidden bg-[var(--surface-1)]">
          {WEEK_DAYS.map((day, index) => (
            <div
              key={day}
              className={`py-3 text-center text-xs font-bold uppercase bg-[var(--surface-2)] border-r border-b border-[color:var(--calendar-border)] text-[var(--text-muted)] tracking-wider ${DAY_TEXT_CLASSES[index]}`}
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
