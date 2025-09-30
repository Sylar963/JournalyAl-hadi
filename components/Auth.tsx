import React, { useState, useEffect } from 'react';
import { signInWithPassword, signUp, resendConfirmationEmail } from '../services/auth';

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
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    if (awaitingConfirmation) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-black text-white p-4">
                <div className="w-full max-w-sm p-8 space-y-6 bg-gray-900 rounded-xl shadow-2xl border border-gray-800 text-center">
                    <h1 className="text-2xl font-bold text-white">Check your inbox</h1>
                    <p className="text-gray-300 leading-relaxed">
                        We've sent a confirmation link to <strong className="text-white">{email}</strong>. Please click the link to complete your registration.
                    </p>
                    
                    <div className="space-y-4 pt-4">
                         <button
                            onClick={handleResend}
                            disabled={resendCooldown > 0 || isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                            className="font-medium text-gray-400 hover:text-yellow-500 transition-colors focus:outline-none"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center bg-black text-white p-4">
            <div className="w-full max-w-sm p-8 space-y-6 bg-gray-900 rounded-xl shadow-2xl border border-gray-800">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white">Emotion Journal</h1>
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
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
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
                            className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-black bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-3"></div>
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
                        className="font-medium text-yellow-500 hover:underline ml-1 focus:outline-none"
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
