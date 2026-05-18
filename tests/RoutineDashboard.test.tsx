import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RoutineDashboard from '../components/Routine/RoutineDashboard';
import { I18nProvider } from '../hooks/useI18n';

vi.mock('../services/hyperliquidService', () => ({
  getAssetCorrelations: vi.fn().mockResolvedValue([]),
}));

describe('RoutineDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('persists market bias notes across reloads', async () => {
    const storageKey = `journaly_routine_${new Date().toISOString().split('T')[0]}`;
    const note = 'Bullish above weekly high if volume confirms';
    const { unmount } = render(
      <I18nProvider>
        <RoutineDashboard />
      </I18nProvider>
    );

    fireEvent.change(await screen.findByPlaceholderText(/write your daily market thesis/i), {
      target: { value: note },
    });

    await waitFor(() => {
      expect(localStorage.getItem(storageKey)).toContain(note);
    });

    unmount();

    render(
      <I18nProvider>
        <RoutineDashboard />
      </I18nProvider>
    );

    expect(await screen.findByDisplayValue(note)).toBeInTheDocument();
  });

  it('persists checklist completion across reloads', async () => {
    const storageKey = `journaly_routine_${new Date().toISOString().split('T')[0]}`;
    const { unmount } = render(
      <I18nProvider>
        <RoutineDashboard />
      </I18nProvider>
    );

    fireEvent.click(await screen.findByText('Check Economic Calendar'));

    await waitFor(() => {
      expect(localStorage.getItem(storageKey)).toContain('Check Economic Calendar');
      expect(localStorage.getItem(storageKey)).toContain('"done":true');
    });

    unmount();

    render(
      <I18nProvider>
        <RoutineDashboard />
      </I18nProvider>
    );

    const task = await screen.findByText('Check Economic Calendar');
    expect(task.className).toContain('line-through');
  });

  it('adds and removes custom checklist tasks', async () => {
    const storageKey = `journaly_routine_${new Date().toISOString().split('T')[0]}`;
    const customTask = 'Check liquidity before London open';

    render(
      <I18nProvider>
        <RoutineDashboard />
      </I18nProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: /\+ add task/i }));
    fireEvent.change(screen.getByPlaceholderText(/add a pre-flight task/i), {
      target: { value: customTask },
    });
    fireEvent.click(screen.getByRole('button', { name: /save task/i }));

    expect(await screen.findByText(customTask)).toBeInTheDocument();

    await waitFor(() => {
      expect(localStorage.getItem(storageKey)).toContain(customTask);
    });

    fireEvent.click(screen.getByText(customTask));
    fireEvent.click(await screen.findByRole('button', { name: `Remove task: ${customTask}` }));

    await waitFor(() => {
      expect(screen.queryByText(customTask)).not.toBeInTheDocument();
      expect(localStorage.getItem(storageKey)).not.toContain(customTask);
    });
  });
});
