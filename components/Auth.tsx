import React, { useState, useEffect } from 'react';
import { signInWithPassword, signUp, resendConfirmationEmail } from '../services/auth';
import { getErrorMessage } from '../utils/errorHelpers';

const Auth: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [resendMessage, setResendMessage] = useState('');

    useEffect(() => {
        let timer: number;
        if (resendCooldown > 0) {
            timer = window.setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleResend = async () => {
        setIsLoading(true);
        setResendMessage('');
        const { error } = await resendConfirmationEmail(email);
        if (error) {
            setResendMessage(error.message);
        } else {
            setResendMessage('A new confirmation email has been sent.');
            setResendCooldown(60); // Start 60-second cooldown
        }
        setIsLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setAwaitingConfirmation(false);

        try {
            const credentials = { email, password };
            if (isLoginView) {
                const { error: authError } = await signInWithPassword(credentials);
                if (authError) throw authError;
                // On success, the onAuthStateChange listener in App.tsx will handle the redirect.
            } else {
                const { data, error: authError } = await signUp(credentials);
                if (authError) throw authError;

                // If signup is successful but no session is returned, it means
                // the user needs to confirm their email.
                if (data.user && !data.session) {
                    setAwaitingConfirmation(true);
                }
                // If a session is returned (e.g., if auto-confirmation is on),
                // the onAuthStateChange listener will handle the redirect.
            }

        } catch (err: unknown) {
            setError(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    };

    if (awaitingConfirmation) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-transparent backdrop-blur-sm p-4">
                <div className="w-full max-w-sm p-8 space-y-6 glass-panel rounded-2xl shadow-2xl text-center">
                    <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
                    <p className="text-gray-400 leading-relaxed">
                        We've sent a confirmation link to <strong className="text-white">{email}</strong>. Please click the link to complete your registration.
                    </p>
                    
                    <div className="space-y-4 pt-4">
                         <button
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || isLoading}
                            className="w-full flex justify-center py-2 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_15px_var(--chart-glow-color-1)]"
                        >
                            {isLoading ? 'Sending...' : (resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Confirmation')}
                        </button>
                        {resendMessage && (
                            <p className={`text-sm ${resendMessage.includes('error') ? 'text-red-400' : 'text-green-400'}`}>
                                {resendMessage}
                            </p>
                        )}
                    </div>

                    <div className="text-sm pt-2">
                        <button
                            onClick={() => {
                                setAwaitingConfirmation(false);
                                setIsLoginView(true);
                                setEmail('');
                                setPassword('');
                                setError(null);
                            }}
                            className="font-medium text-gray-400 hover:text-[var(--accent-primary)] transition-colors focus:outline-none"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-transparent backdrop-blur-sm p-4">
            <div className="w-full max-w-sm p-8 space-y-6 glass-panel rounded-2xl shadow-2xl border-[color:var(--glass-border)]">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Deltajournal</h1>
                    <p className="text-gray-400 mt-2">{isLoginView ? 'Sign in to access your journal' : 'Create a new account'}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                            Email address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition placeholder-gray-500"
                        />
                    </div>

                    <div>
                         <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={isLoginView ? "current-password" : "new-password"}
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-[color:var(--glass-border)] rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition placeholder-gray-500"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_15px_var(--chart-glow-color-1)]"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                    Processing...
                                </>
                            ) : (isLoginView ? 'Sign In' : 'Sign Up')}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm text-gray-400">
                    {isLoginView ? "Don't have an account?" : "Already have an account?"}
                    <button 
                        onClick={() => { setIsLoginView(!isLoginView); setError(null); }} 
                        className="font-medium text-[var(--accent-primary)] hover:underline ml-1 focus:outline-none"
                        aria-label={isLoginView ? 'Switch to sign up page' : 'Switch to sign in page'}
                    >
                        {isLoginView ? 'Sign Up' : 'Sign In'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
