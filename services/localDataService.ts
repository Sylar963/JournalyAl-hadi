
import { type EmotionEntry, type UserProfile, type EmotionType } from '../types';

const ENTRIES_KEY = 'emotion-journal-entries';
const PROFILE_KEY = 'emotion-journal-profile';

const DEFAULT_PROFILE: UserProfile = {
    name: 'Welcome!',
    alias: 'Journal is stored locally',
    picture: undefined,
    journalPurpose: "This diary I fill it on the mornings so represent the way I wake up",
};

// --- Entry Functions ---

/**
 * Fetches all emotion entries from local storage.
 * @returns A record of emotion entries, keyed by date.
 */
export async function getEntries(): Promise<Record<string, EmotionEntry>> {
    const data = localStorage.getItem(ENTRIES_KEY);
    return data ? JSON.parse(data) : {};
}

/**
 * Saves an emotion entry to local storage.
 * @param entry The emotion entry to save.
 * @returns The saved emotion entry.
 */
export async function saveEntry(entry: EmotionEntry): Promise<EmotionEntry> {
    const entries = await getEntries();
    entries[entry.date] = entry;
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return entry;
}

/**
 * Deletes an emotion entry from local storage by its date.
 * @param date The date of the entry to delete (YYYY-MM-DD).
 */
export async function deleteEntry(date: string): Promise<void> {
    const entries = await getEntries();
    delete entries[date];
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

// --- Profile Functions ---

/**
 * Fetches the user profile from local storage.
 * @returns The user profile object.
 */
export async function getProfile(): Promise<UserProfile> {
    const data = localStorage.getItem(PROFILE_KEY);
    if (data) {
        // Simple migration check: old profiles might not have all fields
        const profile = JSON.parse(data);
        if (!profile.alias) {
            profile.alias = DEFAULT_PROFILE.alias;
        }
        if (profile.journalPurpose === undefined) { // Check for undefined to allow empty strings
            profile.journalPurpose = DEFAULT_PROFILE.journalPurpose;
        }
        return profile;
    }
    return DEFAULT_PROFILE;
}

/**
 * Saves the user profile to local storage.
 * @param profile The user profile object to save.
 * @returns The saved user profile.
 */
export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    return profile;
}
