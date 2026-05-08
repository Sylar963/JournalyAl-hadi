import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../components/Header';
import { I18nProvider } from '../hooks/useI18n';

describe('Header', () => {
  it('keeps the primary action compact on mobile while preserving its accessible name', () => {
    render(
      <I18nProvider>
        <Header
          onNewEntryClick={() => {}}
          userProfile={{ name: 'Ada Lovelace', alias: '@ada' }}
          onProfileClick={() => {}}
          onQuestsClick={() => {}}
          onSignOut={() => {}}
        />
      </I18nProvider>
    );

    const newEntryButton = screen.getByRole('button', { name: 'New Entry' });
    expect(newEntryButton.className).toContain('min-w-10');
    expect(newEntryButton.querySelector('span')?.className).toContain('hidden sm:inline');
    expect(screen.getByRole('button', { name: 'My Quests' }).className).toContain('h-10 w-10');
  });
});
