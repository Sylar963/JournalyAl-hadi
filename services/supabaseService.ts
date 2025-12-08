
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type EmotionEntry, type UserProfile, type EmotionType, type Quest } from '../types';
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
          pnl: number | null;
          trading_data: any | null;
        };
        Insert: {
          date: string;
          emotion: string;
          intensity: number;
          notes: string | null;
          user_id: string;
          image_url: string | null;
          pnl?: number | null;
          trading_data?: any | null;
        };
        Update: {
          date?: string;
          emotion?: string;
          intensity?: number;
          notes?: string | null;
          user_id?: string;
          image_url?: string | null;
          pnl?: number | null;
          trading_data?: any | null; // using any for jsonb flexibility, or could type it purely
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string; 
          name: string;
          alias: string;
          picture: string | null;
          updated_at: string | null;
          journal_purpose: string | null;
        };
        Insert: {
          id: string; 
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
      quests: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      }
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
    CompositeTypes: { [key: string]: never };
  };
};

// --- Client Initialization ---
// The supabase client is initialized only if the required environment variables are present.
// This prevents a crash on module load if the app is intended to run in local-only mode.
export const supabase: SupabaseClient<Database> | null =
    (SUPABASE_URL && SUPABASE_ANON_KEY)
        ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

// ====================================================================================
// SQL SETUP INSTRUCTIONS FOR SUPABASE
// Run the following SQL commands in your Supabase Project's SQL Editor
// to create the necessary tables and policies for the application to function.
// ====================================================================================

export const PROFILES_TABLE_SETUP_SQL = `
-- 1. Create the table for user profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  alias TEXT,
  picture TEXT,
  journal_purpose TEXT,
  updated_at TIMESTAMPTZ
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for profiles
CREATE POLICY "Users can manage their own profile"
ON public.profiles FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
`;

export const ENTRIES_TABLE_SETUP_SQL = `
-- 1. Create the table for journal entries
CREATE TABLE public.entries (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  emotion TEXT NOT NULL,
  intensity INT NOT NULL CHECK (intensity >= 1 AND intensity <= 10),
  notes TEXT,
  image_url TEXT,
  pnl NUMERIC,
  trading_data JSONB,
  PRIMARY KEY (user_id, date) -- Ensures one entry per user per day and is used for upsert
);

-- 2. Enable Row Level Security
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for entries
CREATE POLICY "Users can manage their own entries"
ON public.entries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`;

export const QUESTS_TABLE_SETUP_SQL = `
-- 1. Create the table for quests
CREATE TABLE public.quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for RLS
CREATE POLICY "Users can manage their own quests"
ON public.quests FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`;

const clientNotConfiguredError = 'Supabase client is not initialized. Check your environment variables.';

// --- Helper Functions ---
async function getUserId(): Promise<string> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
        throw new Error('User not authenticated. Could not get user ID.');
    }
    return session.user.id;
}

// --- Entry Functions ---
export async function getEntries(): Promise<Record<string, EmotionEntry>> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
    const { data, error } = await supabase.from('entries').select('*').eq('user_id', userId);
    if (error) {
        console.error('Error fetching entries:', error.message);
        throw error;
    }
    const entriesRecord: Record<string, EmotionEntry> = {};
    if (data) {
        for (const entry of data) {
            // FIX: Cast entry to the correct type to resolve TS inference error.
            const e = entry as Database['public']['Tables']['entries']['Row'];
            entriesRecord[e.date] = {
                date: e.date,
                emotion: e.emotion as EmotionType,
                intensity: e.intensity,
                notes: e.notes,
                imageUrl: e.image_url ?? undefined,
                pnl: e.pnl ?? undefined,
                tradingData: e.trading_data || undefined
            };
        }
    }
    return entriesRecord;
}

export async function saveEntry(entry: EmotionEntry): Promise<EmotionEntry> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('entries')
      .upsert({
          date: entry.date,
          emotion: entry.emotion,
          intensity: entry.intensity,
          notes: entry.notes,
          image_url: entry.imageUrl ?? null,
          user_id: userId,
          pnl: entry.pnl ?? null,
          trading_data: entry.tradingData ?? null
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
    // FIX: Cast data to the correct type to resolve TS inference error.
    const savedData = data as Database['public']['Tables']['entries']['Row'];
    return {
        date: savedData.date,
        emotion: savedData.emotion as EmotionType,
        intensity: savedData.intensity,
        notes: savedData.notes,
        imageUrl: savedData.image_url ?? undefined,
        pnl: savedData.pnl ?? undefined,
        tradingData: savedData.trading_data || undefined
    };
}

export async function deleteEntry(date: string): Promise<void> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
    const { error } = await supabase.from('entries').delete().eq('date', date).eq('user_id', userId);
    if (error) {
        console.error('Error deleting entry:', error.message);
        throw error;
    }
}

// --- Profile Functions ---
export async function getProfile(): Promise<UserProfile> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error && error.code !== 'PGRST116') { // 'PGRST116' means no rows found
         console.error('Error fetching profile:', error.message);
         throw error;
    }
    
    if (data) {
        // FIX: Cast data to the correct type to resolve TS inference error.
        const profileData = data as Database['public']['Tables']['profiles']['Row'];
        return {
            name: profileData.name,
            alias: profileData.alias,
            picture: profileData.picture ?? undefined,
            journalPurpose: profileData.journal_purpose ?? "Click the 'Edit' button in the sidebar to set a purpose!",
        };
    }
    
    const { data: { user } } = await supabase.auth.getUser();
    const newUserProfile: UserProfile = {
        name: user?.email?.split('@')[0] || 'New User',
        alias: user?.email || 'No email',
        picture: undefined,
        journalPurpose: "This is my new emotion journal!",
    };
    return saveProfile(newUserProfile);
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
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
    // FIX: Cast data to the correct type to resolve TS inference error.
    const savedData = data as Database['public']['Tables']['profiles']['Row'];

    return {
        name: savedData.name,
        alias: savedData.alias,
        picture: savedData.picture ?? undefined,
        journalPurpose: savedData.journal_purpose ?? undefined,
    };
}

// --- Quest Functions ---
export async function getQuests(): Promise<Quest[]> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
    const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    
    if (error) {
        console.error('Error fetching quests:', error.message);
        throw error;
    }
    // FIX: Handle null data case.
    if (!data) {
        return [];
    }
    // FIX: Explicitly map from DB row type to Quest interface to fix type errors.
    return (data as Database['public']['Tables']['quests']['Row'][]).map(q => ({
        id: q.id,
        text: q.text,
        completed: q.completed,
        createdAt: q.created_at
    }));
}

export async function addQuest(text: string): Promise<Quest> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
    const { data, error } = await supabase
        .from('quests')
        .insert({ text, user_id: userId })
        .select()
        .single();
    
    if (error) {
        console.error('Error adding quest:', error.message);
        throw error;
    }
    // FIX: Add null check for data.
    if (!data) {
        throw new Error('Could not add quest, no data returned from Supabase.');
    }
    // FIX: Explicitly map from DB row type to Quest interface to fix type errors.
    const questRow = data as Database['public']['Tables']['quests']['Row'];
    return { 
        id: questRow.id,
        text: questRow.text,
        completed: questRow.completed,
        createdAt: questRow.created_at 
    };
}

export async function updateQuestStatus(id: string, completed: boolean): Promise<Quest> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
    const { data, error } = await supabase
        .from('quests')
        .update({ completed })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating quest:', error.message);
        throw error;
    }
    // FIX: Add null check for data.
    if (!data) {
        throw new Error('Could not update quest, no data returned from Supabase.');
    }
    // FIX: Explicitly map from DB row type to Quest interface to fix type errors.
    const questRow = data as Database['public']['Tables']['quests']['Row'];
    return {
        id: questRow.id,
        text: questRow.text,
        completed: questRow.completed,
        createdAt: questRow.created_at
    };
}

export async function deleteQuest(id: string): Promise<void> {
    if (!supabase) throw new Error(clientNotConfiguredError);
    const userId = await getUserId();
    const { error } = await supabase
        .from('quests')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    
    if (error) {
        console.error('Error deleting quest:', error.message);
        throw error;
    }
}
