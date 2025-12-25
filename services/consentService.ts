
export type ConsentType = 'essential' | 'analytics' | 'marketing';

export interface ConsentState {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp?: number;
}

export interface IConsentService {
  getConsent(): ConsentState;
  setConsent(consent: ConsentState): void;
  hasConsented(): boolean;
  clearConsent(): void;
}

const STORAGE_KEY = 'deltajournal_consent';

export class ConsentService implements IConsentService {
  private static instance: ConsentService;

  private constructor() {}

  public static getInstance(): ConsentService {
    if (!ConsentService.instance) {
      ConsentService.instance = new ConsentService();
    }
    return ConsentService.instance;
  }

  getConsent(): ConsentState {
    if (typeof window === 'undefined') {
      return { essential: true, analytics: false, marketing: false };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse consent', e);
      }
    }
    
    // Default: essential only
    return { essential: true, analytics: false, marketing: false };
  }

  setConsent(consent: ConsentState): void {
    if (typeof window === 'undefined') return;
    
    const consentWithTimestamp = {
      ...consent,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consentWithTimestamp));
    
    // Dispatch event for reactive updates across tabs/components
    window.dispatchEvent(new CustomEvent('consent-updated', { detail: consentWithTimestamp }));
  }

  hasConsented(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEY);
  }

  clearConsent(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('consent-updated'));
  }
}
