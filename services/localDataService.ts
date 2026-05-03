import { type BybitConnection, type BybitCredentialInput, type BybitTradeCacheResult, type EmotionEntry, type UserProfile, type Quest, type PerformanceReview } from '../types';
import { normalizeEntryTradingData } from './tradingIndexService';

const ENTRIES_KEY = 'emotion-journal-entries';
const PROFILE_KEY = 'emotion-journal-profile';
const QUESTS_KEY = 'emotion-journal-quests';
const REVIEWS_KEY = 'emotion-journal-reviews';
const LOCAL_USER_ID = 'local-user';

const DEFAULT_PROFILE: UserProfile = {
    name: 'Welcome!',
    alias: 'Journal is stored locally',
    picture: undefined,
    journalPurpose: "This diary I fill it on the mornings so represent the way I wake up",
};

// --- Entry Functions ---
export async function getEntries(): Promise<Record<string, EmotionEntry>> {
    const data = localStorage.getItem(ENTRIES_KEY);
    if (!data) return {};

    const parsed = JSON.parse(data) as Record<string, EmotionEntry>;
    return Object.fromEntries(
        Object.entries(parsed).map(([date, entry]) => [
            date,
            {
                ...entry,
                tradingData: normalizeEntryTradingData(entry.tradingData),
            },
        ])
    );
}

export async function saveEntry(entry: EmotionEntry): Promise<EmotionEntry> {
    const entries = await getEntries();
    const normalizedEntry: EmotionEntry = {
        ...entry,
        tradingData: normalizeEntryTradingData(entry.tradingData),
    };
    entries[entry.date] = normalizedEntry;
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return normalizedEntry;
}

export async function deleteEntry(date: string): Promise<void> {
    const entries = await getEntries();
    delete entries[date];
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

// --- Profile Functions ---
export async function getProfile(): Promise<UserProfile> {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
        const profile = JSON.parse(data);
        if (!profile.alias) {
            profile.alias = DEFAULT_PROFILE.alias;
        }
        if (profile.journalPurpose === undefined) { 
            profile.journalPurpose = DEFAULT_PROFILE.journalPurpose;
        }
        return profile;
    }
    return DEFAULT_PROFILE;
}

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
}

// --- Quest Functions ---
export async function getQuests(): Promise<Quest[]> {
    const data = localStorage.getItem(QUESTS_KEY);
    const quests: Quest[] = data ? JSON.parse(data) : [];
    // Sort by creation date, ascending
    return quests.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function addQuest(text: string): Promise<Quest> {
    const quests = await getQuests();
    const newQuest: Quest = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
    };
    quests.push(newQuest);
    localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
    return newQuest;
}

export async function updateQuestStatus(id: string, completed: boolean): Promise<Quest> {
    const quests = await getQuests();
    const questIndex = quests.findIndex(q => q.id === id);
    if (questIndex === -1) {
        throw new Error("Quest not found");
    }
    quests[questIndex].completed = completed;
    localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
    return quests[questIndex];
}

export async function deleteQuest(id: string): Promise<void> {
    let quests = await getQuests();
    quests = quests.filter(q => q.id !== id);
    localStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
}

// --- Lead Functions ---
export async function addLead(email: string): Promise<void> {
    const leads = JSON.parse(localStorage.getItem('emotion-journal-leads') || '[]');
    leads.push({ email, createdAt: new Date().toISOString() });
    localStorage.setItem('emotion-journal-leads', JSON.stringify(leads));
}

// --- Review Functions ---
export async function getReviews(): Promise<PerformanceReview[]> {
    const data = localStorage.getItem(REVIEWS_KEY);
    const reviews: PerformanceReview[] = data ? JSON.parse(data) : [];
    return reviews
        .map((review) => ({ ...review, userId: review.userId || LOCAL_USER_ID }))
        .sort((a, b) => b.year - a.year);
}

export async function getReview(year: number): Promise<PerformanceReview | null> {
    const reviews = await getReviews();
    return reviews.find(r => r.year === year) || null;
}

export async function saveReview(review: Omit<PerformanceReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<PerformanceReview> {
    const reviews = await getReviews();
    const normalizedReview = { ...review, userId: review.userId || LOCAL_USER_ID };
    const existingIndex = reviews.findIndex(r => r.year === normalizedReview.year);
    const now = new Date().toISOString();
    if (existingIndex >= 0) {
        reviews[existingIndex] = { ...reviews[existingIndex], ...normalizedReview, updatedAt: now };
    } else {
        reviews.push({
            ...normalizedReview,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        });
    }
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
    return reviews.find(r => r.year === normalizedReview.year)!;
}

export async function deleteReview(year: number): Promise<void> {
    let reviews = await getReviews();
    reviews = reviews.filter(r => r.year !== year);
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
}

export async function getBybitConnection(): Promise<BybitConnection | null> {
    return null;
}

export async function saveBybitConnection(_input: BybitCredentialInput): Promise<BybitConnection> {
    throw new Error('Bybit integration requires Supabase-backed mode.');
}

export async function validateBybitConnection(_input: BybitCredentialInput): Promise<BybitConnection> {
    throw new Error('Bybit integration requires Supabase-backed mode.');
}

export async function deleteBybitConnection(): Promise<void> {
    // No-op in local mode.
}

export async function getCachedBybitTradesForDate(_date: string): Promise<BybitTradeCacheResult> {
    return { trades: [], positions: [], connection: null };
}

export async function refreshBybitTradesForDate(_date: string, _timezone: string): Promise<BybitTradeCacheResult> {
    throw new Error('Bybit integration requires Supabase-backed mode.');
}
