import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

import * as supabaseService from './supabaseService';
import * as localDataService from './localDataService';
import { EmotionEntry, UserProfile } from '../types';

// These are the placeholder values from a fresh clone of the app.
const PLACEHOLDER_URL = 'YOUR_SUPABASE_URL';
const PLACEHOLDER_KEY = 'YOUR_SUPABASE_ANON_KEY';

const isSupabaseConfigured = (SUPABASE_URL as string) !== PLACEHOLDER_URL && SUPABASE_URL && (SUPABASE_ANON_KEY as string) !== PLACEHOLDER_KEY && SUPABASE_ANON_KEY;

// Define the interface for our data service to ensure both modules conform
interface DataService {
    getEntries(): Promise<Record<string, EmotionEntry>>;
    saveEntry(entry: EmotionEntry): Promise<EmotionEntry>;
    deleteEntry(date: string): Promise<void>;
    getProfile(): Promise<UserProfile>;
    saveProfile(profile: UserProfile): Promise<UserProfile>;
}

// Conditionally select the service to use
const service: DataService = isSupabaseConfigured ? supabaseService : localDataService;

// Export the functions from the selected service
export const getEntries = service.getEntries;
export const saveEntry = service.saveEntry;
export const deleteEntry = service.deleteEntry;
export const getProfile = service.getProfile;
export const saveProfile = service.saveProfile;

// Also export a flag that the UI can use to understand the current persistence mode.
export const isUsingSupabase = isSupabaseConfigured;