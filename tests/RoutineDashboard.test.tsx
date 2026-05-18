import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import RoutineDashboard from '../components/Routine/RoutineDashboard';
import { I18nProvider } from '../hooks/useI18n';
import { getAssetCorrelations } from '../services/hyperliquidService';

vi.mock('../services/hyperliquidService', () => ({
  getAssetCorrelations: vi.fn().mockResolvedValue([]),
}));

const mockedGetAssetCorrelations = vi.mocked(getAssetCorrelations);

describe('RoutineDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    mockedGetAssetCorrelations.mockResolvedValue([]);
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
      const stored = localStorage.getItem(storageKey);
      expect(stored).toContain(note);
      expect(stored).toContain('dailyNotes');
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

  it('reuses the last saved template when today has no layout yet', async () => {
    localStorage.setItem('journaly_routine_template', JSON.stringify({
      items: [
        {
          i: 'checklist',
          x: 0,
          y: 0,
          w: 1,
          h: 2,
          pluginId: 'checklist',
          data: {
            tasks: [{ id: 99, text: 'Template checklist task', done: false }],
          },
        },
      ],
      thesis: null,
      lastUpdated: new Date().toISOString(),
    }));

    render(
      <I18nProvider>
        <RoutineDashboard />
      </I18nProvider>
    );

    expect(await screen.findByText('Template checklist task')).toBeInTheDocument();
  });

  it('shows an error message when correlation data fails to load', async () => {
    mockedGetAssetCorrelations.mockRejectedValueOnce(new Error('Correlation request failed'));

    render(
      <I18nProvider>
        <RoutineDashboard />
      </I18nProvider>
    );

    expect(await screen.findByText('Correlation data is unavailable right now.')).toBeInTheDocument();
    expect(screen.getByText('Correlation request failed')).toBeInTheDocument();
  });
});
