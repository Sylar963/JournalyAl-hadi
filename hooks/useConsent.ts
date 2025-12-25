
import { useState, useEffect, useCallback } from 'react';
import { ConsentService, ConsentState } from '../services/consentService';

export const useConsent = () => {
  const service = ConsentService.getInstance();
  const [consent, setConsentState] = useState<ConsentState>(service.getConsent());
  const [hasConsented, setHasConsented] = useState<boolean>(service.hasConsented());

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<ConsentState>;
      setConsentState(service.getConsent());
      setHasConsented(service.hasConsented());
    };

    window.addEventListener('consent-updated', handleUpdate);
    return () => window.removeEventListener('consent-updated', handleUpdate);
  }, []);

  const saveConsent = useCallback((newConsent: ConsentState) => {
    service.setConsent(newConsent);
    setConsentState(newConsent);
    setHasConsented(true);
  }, []);

  const clearConsent = useCallback(() => {
    service.clearConsent();
    setConsentState(service.getConsent());
    setHasConsented(false);
  }, []);

  return {
    consent,
    hasConsented,
    saveConsent,
    clearConsent
  };
};
