import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

import * as supabaseService from './supabaseService';
import * as localDataService from './localDataService';
import { EmotionEntry, UserProfile, Quest } from '../types';

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


// Also export a flag that the UI can use to understand the current persistence mode.
export const isUsingSupabase = isSupabaseConfigured;