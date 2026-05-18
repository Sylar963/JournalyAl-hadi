import React from 'react';
import { render, screen } from '@testing-library/react';
import AppErrorBoundary from '../components/AppErrorBoundary';

const CrashOnRender: React.FC = () => {
  throw new Error('boom');
};

describe('AppErrorBoundary', () => {
  it('renders a recovery fallback for uncaught render errors', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AppErrorBoundary>
        <CrashOnRender />
      </AppErrorBoundary>
    );

    expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload App' })).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
