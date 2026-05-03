import { useState, useCallback, useMemo } from 'react';
import { SlashCommandRegistry, type SlashCommand } from '../services/slashCommandRegistry';

interface UseCommandInputReturn {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleCommand: () => Promise<void>;
  showSuggestions: boolean;
  suggestedCommands: SlashCommand[];
  isExecuting: boolean;
}

export function useCommandInput(
  onExecuteCommand: (command: SlashCommand, args: string[]) => Promise<void>
): UseCommandInputReturn {
  const [inputValue, setInputValue] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);

  const parseAndExecute = useCallback(async (input: string) => {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return false;

    const parts = trimmed.slice(1).split(/\s+/);
    const commandName = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    const command = SlashCommandRegistry.get(commandName);
    if (!command) return false;

    setIsExecuting(true);
    try {
      await onExecuteCommand(command, args);
    } finally {
      setIsExecuting(false);
    }
    return true;
  }, [onExecuteCommand]);

  const handleCommand = useCallback(async () => {
    if (!inputValue.trim()) return;
    await parseAndExecute(inputValue);
    setInputValue('');
  }, [inputValue, parseAndExecute]);

  const suggestedCommands = useMemo(() => {
    if (!inputValue.startsWith('/')) return [];
    const prefix = inputValue.slice(1);
    return SlashCommandRegistry.getByPrefix(prefix);
  }, [inputValue]);

  const showSuggestions = useMemo(() => {
    return inputValue.startsWith('/') && inputValue.length > 1 && suggestedCommands.length > 0;
  }, [inputValue, suggestedCommands]);

  return {
    inputValue,
    setInputValue,
    handleCommand,
    showSuggestions,
    suggestedCommands,
    isExecuting,
  };
}