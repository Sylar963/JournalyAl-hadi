import { type EmotionEntry, type UserProfile, type Quest } from '../types';

const ENTRIES_KEY = 'emotion-journal-entries';
const PROFILE_KEY = 'emotion-journal-profile';
const QUESTS_KEY = 'emotion-journal-quests';

const DEFAULT_PROFILE: UserProfile = {
    name: 'Welcome!',
    alias: 'Journal is stored locally',
    picture: undefined,
    journalPurpose: "This diary I fill it on the mornings so represent the way I wake up",
};

// --- Entry Functions ---
export async function getEntries(): Promise<Record<string, EmotionEntry>> {
    const data = localStorage.getItem(ENTRIES_KEY);
    return data ? JSON.parse(data) : {};
}

export async function saveEntry(entry: EmotionEntry): Promise<EmotionEntry> {
    const entries = await getEntries();
    entries[entry.date] = entry;
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return entry;
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
    // In local mode, we just log it or store it in local storage if we really wanted to.
    console.log(`[Local Mode] Lead captured: ${email}`);
    // Optional: Store in localStorage
    const leads = JSON.parse(localStorage.getItem('emotion-journal-leads') || '[]');
    leads.push({ email, createdAt: new Date().toISOString() });
    localStorage.setItem('emotion-journal-leads', JSON.stringify(leads));
}