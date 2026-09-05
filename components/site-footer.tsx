"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useCookieConsent } from "@/components/providers/cookie-consent-provider";

/**
 * Carries the standing entry point to the consent choice. GDPR art. 7(3) requires withdrawing consent
 * to be as easy as giving it, so this stays reachable from every page once the banner is gone.
 */
export function SiteFooter() {
  const { t } = useTranslation();
  const { openPreferences } = useCookieConsent();

  return (
    <footer className="border-t px-4 py-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <Link href="/cookies" className="hover:text-foreground">
          <span suppressHydrationWarning>{t("cookies.policy.title")}</span>
        </Link>
        <button type="button" onClick={openPreferences} className="hover:text-foreground">
          <span suppressHydrationWarning>{t("cookies.settingsLink")}</span>
        </button>
      </div>
    </footer>
  );
}
