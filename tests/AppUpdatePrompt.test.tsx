import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppUpdatePrompt from '../components/AppUpdatePrompt';
import { I18nProvider } from '../hooks/useI18n';

describe('AppUpdatePrompt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the reload banner when a newer deployment is detected', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ version: 'build-2' }),
    } as Response);

    render(
      <I18nProvider>
        <AppUpdatePrompt enabled={true} currentVersion="build-1" pollIntervalMs={10_000} />
      </I18nProvider>
    );

    expect(await screen.findByText('A new version is available.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
  });

  it('reloads the page when the user accepts the update', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ version: 'build-2' }),
    } as Response);

    const reloadSpy = vi.fn();

    render(
      <I18nProvider>
        <AppUpdatePrompt enabled={true} currentVersion="build-1" pollIntervalMs={10_000} onReload={reloadSpy} />
      </I18nProvider>
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Reload' }));

    expect(reloadSpy).toHaveBeenCalledTimes(1);
  });

  it('stays hidden when the deployed version matches the current build', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ version: 'build-1' }),
    } as Response);

    render(
      <I18nProvider>
        <AppUpdatePrompt enabled={true} currentVersion="build-1" pollIntervalMs={10_000} />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByText('A new version is available.')).not.toBeInTheDocument();
  });
});
