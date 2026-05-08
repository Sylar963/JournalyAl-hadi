import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdPopup from '../components/AdPopup';
import { I18nProvider } from '../hooks/useI18n';
import { useAdSystem } from '../hooks/useAdSystem';

function AdSystemHarness() {
  const { isAdVisible, adContent, closeAd, triggerAd } = useAdSystem(true);

  React.useEffect(() => {
    triggerAd();
  }, [triggerAd]);

  return (
    <>
      {adContent && (
        <AdPopup
          isOpen={isAdVisible}
          onClose={closeAd}
          title={adContent.title}
          message={adContent.message}
          icon={adContent.icon}
          url={adContent.url}
          bannerImageUrl={adContent.bannerImageUrl}
          creativeType={adContent.creativeType}
        />
      )}
    </>
  );
}

describe('AdPopup', () => {
  it('opens the referral link when the CTA is clicked', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const randomSpy = vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0);

    render(
      <I18nProvider>
        <AdSystemHarness />
      </I18nProvider>
    );

    const visitButton = screen.getByRole('button', { name: /visit/i });
    fireEvent.mouseDown(visitButton);
    fireEvent.click(visitButton);

    expect(openSpy).toHaveBeenCalledWith(
      'https://thalex.com/exchange/sign-up?referral=OWNBZS',
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
    randomSpy.mockRestore();
  });

  it('opens the referral link when the CTA is activated from the keyboard', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const randomSpy = vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0);

    render(
      <I18nProvider>
        <AdSystemHarness />
      </I18nProvider>
    );

    const visitButton = screen.getByRole('button', { name: /visit/i });
    visitButton.focus();
    await user.keyboard('{Enter}');

    expect(openSpy).toHaveBeenCalledWith(
      'https://thalex.com/exchange/sign-up?referral=OWNBZS',
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
    randomSpy.mockRestore();
  });

  it('renders a banner when the ad includes one', () => {
    render(
      <I18nProvider>
        <AdPopup
          isOpen={true}
          onClose={() => {}}
          title="Coincall Exchange"
          message="Options trading with deep liquidity."
          icon={<span>icon</span>}
          url="https://www.coincall.com/r/43394533"
          bannerImageUrl="/bannercoincall.png"
        />
      </I18nProvider>
    );

    expect(screen.getByRole('img', { name: /coincall exchange banner/i })).toHaveAttribute('src', '/bannercoincall.png');
  });

  it('renders the logo treatment when the ad uses logo creative', () => {
    render(
      <I18nProvider>
        <AdPopup
          isOpen={true}
          onClose={() => {}}
          title="Thalex Exchange"
          message="Trade BTC, ETH, and more with low fees."
          icon={<span>icon</span>}
          url="https://thalex.com/exchange/sign-up?referral=OWNBZS"
          bannerImageUrl="/Thalex%20Logo.svg"
          creativeType="logo"
        />
      </I18nProvider>
    );

    expect(screen.getByText('Partner Exchange')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /thalex exchange logo/i })).toHaveAttribute('src', '/Thalex%20Logo.svg');
  });
});
