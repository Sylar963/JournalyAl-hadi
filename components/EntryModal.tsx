import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type BybitCachedPosition, type BybitCachedTrade, type EmotionEntry, type EmotionType, type TradeDetails } from '../types';
import { EMOTIONS_CONFIG } from '../constants';
import { getEmotionInsight } from '../services/geminiService';
import { isJournalAiEnabled } from '../services/journalAiService';
import { createTradeFingerprint, findDuplicateTrade } from '../services/tradingIndexService';
import { getErrorMessage } from '../utils/errorHelpers';
import { useI18n } from '../hooks/useI18n';
import { TranslationKey } from '../utils/translations';
import IconSparkles from './icons/IconSparkles';
import IconUpload from './icons/IconUpload';
import IconTrash from './icons/IconTrash';
import PayoffChart from './PayoffChart';
import BybitTradePanel from './BybitTradePanel';

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<EmotionEntry, 'date'>) => Promise<void>;
  onDelete: () => Promise<void>;
  selectedDate: Date;
  entry?: EmotionEntry;
  initialEmotion?: EmotionType;
  isBybitAvailable: boolean;
}

const MAX_ATTACHMENT_IMAGE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_ATTACHMENT_IMAGE_TYPES = new Set(['image/png', 'image/jpeg']);

const EntryModal: React.FC<EntryModalProps> = ({ isOpen, onClose, onSave, onDelete, selectedDate, entry, initialEmotion, isBybitAvailable }) => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'journal' | 'trading'>('journal');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType | null>(entry?.emotion ?? initialEmotion ?? null);
  const [intensity, setIntensity] = useState<number>(entry?.intensity ?? 5);
  const [notes, setNotes] = useState<string>(entry?.notes ?? '');
  const [image, setImage] = useState<string | undefined>(entry?.imageUrl);
  
  // Trading Tab State
  const [pnl, setPnl] = useState<string>(entry?.pnl?.toString() ?? '');
  const [trades, setTrades] = useState<TradeDetails[]>(entry?.tradingData?.trades ?? []);
  
  // New Trade Form State
  const [tradeType, setTradeType] = useState<string>('Long Future');
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradePnl, setTradePnl] = useState('');
  const [tradeExecutedAt, setTradeExecutedAt] = useState('');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [tradePrice, setTradePrice] = useState('');
  const [tradeNotes, setTradeNotes] = useState('');
  const [cachedBybitTrades, setCachedBybitTrades] = useState<BybitCachedTrade[]>([]);
  const [cachedBybitPositions, setCachedBybitPositions] = useState<BybitCachedPosition[]>([]);
  const [pnlSource, setPnlSource] = useState<'manual' | 'linked_trades'>(entry?.tradingData?.pnlSource ?? (entry?.pnl !== undefined ? 'manual' : 'linked_trades'));

  const [aiInsight, setAiInsight] = useState<string>('');
  const [isInsightLoading, setIsInsightLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string>('');
  const aiEnabled = isJournalAiEnabled();

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  // kept validation/error state but removed old confirmation toast state
  const [confirmation, setConfirmation] = useState<{ message: string; visible: boolean } | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Sync form state with entry/props
  useEffect(() => {
    setSelectedEmotion(entry?.emotion ?? initialEmotion ?? null);
    setIntensity(entry?.intensity ?? 5);
    setNotes(entry?.notes ?? '');
    setImage(entry?.imageUrl ?? undefined);
    setPnl(entry?.pnl?.toString() ?? '');
    setTrades(entry?.tradingData?.trades ?? []);
    setPnlSource(entry?.tradingData?.pnlSource ?? (entry?.pnl !== undefined ? 'manual' : 'linked_trades'));
  }, [entry, initialEmotion]);

  // Reset UI state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('journal');
      setAiInsight('');
      setAiError('');
      setOperationError(null);
      setIsSaving(false);
      setIsDeleting(false);
      setConfirmation(null);
      setIsSuccess(false);
      setTradeType('Long Future');
      setTradeSymbol('');
      setTradePnl('');
      setTradeExecutedAt('');
      setTradeQuantity('');
      setTradePrice('');
      setTradeNotes('');
      setCachedBybitTrades([]);
      setCachedBybitPositions([]);
    }
  }, [isOpen]);

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
    
    const newTrade: TradeDetails = {
        id: crypto.randomUUID(),
        type: tradeType as TradeDetails['type'],
        symbol: tradeSymbol.toUpperCase(),
        source: 'manual',
        pnl: tradePnl ? parseFloat(tradePnl) : undefined,
        executedAt: tradeExecutedAt ? new Date(tradeExecutedAt).toISOString() : undefined,
        quantity: tradeQuantity ? parseFloat(tradeQuantity) : undefined,
        contracts: tradeQuantity ? parseFloat(tradeQuantity) : undefined,
        price: tradePrice ? parseFloat(tradePrice) : undefined,
        side: tradeType.includes('Short') || tradeType.includes('Put') || tradeType.includes('STO') || tradeType.includes('BTC') ? 'Sell' : 'Buy',
        notes: tradeNotes
    };
    newTrade.tradeFingerprint = createTradeFingerprint(newTrade);

    const duplicateTrade = findDuplicateTrade(newTrade, trades);
    const duplicateCachedBybitTrade = cachedBybitTrades.find((trade) => trade.tradeFingerprint === newTrade.tradeFingerprint);

    if (duplicateTrade || duplicateCachedBybitTrade) {
      setOperationError(duplicateCachedBybitTrade
        ? t('bybit.error.manual_duplicate')
        : t('bybit.error.duplicate_link'));
      return;
    }
    
    setTrades([...trades, newTrade]);
    setOperationError(null);
    
    // Reset form
    setTradeSymbol('');
    setTradePnl('');
    setTradeExecutedAt('');
    setTradeQuantity('');
    setTradePrice('');
    setTradeNotes('');
  };

  const handleRemoveTrade = (id: string) => {
    setTrades(trades.filter(t => t.id !== id));
  };

  const handleAddImportedTrade = (trade: TradeDetails) => {
    setTrades((currentTrades) => [...currentTrades, trade]);
    if (pnlSource !== 'manual') {
      setPnlSource('linked_trades');
    }
  };

  const handlePnlInputChange = (value: string) => {
    setPnl(value);
    setPnlSource('manual');
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
          tradingData: { trades, pnlSource }
      });
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      let displayMessage = 'An unexpected error occurred. Please try again.';
      if (message.includes('ON CONFLICT')) {
        displayMessage = 'Database Schema Error: A unique constraint is missing on the `entries` table for `(user_id, date)`. Please follow the setup instructions in `services/supabaseService.ts` to fix this.';
      } else {
        displayMessage = `Error: ${message}`;
      }
      setOperationError(displayMessage);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setOperationError(null);
    try {
        await onDelete();
        showConfirmation(t('modal.entry.delete'));
    } catch (err: unknown) {
        const message = getErrorMessage(err);
        setOperationError(message || 'Failed to delete entry.');
        setIsDeleting(false);
    }
  };

  const readAttachmentImage = useCallback((file: File) => {
    if (!ACCEPTED_ATTACHMENT_IMAGE_TYPES.has(file.type)) {
      alert(t('modal.entry.image_invalid'));
      return;
    }

    if (file.size > MAX_ATTACHMENT_IMAGE_BYTES) {
      alert(t('modal.entry.image_too_large'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, [t]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    readAttachmentImage(file);
    event.target.value = '';
  };

  const handleImagePaste = useCallback((event: React.ClipboardEvent<HTMLDivElement>) => {
    if (activeTab !== 'journal') return;

    const imageItem = Array.from(event.clipboardData.items).find((item) =>
      item.kind === 'file' && item.type.startsWith('image/')
    );
    const file = imageItem?.getAsFile();

    if (!file) return;

    event.preventDefault();
    readAttachmentImage(file);
  }, [activeTab, readAttachmentImage]);

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
           setAiError(getErrorMessage(error) || 'Failed to get insight. Please try again.');
       } finally {
           setIsInsightLoading(false);
       }
   }, [entry, selectedEmotion, intensity, notes, image]);

  const selectedDateKey = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
  const todayKey = `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}`;
  const isTodayEntry = selectedDateKey === todayKey;

  useEffect(() => {
    if (pnlSource === 'manual') return;

    const linkedTrades = trades.filter((trade) => trade.source === 'bybit');
    const totalLinkedPnl = linkedTrades.reduce((sum, trade) => {
      const pnlValue = trade.closedPnl ?? trade.pnl;
      return typeof pnlValue === 'number' ? sum + pnlValue : sum;
    }, 0);

    const hasLinkedPnl = linkedTrades.some((trade) => typeof (trade.closedPnl ?? trade.pnl) === 'number');
    setPnl(hasLinkedPnl ? totalLinkedPnl.toFixed(2) : '0');
  }, [pnlSource, trades]);

  const payoffPreviewTrade = useMemo(() => {
    const previewCandidates = [...trades].reverse();
    const selectedPreviewTrade = previewCandidates.find((trade) =>
      (trade.type === 'Long Future' || trade.type === 'Short Future')
      && (trade.entryPrice !== undefined || trade.price !== undefined)
      && (
        trade.markPrice !== undefined
        || trade.liquidationPrice !== undefined
        || trade.unrealizedPnl !== undefined
        || (trade.source === 'bybit' && trade.status === 'open')
      )
    ) ?? null;

    if (!selectedPreviewTrade || selectedPreviewTrade.source !== 'bybit') {
      return selectedPreviewTrade;
    }

    const matchingPosition = cachedBybitPositions.find((position) =>
      position.externalPositionId === selectedPreviewTrade.externalTradeId
      || (
        position.symbol === selectedPreviewTrade.symbol
        && position.side === selectedPreviewTrade.side
        && position.status === 'open'
      )
    );

    if (!matchingPosition) {
      return selectedPreviewTrade;
    }

    return {
      ...selectedPreviewTrade,
      entryPrice: matchingPosition.entryPrice ?? selectedPreviewTrade.entryPrice ?? selectedPreviewTrade.price,
      price: matchingPosition.entryPrice ?? selectedPreviewTrade.price,
      quantity: matchingPosition.quantity ?? selectedPreviewTrade.quantity,
      contracts: matchingPosition.quantity ?? selectedPreviewTrade.contracts,
      status: matchingPosition.status,
      executedAt: matchingPosition.updatedAt ?? selectedPreviewTrade.executedAt,
      externalTradeId: matchingPosition.externalPositionId,
      orderId: matchingPosition.externalPositionId,
      markPrice: matchingPosition.markPrice,
      unrealizedPnl: matchingPosition.unrealizedPnl,
      liquidationPrice: matchingPosition.liquidationPrice,
      leverage: matchingPosition.leverage,
      positionValue: matchingPosition.positionValue,
      marginMode: matchingPosition.marginMode,
    } satisfies TradeDetails;
  }, [cachedBybitPositions, trades]);

  const payoffChartType = payoffPreviewTrade?.type ?? tradeType;

  if (!isOpen) return null;
  
  const emotionKeys = Object.keys(EMOTIONS_CONFIG) as EmotionType[];
  const tradeTypes = ['Long Future', 'Short Future', 'BTO Call', 'BTO Put', 'STC Call', 'STC Put', 'STO Call', 'STO Put', 'BTC Call', 'BTC Put'];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div 
        ref={modalRef} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="entry-modal-title"
        onPaste={handleImagePaste}
        className="journal-panel rounded-2xl shadow-2xl w-full max-w-4xl animate-scale-in flex flex-col max-h-[92vh] overflow-hidden">
        
        <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col h-full overflow-hidden"
          >
            <div className="flex items-center px-4 pt-4 border-b journal-divider bg-[var(--surface-1)] rounded-t-2xl space-x-2">
                <button
                    onClick={() => setActiveTab('journal')}
                    data-active={activeTab === 'journal'}
                    className="journal-tab px-6 py-2 rounded-t-lg text-sm font-medium transition-all relative"
                >
                    {t('modal.entry.tab_journal')}
                    {activeTab === 'journal' && <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-[var(--surface-3)] z-10"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('trading')}
                    data-active={activeTab === 'trading'}
                    className="journal-tab px-6 py-2 rounded-t-lg text-sm font-medium transition-all relative"
                >
                    {t('modal.entry.tab_trading')}
                    {activeTab === 'trading' && <div className="absolute bottom-[-1px] left-0 right-0 h-[1px] bg-[var(--surface-3)] z-10"></div>}
                </button>
                
                <div className="ml-auto">
                    <button onClick={onClose} disabled={isSaving || isDeleting} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors text-xl leading-none disabled:opacity-50 p-1">&times;</button>
                </div>
            </div>
    
            <div className="p-6 border-b journal-divider bg-[var(--surface-1)]">
              <div className="flex justify-between items-start">
                <div>
                    <p className="journal-kicker">Daily Review</p>
                    <h2 id="entry-modal-title" className="text-xl font-semibold text-[var(--text-main)] mt-1">
                        {activeTab === 'journal' ? t('modal.entry.title_journal') : t('modal.entry.title_trading')}
                    </h2>
                    <p className="text-[var(--text-muted)] text-sm journal-metric">
                      {selectedDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
              </div>
            </div>
    
            <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {activeTab === 'journal' ? (
                  <>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('modal.entry.emotion_label')}</label>
                        <div className="grid grid-cols-5 gap-3">
                        {emotionKeys.map(key => {
                            const config = EMOTIONS_CONFIG[key];
                            const isSelected = selectedEmotion === key;
                            return (
                                <button
                                key={key}
                                onClick={() => setSelectedEmotion(key)}
                                className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
                                    isSelected 
                                        ? 'border-[var(--panel-border-strong)] bg-[var(--surface-3)] scale-[1.02]'
                                        : 'border-[var(--panel-border)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]'
                                }`}
                                >
                                <span className="text-3xl">{config.emoji}</span>
                                <span className={`mt-1 text-xs font-medium ${isSelected ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                                  {t(`emotion.${key}` as TranslationKey)}
                                </span>
                                </button>
                            )
                        })}
                        </div>
                    </div>
                    
                    {!selectedEmotion && (
                        <div className="text-center text-sm text-[var(--text-main)] bg-[var(--surface-3)] p-2 rounded-lg border border-[var(--panel-border-strong)]">
                           {language === 'es' ? 'Por favor selecciona un sentimiento arriba para guardar tu entrada.' : 'Please select an emotion above to save your entry.'}
                        </div>
                    )}
    
                    <div>
                        <label htmlFor="intensity" className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('modal.entry.intensity_label')}: <span className="font-bold text-[var(--text-main)] journal-metric">{intensity}</span></label>
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
                        <label htmlFor="notes" className="block text-sm font-medium text-[var(--text-muted)] mb-2">{t('modal.entry.notes_label')}</label>
                        <textarea
                        id="notes"
                        rows={4}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder={t('modal.entry.notes_placeholder')}
                        className="journal-input w-full rounded-xl p-3 transition resize-none"
                        ></textarea>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">Attached Image</label>
                        {image ? (
                            <div className="relative group">
                            <img src={image} alt="Entry attachment" className="w-full h-auto max-h-48 object-cover rounded-xl border border-[var(--panel-border)]" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl backdrop-blur-sm">
                                <button 
                                onClick={handleRemoveImage}
                                className="journal-button-danger flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                >
                                <IconTrash className="w-4 h-4 mr-2" />
                                {t('modal.entry.remove_image')}
                                </button>
                            </div>
                            </div>
                        ) : (
                            <label htmlFor="image-upload" className="cursor-pointer w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-[var(--panel-border)] rounded-xl hover:bg-[var(--surface-2)] hover:border-[var(--panel-border-strong)] transition-all group">
                            <IconUpload className="w-8 h-8 text-[var(--text-subtle)] mb-2 group-hover:text-[var(--text-main)] transition-colors" />
                            <span className="text-sm font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">{t('modal.entry.upload_image')}</span>
                            <p className="text-xs text-[var(--text-subtle)] mt-1">{t('modal.entry.image_hint')}</p>
                            <input id="image-upload" type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleImageUpload} />
                            </label>
                        )}
                    </div>
    
                    {entry && (
                        <div>
                            <button onClick={handleFetchInsight} disabled={!aiEnabled || isInsightLoading || !selectedEmotion} className="journal-button-primary w-full flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
                                <IconSparkles className="w-5 h-5 mr-2" />
                                {isInsightLoading ? t('modal.entry.generating') : t('modal.entry.get_insight')}
                            </button>
                            {!aiEnabled && <p className="text-center text-sm text-[var(--text-subtle)] mt-2">AI insights require Supabase-backed mode.</p>}
                            {isInsightLoading && <p className="text-center text-sm text-[var(--text-muted)] mt-2 animate-pulse">{t('modal.entry.ai_thinking')}</p>}
                            {aiError && <p className="text-center text-sm text-red-400 mt-2">{aiError}</p>}
                            {aiInsight && (
                                <div className="mt-4 p-4 journal-panel-muted rounded-xl">
                                    <p className="text-sm text-[var(--text-main)] whitespace-pre-wrap leading-relaxed">{aiInsight}</p>
                                </div>
                            )}
                        </div>
                    )}
                  </>
              ) : (
                  <div className="space-y-6 xl:grid xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.9fr)] xl:items-start xl:gap-6 xl:space-y-0">
                     <div className="space-y-6">
                      <BybitTradePanel
                        date={selectedDateKey}
                        isToday={isTodayEntry}
                        isBybitAvailable={isBybitAvailable}
                        selectedTrades={trades}
                        onSelectTrade={handleAddImportedTrade}
                        onCacheChange={setCachedBybitTrades}
                        onPositionCacheChange={setCachedBybitPositions}
                        onError={setOperationError}
                     />

                       <div>
                         <div className="flex items-center justify-between gap-3 mb-2">
                          <label htmlFor="daily-pnl" className="block text-sm font-medium text-[var(--text-muted)]">{t('modal.entry.daily_pnl')}</label>
                          <span className={`text-[11px] uppercase tracking-wide px-2 py-1 rounded-full journal-metric ${pnlSource === 'manual' ? 'bg-[var(--surface-3)] text-[var(--text-muted)]' : 'bg-green-500/10 text-green-300'}`}>
                             {pnlSource === 'manual' ? t('modal.entry.pnl_source_manual') : t('modal.entry.pnl_source_linked')}
                          </span>
                        </div>
                        <input
                          type="number"
                          id="daily-pnl"
                          placeholder="e.g. 150.50 or -50.00"
                          value={pnl}
                          onChange={e => handlePnlInputChange(e.target.value)}
                          className="journal-input w-full rounded-xl p-3 transition journal-metric"
                        />
                       </div>

                       <AnimatePresence mode="wait">
                         <PayoffChart
                          key={payoffPreviewTrade ? `${payoffPreviewTrade.id}-${payoffPreviewTrade.markPrice ?? 'na'}-${payoffPreviewTrade.liquidationPrice ?? 'na'}` : tradeType}
                          type={payoffChartType}
                          trade={payoffPreviewTrade}
                        />
                      </AnimatePresence>
                     </div>

                     <div className="space-y-6">
                      <div className="journal-panel-muted p-4 rounded-xl">
                         <p className="journal-kicker mb-2">Manual Capture</p>
                         <h3 className="text-[var(--text-main)] font-medium mb-3 text-sm">{t('modal.entry.log_new_trade')}</h3>
                         <div className="grid grid-cols-2 gap-3 mb-3">
                            <select 
                                value={tradeType}
                                onChange={(e) => setTradeType(e.target.value)}
                                className="journal-input rounded-lg p-2 text-sm"
                            >
                                {tradeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <input 
                                type="text" 
                                placeholder={t('modal.entry.symbol_placeholder')}
                                value={tradeSymbol}
                                onChange={e => setTradeSymbol(e.target.value)}
                                className="journal-input rounded-lg p-2 text-sm uppercase"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-3 mb-3">
                             <input 
                                type="number" 
                                placeholder={t('modal.entry.pnl_placeholder')}
                                value={tradePnl}
                                onChange={e => setTradePnl(e.target.value)}
                                className="journal-input rounded-lg p-2 text-sm journal-metric"
                            />
                            <input
                                type="datetime-local"
                                value={tradeExecutedAt}
                                onChange={e => setTradeExecutedAt(e.target.value)}
                                className="journal-input rounded-lg p-2 text-sm journal-metric"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                                type="number"
                                placeholder={t('modal.entry.quantity_placeholder')}
                                value={tradeQuantity}
                                onChange={e => setTradeQuantity(e.target.value)}
                                className="journal-input rounded-lg p-2 text-sm journal-metric"
                            />
                            <input
                                type="number"
                                placeholder={t('modal.entry.price_placeholder')}
                                value={tradePrice}
                                onChange={e => setTradePrice(e.target.value)}
                                className="journal-input rounded-lg p-2 text-sm journal-metric"
                            />
                         </div>
                         <div className="grid grid-cols-1 gap-3 mb-3">
                            <input 
                                type="text" 
                                placeholder={t('modal.entry.notes_trade_placeholder')}
                                value={tradeNotes}
                                onChange={e => setTradeNotes(e.target.value)}
                                className="journal-input rounded-lg p-2 text-sm"
                            />
                         </div>
                         <button 
                             onClick={handleAddTrade}
                             disabled={!tradeSymbol}
                             className="journal-button-secondary w-full py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                             {t('modal.entry.add_trade')}
                          </button>
                       </div>

                       {trades.length > 0 && (
                           <div className="space-y-2">
                               <p className="journal-kicker">Linked Trade Ledger</p>
                               <h3 className="text-[var(--text-main)] text-sm font-semibold">{t('modal.entry.todays_trades')}</h3>
                               {trades.map((t) => (
                                   <div key={t.id} className="flex items-center justify-between journal-panel-muted p-3 rounded-xl gap-4">
                                        <div>
                                            <div className="flex items-center space-x-2">
                                              <span className={`text-xs px-2 py-0.5 rounded ${
                                                  t.type.includes('Long') || t.type.includes('Call') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                                              }`}>{t.type}</span>
                                              <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide ${t.source === 'bybit' ? 'bg-blue-500/20 text-blue-300' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'}`}>
                                                  {t.source === 'bybit' ? 'Bybit' : 'Manual'}
                                              </span>
                                              {t.status && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide ${t.status === 'open' ? 'bg-cyan-500/20 text-cyan-200' : t.status === 'closed' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'}`}>
                                                  {t.status}
                                                </span>
                                              )}
                                              <span className="font-semibold text-[var(--text-main)] text-sm journal-metric">{t.symbol}</span>
                                            </div>
                                            {t.executedAt && <p className="text-[var(--text-subtle)] text-[11px] mt-1 journal-metric">{new Date(t.executedAt).toLocaleString()}</p>}
                                            {(t.markPrice !== undefined || t.liquidationPrice !== undefined || t.unrealizedPnl !== undefined) && (
                                              <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-[var(--text-muted)]">
                                                {t.markPrice !== undefined && (
                                                  <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-cyan-100 journal-metric">Mark {t.markPrice.toFixed(4)}</span>
                                                )}
                                                {t.liquidationPrice !== undefined && (
                                                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-200 journal-metric">Liq {t.liquidationPrice.toFixed(4)}</span>
                                                )}
                                                {t.unrealizedPnl !== undefined && (
                                                  <span className={`rounded-full px-2 py-0.5 journal-metric ${t.unrealizedPnl >= 0 ? 'bg-emerald-500/10 text-emerald-200' : 'bg-red-500/10 text-red-200'}`}>
                                                    UPNL {t.unrealizedPnl >= 0 ? '+' : ''}{t.unrealizedPnl.toFixed(2)}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                            {t.notes && <p className="text-[var(--text-muted)] text-xs mt-1">{t.notes}</p>}
                                        </div>
                                       <div className="flex items-center space-x-3">
                                           {(t.closedPnl !== undefined || t.pnl !== undefined) && (
                                               <span className={`font-mono text-sm ${(t.closedPnl ?? t.pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                   {(t.closedPnl ?? t.pnl ?? 0) >= 0 ? '+' : ''}{(t.closedPnl ?? t.pnl)?.toFixed?.(2) ?? (t.closedPnl ?? t.pnl)}
                                               </span>
                                           )}
                                           <button onClick={() => handleRemoveTrade(t.id)} className="text-[var(--text-subtle)] hover:text-red-400 transition-colors">
                                               <IconTrash className="w-4 h-4" />
                                           </button>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       )}
                      </div>
                  </div>
              )}
            </div>
    
            <div className="p-6 bg-[var(--surface-1)] border-t journal-divider flex flex-col gap-4 rounded-b-2xl min-h-[88px] backdrop-blur-md">
                {confirmation ? (
                    <div className={`flex items-center justify-center text-[var(--text-main)] p-3 transition-all duration-300 ease-out ${confirmation.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{confirmation.message}</span>
                    </div>
                ) : (
                    <>
                        {operationError && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3 rounded-xl text-sm backdrop-blur-sm">
                                <p className="font-bold mb-1">{t('common.operation_failed')}</p>
                                <p className="text-red-200">{operationError}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <div>
                                {entry && (
                                    <button onClick={handleDelete} disabled={isSaving || isDeleting} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isDeleting ? t('modal.entry.deleting') : t('modal.entry.delete')}
                                    </button>
                                )}
                            </div>
                            <div className="flex space-x-3">
                                <button onClick={onClose} disabled={isSaving || isDeleting} className="journal-button-secondary px-4 py-2 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t('common.cancel')}</button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={!selectedEmotion || isSaving || isDeleting}
                                    title={!selectedEmotion ? 'Please select an emotion first' : 'Save your journal entry'}
                                    className="journal-button-primary px-4 py-2 text-sm font-medium hover:opacity-95 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none w-28 text-center"
                                >
                                    {isSaving ? (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mx-auto"></div>
                                    ) : t('modal.entry.save')}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8"
          >
             <div className="mb-6 relative">
                 <div className="absolute inset-0 bg-[var(--accent-soft)] blur-xl rounded-full animate-pulse"></div>
                 <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 150, delay: 0.1 }}
                 >
                    <svg className="w-24 h-24 text-[var(--accent-primary)] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <motion.path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M9 12l2 2 4-4" 
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: "easeInOut" }}
                        />
                        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" className="opacity-20" />
                    </svg>
                 </motion.div>
             </div>
             
             <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-semibold text-[var(--text-main)] mb-2"
             >
                 {t('modal.entry.success_title')}
             </motion.h3>
             
             <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[var(--text-muted)] text-sm"
              >
                 {t('modal.entry.success_subtitle')}
             </motion.p>
          </motion.div>
        )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default EntryModal;
