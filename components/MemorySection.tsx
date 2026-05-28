import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ChatMessage, EmotionEntry, UserProfile } from '../types';
import { getMemoryChatReply } from '../services/memoryChatService';
import { getErrorMessage } from '../utils/errorHelpers';
import { useI18n } from '../hooks/useI18n';
import IconBrain from './icons/IconBrain';
import IconSparkles from './icons/IconSparkles';

interface MemorySectionProps {
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
  entries: EmotionEntry[];
  canUseAi: boolean;
}

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructorLike = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructorLike;
  webkitSpeechRecognition?: SpeechRecognitionConstructorLike;
};

const AUTOSAVE_DELAY_MS = 1500;

const MemorySection: React.FC<MemorySectionProps> = ({ userProfile, onSaveProfile, entries, canUseAi }) => {
  const { t, language } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);
  const [memoryNotes, setMemoryNotes] = useState(userProfile.memoryNotes ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatError, setChatError] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceError, setVoiceError] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recordingSnapshotRef = useRef<{ baseText: string; selectionStart: number; selectionEnd: number } | null>(null);

  const profileMemoryNotes = userProfile.memoryNotes ?? '';
  const speechWindow = typeof window !== 'undefined' ? window as SpeechWindow : null;
  const SpeechRecognitionConstructor = speechWindow?.SpeechRecognition ?? speechWindow?.webkitSpeechRecognition ?? null;
  const isSpeechSupported = !!SpeechRecognitionConstructor;

  useEffect(() => {
    setMemoryNotes(profileMemoryNotes);
  }, [profileMemoryNotes]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [memoryNotes, isExpanded]);

  useEffect(() => {
    if (memoryNotes === profileMemoryNotes) {
      return;
    }

    setSaveStatus('pending');
    setSaveError('');

    const timeoutId = window.setTimeout(async () => {
      setSaveStatus('saving');

      try {
        await onSaveProfile({ ...userProfile, memoryNotes });
        setSaveStatus('saved');
      } catch (error) {
        setSaveStatus('error');
        setSaveError(getErrorMessage(error));
      }
    }, AUTOSAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [memoryNotes, onSaveProfile, profileMemoryNotes, userProfile]);

  useEffect(() => {
    if (saveStatus !== 'saved') {
      return;
    }

    const timeoutId = window.setTimeout(() => setSaveStatus('idle'), 2200);
    return () => window.clearTimeout(timeoutId);
  }, [saveStatus]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const replaceActiveTranscript = useCallback((transcript: string) => {
    const snapshot = recordingSnapshotRef.current;
    if (!snapshot) {
      return;
    }

    const nextNotes = `${snapshot.baseText.slice(0, snapshot.selectionStart)}${transcript}${snapshot.baseText.slice(snapshot.selectionEnd)}`;
    setMemoryNotes(nextNotes);

    const nextCursorPosition = snapshot.selectionStart + transcript.length;
    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
    });
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startRecording = useCallback(() => {
    if (!SpeechRecognitionConstructor) {
      setVoiceError(t('memory.voice.unsupported'));
      return;
    }

    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? memoryNotes.length;
    const selectionEnd = textarea?.selectionEnd ?? memoryNotes.length;

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === 'es' ? 'es-ES' : 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';

      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index]?.[0]?.transcript ?? '';
      }

      replaceActiveTranscript(transcript.trim());
    };

    recognition.onerror = (event) => {
      setVoiceError(
        event.error === 'not-allowed'
          ? t('memory.voice.permission_denied')
          : t('memory.voice.failed'),
      );
      setIsRecording(false);
      recognitionRef.current = null;
      recordingSnapshotRef.current = null;
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      recordingSnapshotRef.current = null;
    };

    recordingSnapshotRef.current = {
      baseText: memoryNotes,
      selectionStart,
      selectionEnd,
    };
    recognitionRef.current = recognition;
    setVoiceError('');
    setIsRecording(true);
    recognition.start();
  }, [SpeechRecognitionConstructor, language, memoryNotes, replaceActiveTranscript, t]);

  const handleMicClick = useCallback(() => {
    if (isRecording) {
      stopRecording();
      return;
    }

    startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleSendMessage = useCallback(async () => {
    const trimmedMessage = chatInput.trim();
    if (!trimmedMessage || isChatLoading || !canUseAi) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setChatInput('');
    setChatError('');
    setIsChatLoading(true);

    try {
      const response = await getMemoryChatReply(memoryNotes, trimmedMessage, entries, language);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setChatError(getErrorMessage(error));
    } finally {
      setIsChatLoading(false);
    }
  }, [canUseAi, chatInput, entries, isChatLoading, language, memoryNotes]);

  const handleChatKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleSendMessage();
    }
  }, [handleSendMessage]);

  const saveStatusLabel =
    saveStatus === 'saving'
      ? t('memory.save.saving')
      : saveStatus === 'saved'
        ? t('memory.save.saved')
        : saveStatus === 'error'
          ? t('memory.save.error')
          : saveStatus === 'pending'
            ? t('memory.save.pending')
            : t('memory.save.idle');

  return (
    <section className="rounded-2xl journal-panel animate-content-entry border border-[var(--panel-border)] p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--panel-border-strong)] bg-[var(--surface-3)] text-[var(--accent-primary)] shadow-[0_0_30px_rgba(142,184,255,0.12)]">
            <IconBrain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="journal-kicker">{t('memory.kicker')}</p>
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">
                {t('memory.beta')}
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-main)]">{t('memory.title')}</h2>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-muted)]">{t('memory.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded((currentValue) => !currentValue)}
          className="journal-button-secondary rounded-xl px-4 py-2 text-sm font-medium"
        >
          {isExpanded ? t('dashboard.sidebar.collapse') : t('dashboard.sidebar.expand')}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-5">
          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-1)] p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--panel-border)] pb-4">
              <div>
                <p className="journal-kicker">MEMORY.md</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{t('memory.editor.subtitle')}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium ${saveStatus === 'error' ? 'text-red-300' : 'text-[var(--text-muted)]'}`}>
                  {saveStatusLabel}
                </span>
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={!isSpeechSupported}
                  aria-pressed={isRecording}
                  aria-label={isRecording ? t('memory.voice.stop') : t('memory.voice.start')}
                  title={isSpeechSupported ? (isRecording ? t('memory.voice.stop') : t('memory.voice.start')) : t('memory.voice.unsupported')}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isRecording ? 'border-red-400/40 bg-red-500/10 text-red-200' : 'border-[var(--panel-border)] bg-[var(--surface-2)] text-[var(--text-main)] hover:border-[var(--panel-border-strong)]'}`}
                >
                  <span className={`inline-flex h-2.5 w-2.5 rounded-full ${isRecording ? 'animate-pulse bg-red-400' : 'bg-[var(--accent-primary)]'}`} />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <path d="M12 19v3" />
                  </svg>
                  <span>{isRecording ? t('memory.voice.stop') : t('memory.voice.start')}</span>
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={memoryNotes}
              onChange={(event) => setMemoryNotes(event.target.value)}
              readOnly={isRecording}
              placeholder={t('memory.editor.placeholder')}
              className="journal-input mt-4 min-h-[260px] w-full resize-none rounded-2xl p-4 text-sm leading-7"
            />

            {(saveError || voiceError) && (
              <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                {saveError || voiceError}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-1)] p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--panel-border)] pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="journal-kicker">{t('memory.chat.kicker')}</p>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                    {t('memory.beta')}
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-semibold text-[var(--text-main)]">{t('memory.chat.title')}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{canUseAi ? t('memory.chat.subtitle') : t('memory.chat.locked')}</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--text-muted)]">
                <IconSparkles className="h-4 w-4 text-[var(--accent-primary)]" />
                <span>{t('memory.chat.badge')}</span>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="max-h-[340px] space-y-3 overflow-y-auto rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-2)] p-3">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[var(--panel-border)] p-4 text-sm text-[var(--text-muted)]">
                    {t('memory.chat.empty')}
                  </div>
                ) : (
                  messages.map((message) => (
                    <article
                      key={message.id}
                      className={`rounded-2xl border p-4 text-sm leading-7 ${message.role === 'assistant' ? 'border-[var(--panel-border)] bg-[var(--surface-1)] text-[var(--text-main)]' : 'border-[var(--panel-border-strong)] bg-[var(--surface-3)] text-[var(--text-main)]'}`}
                    >
                      <p className="journal-kicker mb-2">{message.role === 'assistant' ? t('memory.chat.assistant') : t('memory.chat.you')}</p>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </article>
                  ))
                )}
                {isChatLoading && (
                  <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-1)] p-4 text-sm text-[var(--text-muted)]">
                    {t('memory.chat.loading')}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={handleChatKeyDown}
                  disabled={!canUseAi || isChatLoading}
                  placeholder={canUseAi ? t('memory.chat.placeholder') : t('memory.chat.placeholder_locked')}
                  rows={4}
                  className="journal-input w-full resize-none rounded-2xl p-4 text-sm leading-7 disabled:cursor-not-allowed disabled:opacity-60"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-[var(--text-muted)]">{t('memory.chat.shortcut')}</p>
                  <button
                    type="button"
                    onClick={() => void handleSendMessage()}
                    disabled={!canUseAi || isChatLoading || !chatInput.trim()}
                    className="journal-button-primary rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isChatLoading ? t('memory.chat.sending') : t('memory.chat.send')}
                  </button>
                </div>
                {chatError && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
                    {chatError}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MemorySection;
