"use client";

import { Analytics } from "@vercel/analytics/next";
import { useCookieConsent } from "@/components/providers/cookie-consent-provider";

/**
 * Vercel Analytics only mounts once the visitor has opted in. Rendering it behind this gate rather
 * than in the layout is the point: consent has to be given *before* the measurement runs, not after.
 */
export function AnalyticsGate() {
  const { consent } = useCookieConsent();
  if (!consent?.analytics) return null;
  return <Analytics />;
}
