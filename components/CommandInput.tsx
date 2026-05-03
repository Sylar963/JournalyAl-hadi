import React from 'react';
import { useI18n } from '../hooks/useI18n';
import { type SlashCommand } from '../services/slashCommandRegistry';

interface CommandInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  suggestions: SlashCommand[];
  showSuggestions: boolean;
  isExecuting: boolean;
  placeholder?: string;
}

const CommandInput: React.FC<CommandInputProps> = ({
  value,
  onChange,
  onSubmit,
  suggestions,
  showSuggestions,
  isExecuting,
  placeholder = '/command',
}) => {
  const { t } = useI18n();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSuggestionClick = (command: SlashCommand) => {
    onChange(`/${command.name} `);
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <span className="text-yellow-500 mr-2">/</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isExecuting}
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40"
        />
        {isExecuting && (
          <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
        )}
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 bg-gray-900 border border-white/10 rounded-lg shadow-xl mb-2 max-h-48 overflow-y-auto">
          {suggestions.map((cmd) => (
            <button
              key={cmd.name}
              onClick={() => handleSuggestionClick(cmd)}
              className="w-full px-4 py-2 text-left hover:bg-white/5 flex items-center justify-between"
            >
              <div>
                <span className="text-yellow-500 font-mono">/{cmd.name}</span>
                <span className="text-white/60 ml-2">{cmd.description}</span>
              </div>
              <span className="text-white/30 text-xs font-mono">{cmd.usage}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommandInput;