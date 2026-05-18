import React, { useEffect, useState } from 'react';
import { ChecklistTask, ChecklistWidgetData } from '../../../types';

const DEFAULT_TASKS: ChecklistTask[] = [
    { id: 1, text: 'Check Economic Calendar', done: false },
    { id: 2, text: 'Mark DXY Levels', done: false },
    { id: 3, text: 'Review Weekly VWAP', done: false },
    { id: 4, text: 'Journal Previous Day', done: true },
];

const getNextTaskId = (currentTasks: ChecklistTask[]) => (
    currentTasks.reduce((maxId, task) => Math.max(maxId, task.id), 0) + 1
);

const ChecklistPlugin: React.FC<{ data: ChecklistWidgetData; onUpdate: (data: ChecklistWidgetData) => void }> = ({ data, onUpdate }) => {
    const [tasks, setTasks] = useState<ChecklistTask[]>(data.tasks ?? DEFAULT_TASKS);
    const [draftTask, setDraftTask] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);

    useEffect(() => {
        setTasks(data.tasks ?? DEFAULT_TASKS);
    }, [data.tasks]);

    const toggleTask = (id: number) => {
        const nextTasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
        setTasks(nextTasks);
        onUpdate({ tasks: nextTasks });
    };

    const addTask = () => {
        const trimmedTask = draftTask.trim();
        if (!trimmedTask) {
            return;
        }

        const nextTasks = [
            ...tasks,
            { id: getNextTaskId(tasks), text: trimmedTask, done: false },
        ];
        setTasks(nextTasks);
        setDraftTask('');
        setIsAddingTask(false);
        onUpdate({ tasks: nextTasks });
    };

    const removeTask = (id: number) => {
        const nextTasks = tasks.filter((task) => task.id !== id);
        setTasks(nextTasks);
        onUpdate({ tasks: nextTasks });
    };

    const progress = tasks.length === 0 ? 0 : Math.round((tasks.filter(t => t.done).length / tasks.length) * 100);

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
                        className={`group flex items-center gap-3 p-2 rounded-lg transition-all ${
                            task.done ? 'bg-green-500/5' : 'hover:bg-white/5'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            aria-label={`${task.done ? 'Mark task as incomplete' : 'Mark task as complete'}: ${task.text}`}
                            className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                                task.done
                                    ? 'bg-green-500 border-green-500 text-black'
                                    : 'border-gray-600 group-hover:border-gray-400'
                            }`}
                        >
                            {task.done && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </button>
                        <button
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`flex-1 text-left text-sm ${task.done ? 'text-gray-500 line-through' : 'text-gray-300'}`}
                        >
                            {task.text}
                        </button>
                        {task.done && (
                            <button
                                type="button"
                                onClick={() => removeTask(task.id)}
                                aria-label={`Remove task: ${task.text}`}
                                className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
                            >
                                X
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {isAddingTask ? (
                <form
                    className="mt-2 space-y-2"
                    onSubmit={(event) => {
                        event.preventDefault();
                        addTask();
                    }}
                >
                    <input
                        autoFocus
                        value={draftTask}
                        onChange={(event) => setDraftTask(event.target.value)}
                        placeholder="Add a pre-flight task"
                        className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-white/25"
                    />
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/15"
                        >
                            Save Task
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDraftTask('');
                                setIsAddingTask(false);
                            }}
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-gray-400 transition-colors hover:border-white/25 hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    type="button"
                    onClick={() => setIsAddingTask(true)}
                    className="mt-2 w-full py-2 border border-dashed border-white/10 rounded-lg text-xs text-gray-500 hover:text-white hover:border-white/30 transition-all"
                >
                    + Add Task
                </button>
            )}
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
