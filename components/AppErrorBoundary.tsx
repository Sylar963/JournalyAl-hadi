import React from 'react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

class AppErrorBoundary extends React.Component<React.PropsWithChildren, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled application error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-0,#0b0f13)] px-6 text-center text-[var(--text-main,#f3f4f6)]">
          <div className="max-w-md rounded-2xl border border-white/10 bg-black/20 p-8 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--text-muted,#9ca3af)]">Application Error</p>
            <h1 className="mt-3 text-2xl font-semibold">Something went wrong.</h1>
            <p className="mt-3 text-sm text-[var(--text-muted,#9ca3af)]">
              Reload the app to recover. If it keeps happening, there is likely a bug in the current view.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
