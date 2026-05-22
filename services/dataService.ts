import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

import * as supabaseService from './supabaseService';
import * as localDataService from './localDataService';
import { AppDataSnapshot, BybitConnection, BybitCredentialInput, BybitTradeCacheResult, EmotionEntry, UserProfile, Quest, PerformanceReview, ThalexConnection, ThalexCredentialInput, ThalexTradeCacheResult } from '../types';

// Check if the environment variables for Supabase are provided.
const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY);


// Define the interface for our data service to ensure both modules conform
interface DataService {
    // Entries
    getEntries(): Promise<Record<string, EmotionEntry>>;
    saveEntry(entry: EmotionEntry): Promise<EmotionEntry>;
    deleteEntry(date: string): Promise<void>;
    // Profile
    getProfile(): Promise<UserProfile>;
    saveProfile(profile: UserProfile): Promise<UserProfile>;
    // Quests
    getQuests(): Promise<Quest[]>;
    addQuest(text: string): Promise<Quest>;
    updateQuestStatus(id: string, completed: boolean): Promise<Quest>;
    deleteQuest(id: string): Promise<void>;
    // Leads
    addLead(email: string): Promise<void>;
    // Reviews
    getReviews(): Promise<PerformanceReview[]>;
    getReview(year: number): Promise<PerformanceReview | null>;
    saveReview(review: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceReview>;
    deleteReview(year: number): Promise<void>;
    exportUserData(): Promise<AppDataSnapshot>;
    importUserData(data: AppDataSnapshot): Promise<void>;
    deleteCurrentAccount(): Promise<void>;
    // Bybit
    getBybitConnection(): Promise<BybitConnection | null>;
    saveBybitConnection(input: BybitCredentialInput): Promise<BybitConnection>;
    validateBybitConnection(input: BybitCredentialInput): Promise<BybitConnection>;
    deleteBybitConnection(): Promise<void>;
    getCachedBybitTradesForDate(date: string): Promise<BybitTradeCacheResult>;
    refreshBybitTradesForDate(date: string, timezone: string): Promise<BybitTradeCacheResult>;
    bulkRefreshBybitTrades(startDate: string, endDate: string, timezone: string): Promise<{ date: string; result: BybitTradeCacheResult }[]>;
    bulkCreateEntriesWithTrades(startDate: string, endDate: string, timezone: string): Promise<{ date: string; tradesCount: number; pnl: number; created: boolean }[]>;
    // Thalex
    getThalexConnection(): Promise<ThalexConnection | null>;
    saveThalexConnection(input: ThalexCredentialInput): Promise<ThalexConnection>;
    validateThalexConnection(input: ThalexCredentialInput): Promise<ThalexConnection>;
    deleteThalexConnection(): Promise<void>;
    getCachedThalexTradesForDate(date: string): Promise<ThalexTradeCacheResult>;
    refreshThalexTradesForDate(date: string, timezone: string): Promise<ThalexTradeCacheResult>;
}

// Conditionally select the service to use
const service: DataService = isSupabaseConfigured ? supabaseService : localDataService;

// Export the functions from the selected service
export const getEntries = service.getEntries;
export const saveEntry = service.saveEntry;
export const deleteEntry = service.deleteEntry;
export const getProfile = service.getProfile;
export const saveProfile = service.saveProfile;
export const getQuests = service.getQuests;
export const addQuest = service.addQuest;
export const updateQuestStatus = service.updateQuestStatus;
export const deleteQuest = service.deleteQuest;
export const addLead = service.addLead;
export const getReviews = service.getReviews;
export const getReview = service.getReview;
export const saveReview = service.saveReview;
export const deleteReview = service.deleteReview;
export const exportUserData = service.exportUserData;
export const importUserData = service.importUserData;
export const deleteCurrentAccount = service.deleteCurrentAccount;
export const getBybitConnection = service.getBybitConnection;
export const saveBybitConnection = service.saveBybitConnection;
export const validateBybitConnection = service.validateBybitConnection;
export const deleteBybitConnection = service.deleteBybitConnection;
export const getCachedBybitTradesForDate = service.getCachedBybitTradesForDate;
export const refreshBybitTradesForDate = service.refreshBybitTradesForDate;
export const bulkRefreshBybitTrades = service.bulkRefreshBybitTrades;
export const bulkCreateEntriesWithTrades = service.bulkCreateEntriesWithTrades;
export const getThalexConnection = service.getThalexConnection;
export const saveThalexConnection = service.saveThalexConnection;
export const validateThalexConnection = service.validateThalexConnection;
export const deleteThalexConnection = service.deleteThalexConnection;
export const getCachedThalexTradesForDate = service.getCachedThalexTradesForDate;
export const refreshThalexTradesForDate = service.refreshThalexTradesForDate;


// Also export a flag that the UI can use to understand the current persistence mode.
export const isUsingSupabase = isSupabaseConfigured;
