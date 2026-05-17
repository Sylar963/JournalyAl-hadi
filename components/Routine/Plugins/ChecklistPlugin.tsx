import React, { useEffect, useState } from 'react';
import { ChecklistTask, ChecklistWidgetData } from '../../../types';

const DEFAULT_TASKS: ChecklistTask[] = [
    { id: 1, text: 'Check Economic Calendar', done: false },
    { id: 2, text: 'Mark DXY Levels', done: false },
    { id: 3, text: 'Review Weekly VWAP', done: false },
    { id: 4, text: 'Journal Previous Day', done: true },
];

const ChecklistPlugin: React.FC<{ data: ChecklistWidgetData; onUpdate: (data: ChecklistWidgetData) => void }> = ({ data, onUpdate }) => {
    const [tasks, setTasks] = useState<ChecklistTask[]>(data.tasks ?? DEFAULT_TASKS);

    useEffect(() => {
        setTasks(data.tasks ?? DEFAULT_TASKS);
    }, [data.tasks]);

    const toggleTask = (id: number) => {
        const nextTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        setTasks(nextTasks);
        onUpdate({ tasks: nextTasks });
    };

    const progress = Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);

    return (
        <div className="h-full flex flex-col">
            <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="space-y-1 overflow-y-auto flex-grow pr-1 custom-scrollbar">
                {tasks.map(task => (
                    <div 
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className={`group flex items-center p-2 rounded-lg cursor-pointer transition-all ${
                            task.done ? 'bg-green-500/5' : 'hover:bg-white/5'
                        }`}
                    >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${
                            task.done 
                                ? 'bg-green-500 border-green-500 text-black' 
                                : 'border-gray-600 group-hover:border-gray-400'
                        }`}>
                            {task.done && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span className={`text-sm ${task.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                            {task.text}
                        </span>
                    </div>
                ))}
            </div>
            
            <button className="mt-2 w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-gray-500 hover:text-white hover:border-white/30 transition-all">
                + Add Task
            </button>
        </div>
    );
};

export const checklistConfig = {
    id: 'checklist',
    title: 'plugin.checklist.title',
    description: 'plugin.checklist.desc',
    defaultSize: { w: 1, h: 2 },
    component: ChecklistPlugin,
    icon: <span className="text-lg">✅</span>
};

export default ChecklistPlugin;
