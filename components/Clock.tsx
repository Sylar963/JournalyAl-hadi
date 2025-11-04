
import React, { useState, useEffect, useRef } from 'react';
import IconClock from './icons/IconClock';

const Clock: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isTooltipVisible, setIsTooltipVisible] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    // Close tooltip on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsTooltipVisible(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [wrapperRef]);


    const formatTime = (date: Date, timeZone: string) => {
        return date.toLocaleTimeString('en-US', {
            timeZone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };
    
    // Use a specific set of timezones to show
    const timezones = [
        { name: 'Local', tz: Intl.DateTimeFormat().resolvedOptions().timeZone },
        { name: 'PST', tz: 'America/Los_Angeles' },
        { name: 'EST', tz: 'America/New_York' },
        { name: 'UTC', tz: 'UTC' },
        { name: 'CET', tz: 'Europe/Paris' },
    ];
    // De-duplicate in case user's local is one of the others
    const uniqueTimezones = timezones.filter((v,i,a)=>a.findIndex(t=>(t.tz === v.tz))===i)


    return (
        <div 
            ref={wrapperRef}
            className="relative"
            onMouseEnter={() => setIsTooltipVisible(true)}
            onMouseLeave={() => setIsTooltipVisible(false)}
        >
            <button 
                onClick={() => setIsTooltipVisible(prev => !prev)}
                className="p-2 rounded-full text-gray-400 hover:bg-gray-800 hover:text-white transition-colors" 
                title="Current Time"
                aria-haspopup="true"
                aria-expanded={isTooltipVisible}
            >
                <IconClock className="w-6 h-6" />
            </button>
            
            {isTooltipVisible && (
                <div 
                    role="tooltip"
                    className="absolute top-full right-0 mt-2 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 p-3 text-sm animate-popover-enter"
                >
                    <div className="font-bold text-white mb-2 text-center border-b border-gray-700 pb-2">
                        {currentTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true, timeZoneName: 'short' })}
                    </div>
                    <ul className="space-y-1.5">
                        {uniqueTimezones.map(({ name, tz }) => (
                            <li key={name} className="flex justify-between items-center">
                                <span className="text-gray-400">{name}</span>
                                <span className="font-mono text-gray-200">{formatTime(currentTime, tz)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Clock;
