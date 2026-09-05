/**
 * Consent state for cookies and browser storage, per GDPR art. 4(11) / 7 and the ePrivacy Directive.
 *
 * Two rules drive the shape of this module:
 *  - Nothing non-essential may run before an affirmative choice, so the default is "denied", never
 *    "granted until refused".
 *  - The controller must be able to demonstrate consent, so a choice is stored with the version of
 *    the notice it was given against and the instant it was given.
 *
 * It is exposed as a `useSyncExternalStore` source rather than read into state from an effect: the
 * value lives in localStorage, which has no server snapshot, and the store gives hydration a
 * definite "nothing granted yet" to render.
 */

export const CONSENT_STORAGE_KEY = "sandstats.cookie-consent";

/**
 * Bump whenever the categories or their purposes change. A stored choice from an older notice is
 * treated as no choice at all — consent covers what the user was told, not what came later.
 */
export const CONSENT_VERSION = 1;

/**
 * Consent is not open-ended. EU supervisory authorities (CNIL's 6–13 month guidance, followed across
 * the EEA) expect the question to be put again periodically, so a stored choice ages out.
 */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/** Keep in step with CONSENT_VERSION: the date the notice behind the banner last changed. */
export const POLICY_LAST_UPDATED = "2026-09-05";

/** GDPR art. 13(1)(a): the notice has to name who processes the data and how to reach them. */
export const PRIVACY_CONTACT =
  process.env.NEXT_PUBLIC_PRIVACY_CONTACT ?? "artem.barsikcool@gmail.com";

export interface CookieConsent {
  version: number;
  decidedAt: string;
  /** Session, language and the consent record itself — exempt from consent, so never a choice. */
  necessary: true;
  analytics: boolean;
}

const isStoredConsent = (value: unknown): value is CookieConsent =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as CookieConsent).version === "number" &&
  typeof (value as CookieConsent).decidedAt === "string" &&
  typeof (value as CookieConsent).analytics === "boolean";

/** Returns null for anything that is not a currently valid choice — see getConsentSnapshot. */
const parseConsent = (raw: string | null): CookieConsent | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredConsent(parsed) || parsed.version !== CONSENT_VERSION) return null;
    const decidedAt = Date.parse(parsed.decidedAt);
    if (Number.isNaN(decidedAt) || Date.now() - decidedAt > CONSENT_MAX_AGE_MS) return null;
    return { ...parsed, necessary: true };
  } catch {
    return null;
  }
};

const readRaw = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) — treat it as no choice on record.
    return null;
  }
};

// useSyncExternalStore re-reads the snapshot on every render and loops if the identity changes, so
// the parsed object is memoised against the raw string it came from.
let cachedRaw: string | null = null;
let cachedConsent: CookieConsent | null = null;
let hasCache = false;

const listeners = new Set<() => void>();

export const subscribeConsent = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * The current choice, or null when there is none, it is unreadable, it was given against an older
 * notice, or it has aged out. Callers must treat null as "ask again, grant nothing".
 */
export const getConsentSnapshot = (): CookieConsent | null => {
  const raw = readRaw();
  if (!hasCache || raw !== cachedRaw) {
    cachedRaw = raw;
    cachedConsent = parseConsent(raw);
    hasCache = true;
  }
  return cachedConsent;
};

/** No storage exists while rendering on the server, and nothing optional may run during hydration. */
export const getServerConsentSnapshot = (): CookieConsent | null => null;

export const writeConsent = (choice: { analytics: boolean }): CookieConsent => {
  const consent: CookieConsent = {
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
    necessary: true,
    analytics: choice.analytics,
  };

  const raw = JSON.stringify(consent);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, raw);
    } catch {
      // The choice still applies to this page view; it simply cannot be remembered, and the banner
      // returns on the next visit.
    }
  }

  cachedRaw = raw;
  cachedConsent = consent;
  hasCache = true;
  for (const listener of listeners) listener();

  return consent;
};

export const clearConsent = () => {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
      // Nothing to do — see writeConsent.
    }
  }
  cachedRaw = null;
  cachedConsent = null;
  hasCache = true;
  for (const listener of listeners) listener();
};
