"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCookieConsent } from "@/components/providers/cookie-consent-provider";

export function CookieConsentBanner() {
  const { t } = useTranslation();
  const {
    isBannerOpen,
    isPreferencesOpen,
    acceptAll,
    rejectAll,
    openPreferences,
    closePreferences,
  } = useCookieConsent();

  return (
    <>
      {isBannerOpen && (
        <div
          // A dialog would trap focus and make the notice a wall; the site stays readable while the
          // choice is pending, which is what makes "reject" a real option.
          role="region"
          aria-label={t("cookies.banner.title")}
          className="fixed inset-x-0 bottom-0 z-90 border-t bg-card p-4 shadow-lg sm:inset-x-4 sm:bottom-4 sm:rounded-lg sm:border"
        >
          <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start">
            <Cookie className="hidden size-5 shrink-0 text-muted-foreground sm:mt-0.5 sm:block" />

            <div className="flex-1 space-y-1">
              <p
                className="text-sm font-medium text-card-foreground"
                suppressHydrationWarning
              >
                {t("cookies.banner.title")}
              </p>
              <p
                className="text-sm text-muted-foreground"
                suppressHydrationWarning
              >
                {t("cookies.banner.description")}{" "}
                <Link
                  href="/cookies"
                  className="text-primary underline underline-offset-4"
                >
                  <span suppressHydrationWarning>
                    {t("cookies.banner.policyLink")}
                  </span>
                </Link>
              </p>
            </div>

            {/* Accept and reject are the same size and weight on the same layer: a refusal must cost
                no more clicks and no less prominence than an acceptance (EDPB 03/2022). */}
            <div className="flex flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Button className="sm:min-w-32" onClick={acceptAll}>
                <span suppressHydrationWarning>
                  {t("cookies.banner.acceptAll")}
                </span>
              </Button>
              <Button className="sm:min-w-32" onClick={rejectAll}>
                <span suppressHydrationWarning>
                  {t("cookies.banner.rejectAll")}
                </span>
              </Button>
              <Button variant="ghost" onClick={openPreferences}>
                <span suppressHydrationWarning>
                  {t("cookies.banner.customize")}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      <CookiePreferencesDialog
        open={isPreferencesOpen}
        onClose={closePreferences}
      />
    </>
  );
}

function CookiePreferencesDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { consent } = useCookieConsent();

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      {/* The shared DialogContent has no height guard; this notice is long enough to overflow a short
          viewport, and an unreachable "reject" button would not be a real choice. */}
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        {/* Keyed so each opening remounts with a body seeded from the stored choice — the alternative
            is syncing state from an effect, which this repo does not do. */}
        <PreferencesBody
          key={String(open)}
          initialAnalytics={consent?.analytics ?? false}
        />
      </DialogContent>
    </Dialog>
  );
}

function PreferencesBody({ initialAnalytics }: { initialAnalytics: boolean }) {
  const { t } = useTranslation();
  const { save } = useCookieConsent();
  // Nothing optional is pre-ticked for a first-time visitor — a pre-ticked box is not consent
  // (GDPR recital 32); initialAnalytics is only ever true for someone who already opted in.
  const [analytics, setAnalytics] = React.useState(initialAnalytics);

  return (
    <>
      <DialogHeader>
        <DialogTitle suppressHydrationWarning>
          {t("cookies.prefs.title")}
        </DialogTitle>
        <DialogDescription suppressHydrationWarning>
          {t("cookies.prefs.description")}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-3">
        <CategoryRow
          title={t("cookies.prefs.necessaryTitle")}
          description={t("cookies.prefs.necessaryDescription")}
          checked
          disabled
          note={t("cookies.prefs.alwaysOn")}
          onChange={() => undefined}
        />
        <CategoryRow
          title={t("cookies.prefs.analyticsTitle")}
          description={t("cookies.prefs.analyticsDescription")}
          checked={analytics}
          onChange={setAnalytics}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        <Link
          href="/cookies"
          className="text-primary underline underline-offset-4"
        >
          <span suppressHydrationWarning>{t("cookies.prefs.policyLink")}</span>
        </Link>
      </p>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="outline" onClick={() => save({ analytics: false })}>
          <span suppressHydrationWarning>{t("cookies.banner.rejectAll")}</span>
        </Button>
        <Button onClick={() => save({ analytics })}>
          <span suppressHydrationWarning>{t("cookies.prefs.save")}</span>
        </Button>
      </DialogFooter>
    </>
  );
}

interface CategoryRowProps {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  note?: string;
  onChange: (next: boolean) => void;
}

function CategoryRow({
  title,
  description,
  checked,
  disabled,
  note,
  onChange,
}: CategoryRowProps) {
  return (
    <label className="flex items-start gap-3 rounded-md border p-3">
      <input
        type="checkbox"
        className="mt-1"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span suppressHydrationWarning>{title}</span>
          {note && (
            <span
              className="rounded-sm bg-secondary px-1.5 py-0.5 text-xs font-normal text-secondary-foreground"
              suppressHydrationWarning
            >
              {note}
            </span>
          )}
        </span>
        <span
          className="text-xs text-muted-foreground"
          suppressHydrationWarning
        >
          {description}
        </span>
      </span>
    </label>
  );
}
