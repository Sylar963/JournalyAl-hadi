import type { EmotionEntry } from '../types';
import type { Language } from '../utils/translations';
import { invokeJournalAi } from './journalAiService';

export async function getMemoryChatReply(memoryNotes: string, message: string, entries: EmotionEntry[], language: Language): Promise<string> {
  const recentEntries = [...entries]
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-45);

  const response = await invokeJournalAi<{ response: string }>('chat-memory', {
    memoryNotes,
    message,
    entries: recentEntries,
    language,
  });

  return response.response;
}
