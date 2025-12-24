import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { type EmotionEntry, type UserProfile, type EmotionType, type Quest, type TradeDetails } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';
import { getErrorMessage } from '../utils/errorHelpers';

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
          trading_data: { trades: TradeDetails[] } | null;
        };
        Update: {
          date?: string;
          emotion?: string;
          intensity?: number;
          notes?: string | null;
          user_id?: string;
          image_url?: string | null;
          pnl?: number | null;
          trading_data?: { trades: TradeDetails[] } | null;
        };
        Insert: {
          date: string;
          emotion: string;
          intensity: number;
          notes?: string | null;
          user_id: string;
          image_url?: string | null;
          pnl?: number | null;
          trading_data?: { trades: TradeDetails[] } | null;
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
      };
      leads: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
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
// The supabase client is initialized only if the required environment variables are present.
// This prevents a crash on module load if the app is intended to run in local-only mode.
export const supabase: SupabaseClient<Database> | null =
    (SUPABASE_URL && SUPABASE_ANON_KEY)
        ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

export const isSupabaseConfigured = !!supabase;

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

/**
 * Generic helper to perform a Supabase operation with standardized error handling.
 * @param operation A function that returns a Supabase promise-like object (builder)
 * @param errorMessage Context for the error message if the operation fails.
 * @param fallbackValue An optional value to return if data is null or Supabase is not configured.
 */
export async function performSupabaseOp<T>(
  operation: () => PromiseLike<{ data: T | null; error: any }>,
  errorMessage: string,
  fallbackValue?: T
): Promise<T> {
  if (!isSupabaseConfigured || !supabase) {
    if (fallbackValue !== undefined) return fallbackValue;
    throw new Error('Supabase is not configured.');
  }

  try {
    const { data, error } = await operation();
    if (error) throw new Error(error.message);
    
    // If we have a fallback and data is null, return fallback
    if (data === null && fallbackValue !== undefined) return fallbackValue;
    
    return data as T;
  } catch (error: any) {
    // If the error has a code (Supabase error), throw it as is to allow handling specific codes like PGRST116
    if (error?.code) throw error;
    
    const msg = getErrorMessage(error);
    console.error(`${errorMessage}:`, msg);
    throw new Error(msg);
  }
}

// --- Entry Functions ---
export async function getEntries(): Promise<Record<string, EmotionEntry>> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!.from('entries').select('*').eq('user_id', userId),
        'Error fetching entries'
    );

    const entriesRecord: Record<string, EmotionEntry> = {};
    if (data) {
        const rows = data as Database['public']['Tables']['entries']['Row'][];
        for (const e of rows) {
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
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!
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
            .single(),
        'Error saving entry'
    );

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
    const userId = await getUserId();
    
    await performSupabaseOp(
        () => supabase!.from('entries').delete().eq('date', date).eq('user_id', userId).select(),
        'Error deleting entry'
    );
}

// --- Profile Functions ---
export async function getProfile(): Promise<UserProfile> {
    const userId = await getUserId();
    
    // Helper specifically for profile fetch since it needs to return null data on fail gracefully sometimes
    // But performSupabaseOp throws if requireData is true.
    // We can use performSupabaseOp with requireData=false and handle null manually.
    
    // However, existing logic had specific check for PGRST116.
    // Let's adapt performSupabaseOp or just call it and catch.
    
    try {
        const data = await performSupabaseOp(
            () => supabase!.from('profiles').select('*').eq('id', userId).single(),
            'Error fetching profile'
        );

        if (data) {
            const profileData = data as Database['public']['Tables']['profiles']['Row'];
            return {
                name: profileData.name,
                alias: profileData.alias,
                picture: profileData.picture ?? undefined,
                journalPurpose: profileData.journal_purpose ?? "Click the 'Edit' button in the sidebar to set a purpose!",
            };
        }
    } catch (error: any) {
        // If it's not the "no rows" error, rethrow
        if (error.code !== 'PGRST116') {
             throw error;
        }
    }
    
    // Fallback if no profile exists or PGRST116
    const { data: { user } } = await supabase!.auth.getUser();
    const newUserProfile: UserProfile = {
        name: user?.email?.split('@')[0] || 'New User',
        alias: user?.email || 'No email',
        picture: undefined,
        journalPurpose: "This is my new Deltajournal!",
    };
    return saveProfile(newUserProfile);
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!.from('profiles').upsert({
            id: userId,
            name: profile.name,
            alias: profile.alias,
            picture: profile.picture ?? null,
            journal_purpose: profile.journalPurpose ?? null,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' }).select().single(),
        'Error saving profile'
    );

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
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!
            .from('quests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
        'Error fetching quests'
    );
    
    if (!data) return [];
    
    return (data as Database['public']['Tables']['quests']['Row'][]).map(q => ({
        id: q.id,
        text: q.text,
        completed: q.completed,
        createdAt: q.created_at
    }));
}

export async function addQuest(text: string): Promise<Quest> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!
            .from('quests')
            .insert({ text, user_id: userId })
            .select()
            .single(),
        'Error adding quest'
    );

    const questRow = data as Database['public']['Tables']['quests']['Row'];
    return { 
        id: questRow.id,
        text: questRow.text,
        completed: questRow.completed,
        createdAt: questRow.created_at 
    };
}

export async function updateQuestStatus(id: string, completed: boolean): Promise<Quest> {
    const userId = await getUserId();
    
    const data = await performSupabaseOp(
        () => supabase!
            .from('quests')
            .update({ completed })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single(),
        'Error updating quest'
    );

    const questRow = data as Database['public']['Tables']['quests']['Row'];
    return {
        id: questRow.id,
        text: questRow.text,
        completed: questRow.completed,
        createdAt: questRow.created_at
    };
}

export async function deleteQuest(id: string): Promise<void> {
    const userId = await getUserId();
    
    await performSupabaseOp(
        () => supabase!
            .from('quests')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .select(), // Select is usually needed to verify row was actually there/deleted or satisfy checking, but standard delete doesn't fail if ID missing.
        'Error deleting quest'
    );
}

// ====================================================================================
// LEADS TABLE SETUP
// ====================================================================================
export const LEADS_TABLE_SETUP_SQL = `
-- 1. Create the table for leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for RLS
-- Allow public inserts (anyone can sign up)
CREATE POLICY "Enable insert for everyone" ON public.leads FOR INSERT WITH CHECK (true);

-- Allow only authenticated admins (or no one by default if not set up) to view
-- For now, we'll just leave read access restricted to service role or specific users
`;

export async function addLead(email: string): Promise<void> {
    // Lead capture is public, so no getUserId() needed here for RLS (policy is insert only)
    await performSupabaseOp(
        () => supabase!.from('leads').insert({ email }).select(), // Select to ensure it really happened if we care, or just to satisfy typings if reusing op
        'Error adding lead'
    );
}
