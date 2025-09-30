
import { supabase } from './supabaseService';
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials, AuthChangeEvent, Session } from '@supabase/supabase-js';

export function signUp(credentials: SignUpWithPasswordCredentials) {
    return supabase.auth.signUp(credentials);
}

export function signInWithPassword(credentials: SignInWithPasswordCredentials) {
    return supabase.auth.signInWithPassword(credentials);
}

export function signOut() {
    return supabase.auth.signOut();
}

export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

export function getSession() {
    return supabase.auth.getSession();
}

export function resendConfirmationEmail(email: string) {
    return supabase.auth.resend({ type: 'signup', email });
}
