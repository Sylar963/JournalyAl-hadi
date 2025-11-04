import React, { useState, useRef, useEffect } from 'react';
import { Quest } from '../types';
import IconPlus from './icons/IconPlus';
import IconTrash from './icons/IconTrash';

interface QuestsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  onAddQuest: (text: string) => Promise<void>;
  onToggleQuest: (id: string, completed: boolean) => Promise<void>;
  onDeleteQuest: (id: string) => Promise<void>;
  anchorRef: React.RefObject<HTMLDivElement>;
}

const QuestItem: React.FC<{ quest: Quest, onToggle: () => void, onDelete: () => void }> = ({ quest, onToggle, onDelete }) => (
    <div className="flex items-center space-x-3 group py-2">
        <input 
            type="checkbox" 
            checked={quest.completed} 
            onChange={onToggle}
            className="w-5 h-5 bg-gray-800 border-gray-600 rounded text-yellow-500 focus:ring-yellow-500/50 focus:ring-offset-gray-900" 
        />
        <p className={`flex-1 text-sm ${quest.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
            {quest.text}
        </p>
        <button onClick={onDelete} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Delete quest">
            <IconTrash className="w-4 h-4" />
        </button>
    </div>
);


const QuestsPopover: React.FC<QuestsPopoverProps> = ({ isOpen, quests, onAddQuest, onToggleQuest, onDeleteQuest, anchorRef }) => {
  const [newQuestText, setNewQuestText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen) {
        inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleAddQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestText.trim() === '' || isAdding) return;
    setIsAdding(true);
    try {
        await onAddQuest(newQuestText);
        setNewQuestText('');
    } catch (error) {
        console.error("Failed to add quest", error);
    } finally {
        setIsAdding(false);
    }
  };
  
  const pendingQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed);

  if (!isOpen) return null;

  return (
    <div ref={anchorRef} className="absolute top-16 right-4 md:right-6 w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl z-50 animate-popover-enter">
        <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold text-white">My Quests</h3>
            <p className="text-sm text-gray-400">Your daily goals and tasks.</p>
        </div>
        <div className="p-4 max-h-72 overflow-y-auto">
            {quests.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">No quests yet. Add one below!</p>
            ) : (
                <>
                    {pendingQuests.length > 0 && (
                        <div className="space-y-1">
                            {pendingQuests.map(quest => (
                                <QuestItem key={quest.id} quest={quest} onToggle={() => onToggleQuest(quest.id, !quest.completed)} onDelete={() => onDeleteQuest(quest.id)} />
                            ))}
                        </div>
                    )}
                    {completedQuests.length > 0 && (
                        <>
                          <div className="my-3 border-t border-dashed border-gray-700/50"></div>
                          <div className="space-y-1">
                            {completedQuests.map(quest => (
                                <QuestItem key={quest.id} quest={quest} onToggle={() => onToggleQuest(quest.id, !quest.completed)} onDelete={() => onDeleteQuest(quest.id)} />
                            ))}
                          </div>
                        </>
                    )}
                </>
            )}
        </div>
        <div className="p-3 bg-black/25 border-t border-gray-800">
            <form onSubmit={handleAddQuest} className="flex items-center space-x-2">
                <input 
                    ref={inputRef}
                    type="text"
                    value={newQuestText}
                    onChange={e => setNewQuestText(e.target.value)}
                    placeholder="Add a new quest..."
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-gray-200 focus:ring-1 focus:ring-yellow-500 focus:border-transparent transition"
                />
                <button type="submit" disabled={isAdding} className="p-2 bg-yellow-600 text-black rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors" aria-label="Add quest">
                    <IconPlus className="w-5 h-5"/>
                </button>
            </form>
        </div>
    </div>
  );
};

export default QuestsPopover;