

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { type EmotionEntry, type EmotionType } from '../types';
import { EMOTIONS_CONFIG } from '../constants';
import { getEmotionInsight } from '../services/geminiService';
import IconSparkles from './icons/IconSparkles';
import IconUpload from './icons/IconUpload';
import IconTrash from './icons/IconTrash';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<EmotionEntry, 'date'>) => Promise<void>;
  onDelete: () => void;
  selectedDate: Date;
  entry?: EmotionEntry;
  initialEmotion?: EmotionType;
}

const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose, onSave, onDelete, selectedDate, entry, initialEmotion }) => {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(entry?.emotion ?? initialEmotion ?? null);
  const [intensity, setIntensity] = useState<number>(entry?.intensity ?? 5);
  const [notes, setNotes] = useState<string>(entry?.notes ?? '');
  const [image, setImage] = useState<string | undefined>(entry?.imageUrl);
  
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setSelectedEmotion(entry?.emotion ?? initialEmotion ?? null);
    setIntensity(entry?.intensity ?? 5);
    setNotes(entry?.notes ?? '');
    setImage(entry?.imageUrl ?? undefined);
    setAiInsight('');
    setAiError('');
    setSaveError(null);
    setIsSaving(false);
  }, [entry, isOpen, initialEmotion]);

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;

      const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusableElements || focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      firstElement.focus();

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
        if (event.key === 'Tab') {
          if (event.shiftKey) { // Shift + Tab
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else { // Tab
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        triggerRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!selectedEmotion) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave({ emotion: selectedEmotion, intensity, notes, imageUrl: image });
      // The onSave handler in App.tsx closes the modal on success.
    } catch (error: any) {
      let message = 'An unexpected error occurred. Please try again.';
      if (error.message && error.message.includes('ON CONFLICT')) {
        message = 'Database Schema Error: A unique constraint is missing on the `entries` table for `(user_id, date)`. Please follow the setup instructions in `services/supabaseService.ts` to fix this.';
      } else if (error.message) {
        message = `Error: ${error.message}`;
      }
      setSaveError(message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert("File is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImage(undefined);
  };

  const handleFetchInsight = useCallback(async () => {
      if (!entry || !selectedEmotion) return;
      setIsInsightLoading(true);
      setAiError('');
      setAiInsight('');
      try {
          const currentEntryState: EmotionEntry = {
              ...(entry),
              emotion: selectedEmotion,
              intensity,
              notes,
              imageUrl: image,
          };
          const insight = await getEmotionInsight(currentEntryState);
          setAiInsight(insight);
      } catch(error) {
          console.error(error);
          setAiError('Failed to get insight. Please try again.');
      } finally {
          setIsInsightLoading(false);
      }
  }, [entry, selectedEmotion, intensity, notes, image]);

  if (!isOpen) return null;
  
  const emotionKeys = Object.keys(EMOTIONS_CONFIG) as EmotionType[];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg border border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <div className="flex justify-between items-start">
            <div>
                <h2 id="entry-modal-title" className="text-xl font-bold text-white">Your Entry</h2>
                <p className="text-gray-400">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">How are you feeling?</label>
            <div className="grid grid-cols-5 gap-3">
              {emotionKeys.map(key => {
                  const config = EMOTIONS_CONFIG[key];
                  const isSelected = selectedEmotion === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedEmotion(key)}
                      className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                          isSelected ? `${config.color.replace('bg-', 'border-')} scale-105` : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <span className="text-3xl">{config.emoji}</span>
                      <span className={`mt-1 text-xs font-medium ${isSelected ? config.textColor : 'text-gray-400'}`}>{config.label}</span>
                    </button>
                  )
              })}
            </div>
          </div>
          
          {!selectedEmotion && (
            <div className="text-center text-sm text-yellow-400/80 bg-yellow-900/20 p-2 rounded-md border border-yellow-500/30">
              Please select an emotion above to save your entry.
            </div>
          )}

          <div>
            <label htmlFor="intensity" className="block text-sm font-medium text-gray-300 mb-2">Intensity: <span className="font-bold text-white">{intensity}</span></label>
            <input
              type="range"
              id="intensity"
              min="1"
              max="10"
              value={intensity}
              onChange={e => setIntensity(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What happened today?"
              className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Attached Image</label>
            {image ? (
                <div className="relative group">
                <img src={image} alt="Entry attachment" className="w-full h-auto max-h-48 object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <button 
                    onClick={handleRemoveImage}
                    className="flex items-center bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                    <IconTrash className="w-4 h-4 mr-2" />
                    Remove Image
                    </button>
                </div>
                </div>
            ) : (
                <label htmlFor="image-upload" className="cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-lg hover:bg-gray-800/50 hover:border-gray-600 transition-colors">
                <IconUpload className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-sm font-semibold text-yellow-400">Upload an image</span>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                <input id="image-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
                </label>
            )}
          </div>

          {entry && (
             <div>
                <button onClick={handleFetchInsight} disabled={isInsightLoading || !selectedEmotion} className="w-full flex items-center justify-center bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                    <IconSparkles className="w-5 h-5 mr-2" />
                    {isInsightLoading ? 'Generating...' : 'Get AI Insight'}
                </button>
                 {isInsightLoading && <p className="text-center text-sm text-gray-400 mt-2">The AI is thinking...</p>}
                 {aiError && <p className="text-center text-sm text-red-400 mt-2">{aiError}</p>}
                 {aiInsight && (
                     <div className="mt-4 p-4 bg-black/25 rounded-lg border border-gray-700">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{aiInsight}</p>
                     </div>
                 )}
            </div>
          )}
        </div>

        <div className="p-6 bg-black/25 border-t border-gray-800 flex flex-col gap-4 rounded-b-xl">
            {saveError && (
                <div className="bg-red-900/50 border border-red-500/30 text-red-300 p-3 rounded-lg text-sm">
                    <p className="font-bold mb-1">Could not save entry</p>
                    <p className="text-red-200">{saveError}</p>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    {entry && (
                        <button onClick={onDelete} className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors">Delete Entry</button>
                    )}
                </div>
                <div className="flex space-x-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={!selectedEmotion || isSaving}
                        title={!selectedEmotion ? 'Please select an emotion first' : 'Save your journal entry'}
                        className="px-4 py-2 text-sm font-medium bg-yellow-600 text-black hover:bg-yellow-700 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 w-28 text-center"
                    >
                        {isSaving ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mx-auto"></div>
                        ) : 'Save Entry'}
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default EntryModal;