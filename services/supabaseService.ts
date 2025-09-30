

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type EmotionEntry, type UserProfile, type EmotionType } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

export type Database = {
  public: {
    Tables: {
      entries: {
        Row: {
          date: string;
          emotion: string;
          intensity: number;
          notes: string | null;
          user_id: string;
          image_url: string | null;
        };
        Insert: {
          date: string;
          emotion: string;
          intensity: number;
          notes: string | null;
          user_id: string;
          image_url: string | null;
        };
        Update: {
          date?: string;
          emotion?: string;
          intensity?: number;
          notes?: string | null;
          user_id?: string;
          image_url?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string; // This is the user's UUID from auth.users, and the Primary Key
          name: string;
          alias: string;
          picture: string | null;
          updated_at: string | null;
          journal_purpose: string | null;
        };
        Insert: {
          id: string; // Must provide the user's UUID on insert
          name: string;
          alias: string;
          picture: string | null;
          updated_at: string | null;
          journal_purpose: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          alias?: string;
          picture?: string | null;
          updated_at?: string | null;
          journal_purpose?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
};

// --- Client Initialization ---
// IMPORTANT: You must add an 'image_url' column of type 'text' to your 'entries' table in Supabase
// for the image upload feature to work. SQL to run in Supabase SQL Editor:
// ALTER TABLE public.entries ADD COLUMN image_url TEXT;
export const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Helper Functions ---
async function getUserId(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
        throw new Error('User not authenticated. Could not get user ID.');
    }
    return session.user.id;
}

// --- Entry Functions ---

// ====================================================================================
// IMPORTANT: Supabase Schema Requirement for 'entries' table
//
// The `saveEntry` function uses an `upsert` operation with an `onConflict` clause
// on `(user_id, date)`. This requires a UNIQUE constraint on these two columns
// in your `entries` table to work correctly.
//
// If you are seeing an error like "no unique or exclusion constraint matching the
// ON CONFLICT specification", you need to run the following SQL command in your
// Supabase SQL Editor:
//
// ALTER TABLE public.entries
// ADD CONSTRAINT entries_user_id_date_key UNIQUE (user_id, date);
//
// This ensures that each user can only have one journal entry per day, which is
// the intended behavior of the application.
// ====================================================================================
export async function getEntries(): Promise<Record<string, EmotionEntry>> {
    const userId = await getUserId();
    const { data, error } = await supabase.from('entries').select('*').eq('user_id', userId);
    if (error) {
        console.error('Error fetching entries:', error.message);
        throw error;
    }
    const entriesRecord: Record<string, EmotionEntry> = {};
    if (data) {
        for (const entry of data) {
            entriesRecord[entry.date] = {
                date: entry.date,
                emotion: entry.emotion as EmotionType,
                intensity: entry.intensity,
                notes: entry.notes,
                imageUrl: entry.image_url ?? undefined
            };
        }
    }
    return entriesRecord;
}

export async function saveEntry(entry: EmotionEntry): Promise<EmotionEntry> {
    const userId = await getUserId();
    // For a multi-user app, the unique constraint should be on (user_id, date)
    const { data, error } = await supabase
      .from('entries')
      .upsert({
          date: entry.date,
          emotion: entry.emotion,
          intensity: entry.intensity,
          notes: entry.notes,
          image_url: entry.imageUrl ?? null,
          user_id: userId
      }, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) {
        console.error('Error saving entry:', error.message);
        throw error;
    }
    if (!data) {
        throw new Error('Could not save entry, no data returned from Supabase.');
    }
    return {
        date: data.date,
        emotion: data.emotion as EmotionType,
        intensity: data.intensity,
        notes: data.notes,
        imageUrl: data.image_url ?? undefined,
    };
}

export async function deleteEntry(date: string): Promise<void> {
    const userId = await getUserId();
    const { error } = await supabase.from('entries').delete().eq('date', date).eq('user_id', userId);
    if (error) {
        console.error('Error deleting entry:', error.message);
        throw error;
    }
}

// --- Profile Functions ---
export async function getProfile(): Promise<UserProfile> {
    const userId = await getUserId();
    // Query against the 'id' column which should be the user's UUID.
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' means no rows found
         console.error('Error fetching profile:', error.message);
         throw error;
    }
    
    if (data) {
        return {
            name: data.name,
            alias: data.alias,
            picture: data.picture ?? undefined,
            journalPurpose: data.journal_purpose ?? "Click the 'Edit' button in the sidebar to set a purpose!",
        };
    }
    
    // Profile not found, this is likely a new user. Let's create one.
    const { data: { user } } = await supabase.auth.getUser();
    const newUserProfile: UserProfile = {
        name: user?.email?.split('@')[0] || 'New User',
        alias: user?.email || 'No email',
        picture: undefined,
        journalPurpose: "This is my new emotion journal!",
    };
    // The saveProfile function will insert the new profile and return it.
    return saveProfile(newUserProfile);
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
    const userId = await getUserId();
    // Upsert on the 'id' column, which must be the primary key.
    const { data, error } = await supabase.from('profiles').upsert({
        id: userId,
        name: profile.name,
        alias: profile.alias,
        picture: profile.picture ?? null,
        journal_purpose: profile.journalPurpose ?? null,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id' }).select().single();

    if (error) {
        console.error('Error saving profile:', error.message);
        throw error;
    }
    
    if (!data) {
        throw new Error('Supabase did not return the saved profile.');
    }

    return {
        name: data.name,
        alias: data.alias,
        picture: data.picture ?? undefined,
        journalPurpose: data.journal_purpose ?? undefined,
    };
}