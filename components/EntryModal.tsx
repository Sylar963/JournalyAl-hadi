
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
  onDelete: () => Promise<void>;
  selectedDate: Date;
  entry?: EmotionEntry;
  initialEmotion?: EmotionType;
}

const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose, onSave, onDelete, selectedDate, entry, initialEmotion }) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'trading'>('journal');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(entry?.emotion ?? initialEmotion ?? null);
  const [intensity, setIntensity] = useState<number>(entry?.intensity ?? 5);
  const [notes, setNotes] = useState<string>(entry?.notes ?? '');
  const [image, setImage] = useState<string | undefined>(entry?.imageUrl);
  
  // Trading Tab State
  const [pnl, setPnl] = useState<string>(entry?.pnl?.toString() ?? '');
  const [trades, setTrades] = useState<any[]>(entry?.tradingData?.trades ?? []);
  
  // New Trade Form State
  const [tradeType, setTradeType] = useState<string>('Long Future');
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradePnl, setTradePnl] = useState('');
  const [tradeNotes, setTradeNotes] = useState('');

  const [aiInsight, setAiInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{ message: string; visible: boolean } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setActiveTab('journal'); // Reset to journal tab on open
    setSelectedEmotion(entry?.emotion ?? initialEmotion ?? null);
    setIntensity(entry?.intensity ?? 5);
    setNotes(entry?.notes ?? '');
    setImage(entry?.imageUrl ?? undefined);
    setPnl(entry?.pnl?.toString() ?? '');
    setTrades(entry?.tradingData?.trades ?? []);
    
    setAiInsight('');
    setAiError('');
    setOperationError(null);
    setIsSaving(false);
    setIsDeleting(false);
    setConfirmation(null);
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
          if (!isSaving && !isDeleting) {
            onClose();
          }
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
  }, [isOpen, onClose, isSaving, isDeleting]);
  
   // Effect to manage the toast animation lifecycle
  useEffect(() => {
    if (confirmation?.message && !confirmation.visible) {
      // A message is set, but invisible. Trigger the visibility on the next tick.
      const timer = setTimeout(() => {
        setConfirmation({ ...confirmation, visible: true });
      }, 10);
      return () => clearTimeout(timer);
    }

    if (confirmation?.visible) {
      // The toast is visible, schedule the modal to close.
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [confirmation, onClose]);

  const showConfirmation = (message: string) => {
    setConfirmation({ message, visible: false });
  };

  const handleAddTrade = () => {
    if (!tradeSymbol || !tradeType) return;
    
    const newTrade = {
        id: crypto.randomUUID(),
        type: tradeType,
        symbol: tradeSymbol.toUpperCase(),
        pnl: tradePnl ? parseFloat(tradePnl) : undefined,
        notes: tradeNotes
    };
    
    setTrades([...trades, newTrade]);
    
    // Reset form
    setTradeSymbol('');
    setTradePnl('');
    setTradeNotes('');
  };

  const handleRemoveTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  const handleSave = async () => {
    if (!selectedEmotion) {
        // If they are on the trading tab and try to save without an emotion, switch to journal tab
        if (activeTab === 'trading') {
            setActiveTab('journal');
            // Small delay to let tab switch happen before alert or just let them see the error state
        }
        return;
    }

    setIsSaving(true);
    setOperationError(null);
    try {
      await onSave({ 
          emotion: selectedEmotion, 
          intensity, 
          notes, 
          imageUrl: image,
          pnl: pnl ? parseFloat(pnl) : undefined,
          tradingData: { trades }
      });
      showConfirmation('Entry Saved!');
    } catch (error: any) {
      let message = 'An unexpected error occurred. Please try again.';
      if (error.message && error.message.includes('ON CONFLICT')) {
        message = 'Database Schema Error: A unique constraint is missing on the `entries` table for `(user_id, date)`. Please follow the setup instructions in `services/supabaseService.ts` to fix this.';
      } else if (error.message) {
        message = `Error: ${error.message}`;
      }
      setOperationError(message);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setOperationError(null);
    try {
        await onDelete();
        showConfirmation('Entry Deleted!');
    } catch (err: any) {
        setOperationError(err.message || 'Failed to delete entry.');
        setIsDeleting(false);
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
  const tradeTypes = ['Long Future', 'Short Future', 'BTO Call', 'BTO Put', 'STC Call', 'STC Put', 'STO Call', 'STO Put', 'BTC Call', 'BTC Put'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        ref={modalRef} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        className="glass-panel rounded-2xl shadow-2xl w-full max-w-lg border border-[color:var(--glass-border)] animate-scale-in flex flex-col max-h-[90vh]">
        
        {/* Browser-like Tab Bar */}
        <div className="flex items-center px-4 pt-4 border-b border-[color:var(--glass-border)] bg-black/20 rounded-t-2xl space-x-2">
            <button
                onClick={() => setActiveTab('journal')}
                className={`px-6 py-2 rounded-t-lg text-sm font-medium transition-all relative ${
                    activeTab === 'journal'
                        ? 'text-white bg-white/5 border-t border-l border-r border-[color:var(--glass-border)]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
            >
                Journal
                {activeTab === 'journal' && <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-[#050507] z-10"></div>}
            </button>
            <button
                onClick={() => setActiveTab('trading')}
                className={`px-6 py-2 rounded-t-lg text-sm font-medium transition-all relative ${
                    activeTab === 'trading'
                        ? 'text-white bg-white/5 border-t border-l border-r border-[color:var(--glass-border)]'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
            >
                Trading
                {activeTab === 'trading' && <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-[#050507] z-10"></div>}
            </button>
            
            <div className="ml-auto">
                <button onClick={onClose} disabled={isSaving || isDeleting} className="text-gray-400 hover:text-white transition-colors text-xl leading-none disabled:opacity-50 p-1">&times;</button>
            </div>
        </div>

        <div className="p-6 border-b border-[color:var(--glass-border)]">
          <div className="flex justify-between items-start">
            <div>
                <h2 id="entry-modal-title" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                    {activeTab === 'journal' ? 'Your Entry' : 'Trading Log'}
                </h2>
                <p className="text-gray-400 text-sm">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'journal' ? (
              <>
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
                            className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-300 ${
                                isSelected 
                                    ? `border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 scale-105 shadow-[0_0_15px_rgba(6,182,212,0.2)]` 
                                    : 'border-[color:var(--glass-border)] bg-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                            >
                            <span className="text-3xl filter drop-shadow-md">{config.emoji}</span>
                            <span className={`mt-1 text-xs font-medium ${isSelected ? 'text-[var(--accent-primary)]' : 'text-gray-400'}`}>{config.label}</span>
                            </button>
                        )
                    })}
                    </div>
                </div>
                
                {!selectedEmotion && (
                    <div className="text-center text-sm text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 p-2 rounded-lg border border-[var(--accent-primary)]/20">
                    Please select an emotion above to save your entry.
                    </div>
                )}

                <div>
                    <label htmlFor="intensity" className="block text-sm font-medium text-gray-300 mb-2">Intensity: <span className="font-bold text-[var(--accent-primary)]">{intensity}</span></label>
                    <input
                    type="range"
                    id="intensity"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={e => setIntensity(Number(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
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
                    className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-xl p-3 text-gray-200 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition resize-none placeholder-gray-500"
                    ></textarea>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Attached Image</label>
                    {image ? (
                        <div className="relative group">
                        <img src={image} alt="Entry attachment" className="w-full h-auto max-h-48 object-cover rounded-xl border border-[color:var(--glass-border)]" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                            <button 
                            onClick={handleRemoveImage}
                            className="flex items-center bg-red-500/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors backdrop-blur-md"
                            >
                            <IconTrash className="w-4 h-4 mr-2" />
                            Remove Image
                            </button>
                        </div>
                        </div>
                    ) : (
                        <label htmlFor="image-upload" className="cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-[color:var(--glass-border)] rounded-xl hover:bg-white/5 hover:border-[var(--accent-primary)]/50 transition-all group">
                        <IconUpload className="w-8 h-8 text-gray-500 mb-2 group-hover:text-[var(--accent-primary)] transition-colors" />
                        <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">Upload an image</span>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                        <input id="image-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
                        </label>
                    )}
                </div>

                {entry && (
                    <div>
                        <button onClick={handleFetchInsight} disabled={isInsightLoading || !selectedEmotion} className="w-full flex items-center justify-center bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-all shadow-[0_0_15px_var(--chart-glow-color-1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                            <IconSparkles className="w-5 h-5 mr-2" />
                            {isInsightLoading ? 'Generating...' : 'Get AI Insight'}
                        </button>
                        {isInsightLoading && <p className="text-center text-sm text-gray-400 mt-2 animate-pulse">The AI is thinking...</p>}
                        {aiError && <p className="text-center text-sm text-red-400 mt-2">{aiError}</p>}
                        {aiInsight && (
                            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-[color:var(--glass-border)] backdrop-blur-sm">
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{aiInsight}</p>
                            </div>
                        )}
                    </div>
                )}
              </>
          ) : (
              <div className="space-y-6">
                 {/* Daily PNL Input */}
                  <div>
                    <label htmlFor="daily-pnl" className="block text-sm font-medium text-gray-300 mb-2">Daily PNL ($)</label>
                    <input
                      type="number"
                      id="daily-pnl"
                      placeholder="e.g. 150.50 or -50.00"
                      value={pnl}
                      onChange={e => setPnl(e.target.value)}
                      className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-xl p-3 text-white focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition"
                    />
                  </div>

                  {/* Add New Trade Form */}
                  <div className="bg-white/5 p-4 rounded-xl border border-[color:var(--glass-border)]">
                     <h3 className="text-white font-medium mb-3 text-sm">Log New Trade</h3>
                     <div className="grid grid-cols-2 gap-3 mb-3">
                        <select 
                            value={tradeType}
                            onChange={(e) => setTradeType(e.target.value)}
                            className="bg-black/40 border border-[color:var(--glass-border)] rounded-lg p-2 text-sm text-white"
                        >
                            {tradeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input 
                            type="text" 
                            placeholder="Symbol (e.g. NQ, TSLA)"
                            value={tradeSymbol}
                            onChange={e => setTradeSymbol(e.target.value)}
                            className="bg-black/40 border border-[color:var(--glass-border)] rounded-lg p-2 text-sm text-white uppercase"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-3 mb-3">
                         <input 
                            type="number" 
                            placeholder="PNL (Optional)"
                            value={tradePnl}
                            onChange={e => setTradePnl(e.target.value)}
                            className="bg-black/40 border border-[color:var(--glass-border)] rounded-lg p-2 text-sm text-white"
                        />
                        <input 
                            type="text" 
                            placeholder="Notes..."
                            value={tradeNotes}
                            onChange={e => setTradeNotes(e.target.value)}
                            className="bg-black/40 border border-[color:var(--glass-border)] rounded-lg p-2 text-sm text-white"
                        />
                     </div>
                     <button 
                        onClick={handleAddTrade}
                        disabled={!tradeSymbol}
                        className="w-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/50 py-2 rounded-lg text-sm font-medium hover:bg-[var(--accent-primary)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        Add Trade
                     </button>
                  </div>

                  {/* Trades List */}
                  {trades.length > 0 && (
                      <div className="space-y-2">
                          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider">Today's Trades</h3>
                          {trades.map((t) => (
                              <div key={t.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-[color:var(--glass-border)]">
                                  <div>
                                      <div className="flex items-center space-x-2">
                                        <span className={`text-xs px-2 py-0.5 rounded ${
                                            t.type.includes('Long') || t.type.includes('Call') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                        }`}>{t.type}</span>
                                        <span className="font-bold text-white text-sm">{t.symbol}</span>
                                      </div>
                                      {t.notes && <p className="text-gray-400 text-xs mt-1">{t.notes}</p>}
                                  </div>
                                  <div className="flex items-center space-x-3">
                                      {t.pnl !== undefined && (
                                          <span className={`font-mono text-sm ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                              {t.pnl >= 0 ? '+' : ''}{t.pnl}
                                          </span>
                                      )}
                                      <button onClick={() => handleRemoveTrade(t.id)} className="text-gray-500 hover:text-red-400 transition-colors">
                                          <IconTrash className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}
        </div>

        <div className="p-6 bg-white/5 border-t border-[color:var(--glass-border)] flex flex-col gap-4 rounded-b-2xl min-h-[88px] backdrop-blur-md">
            {confirmation ? (
                <div className={`flex items-center justify-center text-[var(--accent-primary)] p-3 transition-all duration-300 ease-out ${confirmation.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{confirmation.message}</span>
                </div>
            ) : (
                <>
                    {operationError && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-sm backdrop-blur-sm">
                            <p className="font-bold mb-1">Operation Failed</p>
                            <p className="text-red-200">{operationError}</p>
                        </div>
                    )}
                    <div className="flex justify-between items-center">
                        <div>
                            {entry && (
                                <button onClick={handleDelete} disabled={isSaving || isDeleting} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {isDeleting ? 'Deleting...' : 'Delete Entry'}
                                </button>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <button onClick={onClose} disabled={isSaving || isDeleting} className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-transparent hover:border-white/10">Cancel</button>
                            <button 
                                onClick={handleSave} 
                                disabled={!selectedEmotion || isSaving || isDeleting}
                                title={!selectedEmotion ? 'Please select an emotion first' : 'Save your journal entry'}
                                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:opacity-90 rounded-xl transition-all shadow-[0_0_15px_var(--chart-glow-color-1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none w-28 text-center"
                            >
                                {isSaving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                                ) : 'Save Entry'}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>

      </div>
    </div>
  );
};

export default EntryModal;