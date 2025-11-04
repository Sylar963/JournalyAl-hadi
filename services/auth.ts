import { supabase } from './supabaseService';
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials, AuthChangeEvent, Session } from '@supabase/supabase-js';

const clientNotConfiguredError = "Supabase client is not initialized. Make sure to set SUPABASE_URL and SUPABASE_ANON_KEY secrets for the project.";

export function signUp(credentials: SignUpWithPasswordCredentials) {
    if (!supabase) {
        console.error(clientNotConfiguredError);
        return Promise.resolve({ data: { user: null, session: null }, error: { name: 'AuthClientError', message: clientNotConfiguredError } as any });
    }
    return supabase.auth.signUp(credentials);
}

export function signInWithPassword(credentials: SignInWithPasswordCredentials) {
    if (!supabase) {
        console.error(clientNotConfiguredError);
        return Promise.resolve({ data: { user: null, session: null }, error: { name: 'AuthClientError', message: clientNotConfiguredError } as any });
    }
    return supabase.auth.signInWithPassword(credentials);
}

export function signOut() {
    if (!supabase) {
        console.error(clientNotConfiguredError);
        return Promise.resolve({ error: null });
    }
    return supabase.auth.signOut();
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!supabase) {
        // Return a dummy subscription object that does nothing
        return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
}

export function getSession() {
    if (!supabase) {
        // Return a promise that resolves to a null session, mimicking the Supabase client's response structure
        return Promise.resolve({ data: { session: null }, error: null });
    }
    return supabase.auth.getSession();
}

export function resendConfirmationEmail(email: string) {
    if (!supabase) {
        console.error(clientNotConfiguredError);
        return Promise.resolve({ data: { user: null, session: null }, error: { name: 'AuthClientError', message: clientNotConfiguredError } as any });
    }
    return supabase.auth.resend({ type: 'signup', email });
}