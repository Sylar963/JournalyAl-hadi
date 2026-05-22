import React, { useState } from 'react';
import { updatePassword } from '../services/auth';
import { getErrorMessage } from '../utils/errorHelpers';

interface ResetPasswordViewProps {
  hasRecoverySession: boolean;
}

const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({ hasRecoverySession }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 6) {
      setError('Use at least 6 characters for the new password.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        throw updateError;
      }

      setSuccess('Password updated. Redirecting to sign in...');
      window.setTimeout(() => {
        window.location.replace('/');
      }, 1200);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-transparent px-4 py-10 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 shadow-2xl border-[color:var(--glass-border)]">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Delta Journal</h1>
          <p className="mt-2 text-gray-400">Reset your password</p>
        </div>

        {!hasRecoverySession ? (
          <div className="mt-6 space-y-4 text-center text-sm text-gray-300">
            <p>Open this page from the password reset link sent to your email.</p>
            <p className="text-gray-500">If you already clicked the link, wait a moment for the recovery session to load or request a new reset email.</p>
            <button
              type="button"
              onClick={() => window.location.replace('/')}
              className="journal-button-secondary rounded-lg px-4 py-2 text-sm font-medium"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <label className="block text-sm font-medium text-gray-300">
              <span className="mb-2 block">New password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-[color:var(--glass-border)] bg-white/5 p-3 text-gray-200 transition placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </label>

            <label className="block text-sm font-medium text-gray-300">
              <span className="mb-2 block">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-[color:var(--glass-border)] bg-white/5 p-3 text-gray-200 transition placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </label>

            {error && <p className="text-center text-sm text-red-400">{error}</p>}
            {success && <p className="text-center text-sm text-green-400">{success}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] px-4 py-3 text-sm font-medium text-white shadow-[0_0_15px_var(--chart-glow-color-1)] transition-all duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Updating password...' : 'Save new password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordView;
