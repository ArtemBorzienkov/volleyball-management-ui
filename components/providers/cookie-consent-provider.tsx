"use client";

import * as React from "react";
import {
  type CookieConsent,
  getConsentSnapshot,
  getServerConsentSnapshot,
  subscribeConsent,
  writeConsent,
} from "@/lib/cookie-consent";

interface CookieConsentContextValue {
  /** null means "no valid choice on record" — treat every optional category as denied. */
  consent: CookieConsent | null;
  /** False until the browser has taken over from the server render. */
  isReady: boolean;
  isBannerOpen: boolean;
  isPreferencesOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  save: (choice: { analytics: boolean }) => void;
  openPreferences: () => void;
  closePreferences: () => void;
}

const CookieConsentContext = React.createContext<CookieConsentContextValue | null>(null);

const neverChanges = () => () => undefined;
const trueOnClient = () => true;
const falseOnServer = () => false;

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const consent = React.useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
  );
  // The banner must not appear in server HTML and then vanish, so it waits for hydration to finish.
  // A store with a constant snapshot reports that without a render-triggering effect.
  const isReady = React.useSyncExternalStore(neverChanges, trueOnClient, falseOnServer);
  const [isPreferencesOpen, setIsPreferencesOpen] = React.useState(false);

  const save = React.useCallback((choice: { analytics: boolean }) => {
    const previous = getConsentSnapshot();
    writeConsent(choice);
    setIsPreferencesOpen(false);
    // Vercel's Analytics component appends a script to <head> and never removes it, so unmounting
    // the gate does not stop measurement that is already running. Withdrawal has to actually stop
    // the processing (GDPR art. 7(3)), and reloading is the only reliable way to unload that script.
    if (previous?.analytics && !choice.analytics) window.location.reload();
  }, []);

  const value = React.useMemo<CookieConsentContextValue>(
    () => ({
      consent,
      isReady,
      // The banner stands down while the preferences dialog is up so the two never stack.
      isBannerOpen: isReady && !consent && !isPreferencesOpen,
      isPreferencesOpen,
      acceptAll: () => save({ analytics: true }),
      rejectAll: () => save({ analytics: false }),
      save,
      openPreferences: () => setIsPreferencesOpen(true),
      // Closing without saving grants nothing: dismissal is not consent (GDPR art. 4(11)).
      closePreferences: () => setIsPreferencesOpen(false),
    }),
    [consent, isReady, isPreferencesOpen, save],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent(): CookieConsentContextValue {
  const context = React.useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  }
  return context;
}
