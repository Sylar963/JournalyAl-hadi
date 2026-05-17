import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from '../components/Header';
import { I18nProvider } from '../hooks/useI18n';

describe('Header', () => {
  it('renders the remaining header actions without the new entry button', () => {
    render(
      <I18nProvider>
        <Header
          userProfile={{ name: 'Ada Lovelace', alias: '@ada' }}
          onProfileClick={() => {}}
          onQuestsClick={() => {}}
          onSignOut={() => {}}
        />
      </I18nProvider>
    );

    expect(screen.queryByRole('button', { name: 'New Entry' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My Quests' }).className).toContain('h-10 w-10');
  });
});
