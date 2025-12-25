# Consent Management Plugin Usage

This project uses a modular "clean-plugin" architecture for managing user consent (GDPR/CCPA compliance).

## Components

### 1. `ConsentService`
A singleton service managing persistence and state.
- **Location**: `services/consentService.ts`
- **Persistence**: `localStorage` (key: `deltajournal_consent`)
- **Events**: Dispatches `consent-updated` event on window.

### 2. `useConsent` Hook
React hook for reactive consent state.
```tsx
const { consent, hasConsented, saveConsent } = useConsent();

// Check specific consent
if (consent.analytics) {
  // initialize analytics
}
```

### 3. `CookieBanner`
UI component that displays the consent banner.
- **Location**: `components/CookieBanner.tsx`
- **Features**: 
    - Auto-hides if consent exists.
    - "Accept All", "Reject All", "Customize".
    - Glassmorphic design.

### 4. Legal Pages
- `components/Legal/PrivacyPolicy.tsx`
- `components/Legal/TermsOfService.tsx`

## Integration Guide

### Adding Analytics or Third-Party Scripts
Always wrap non-essential scripts with a consent check.

**Example (React Component):**
```tsx
import { useConsent } from '../hooks/useConsent';

const MyAnalyticsComponent = () => {
  const { consent } = useConsent();

  if (!consent.analytics) return null;

  return <ActualAnalyticsComponent />;
};
```

**Example (Service/Logic):**
```typescript
import { ConsentService } from '../services/consentService';

function trackEvent(name: string) {
  const service = ConsentService.getInstance();
  const { analytics } = service.getConsent();

  if (analytics) {
    // send event
  }
}
```

## Edge Cases & Notes
- **Server-Side Rendering (SSR)**: The service gracefully handles `window is undefined` checks, defaulting to "Essential Only" mode on server.
- **LocalStorage Availability**: If LocalStorage is disabled (e.g., incognito in some browsers), consent is not persisted but session-based consent works within the lifecycle of the `ConsentService` instance (though reloading clears it).
- **Z-Index**: The Cookie Banner uses `z-50`. Ensure no other elements block it.
