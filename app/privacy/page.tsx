"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { PRIVACY_CONTACT, POLICY_LAST_UPDATED } from "@/lib/cookie-consent";
import { maskPlayerName } from "@/lib/player-name";

const COLLECTED_GROUPS = [
  { titleKey: "privacy.providedTitle", bodyKey: "privacy.providedBody" },
  { titleKey: "privacy.recordedTitle", bodyKey: "privacy.recordedBody" },
  { titleKey: "privacy.derivedTitle", bodyKey: "privacy.derivedBody" },
];

const PUBLISHED_KEYS = [
  "privacy.publishedName",
  "privacy.publishedRating",
  "privacy.publishedResults",
  "privacy.publishedRegistrations",
];

// Reused from the cookie notice rather than retranslated: the rights are the same rights.
const RIGHT_KEYS = [
  "cookies.policy.rightAccess",
  "cookies.policy.rightRectification",
  "cookies.policy.rightErasure",
  "cookies.policy.rightRestriction",
  "cookies.policy.rightPortability",
  "cookies.policy.rightObject",
  "cookies.policy.rightWithdraw",
  "cookies.policy.rightComplaint",
];

export default function PrivacyNoticePage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold" suppressHydrationWarning>
          {t("privacy.title")}
        </h1>
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {t("cookies.policy.updated", { date: POLICY_LAST_UPDATED })}
        </p>
      </header>

      <p className="text-sm leading-relaxed" suppressHydrationWarning>
        {t("privacy.intro")}
      </p>

      <Section title={t("privacy.controllerTitle")}>
        <p suppressHydrationWarning>{t("privacy.controllerBody", { contact: PRIVACY_CONTACT })}</p>
      </Section>

      <Section title={t("privacy.collectedTitle")}>
        {COLLECTED_GROUPS.map((group) => (
          <div key={group.titleKey} className="space-y-1">
            <h3 className="text-sm font-medium text-foreground" suppressHydrationWarning>
              {t(group.titleKey)}
            </h3>
            <p suppressHydrationWarning>{t(group.bodyKey)}</p>
          </div>
        ))}
      </Section>

      <Section title={t("privacy.publishedTitle")}>
        <p suppressHydrationWarning>{t("privacy.publishedBody")}</p>
        <ul className="list-disc space-y-1 pl-5">
          {PUBLISHED_KEYS.map((key) => (
            <li key={key} suppressHydrationWarning>
              {t(key)}
            </li>
          ))}
        </ul>
        <p className="flex gap-2 rounded-md border border-warning/40 p-3 text-card-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <span suppressHydrationWarning>{t("privacy.publishedWarning")}</span>
        </p>
      </Section>

      <Section title={t("privacy.anonymityTitle")}>
        <p suppressHydrationWarning>
          {t("privacy.anonymityBody", { example: maskPlayerName("Artem Borzienkov") })}
        </p>
        {/* Stated plainly on purpose: masking is applied when a name is displayed, so it is a
            reduction in how visibly a name is published, not technical anonymisation. Claiming more
            than that would make this notice itself misleading. */}
        <p className="font-medium text-foreground" suppressHydrationWarning>
          {t("privacy.anonymityLimitTitle")}
        </p>
        <p suppressHydrationWarning>{t("privacy.anonymityLimitBody")}</p>
      </Section>

      <Section title={t("privacy.basisTitle")}>
        <p suppressHydrationWarning>{t("privacy.basisConsent")}</p>
        <p suppressHydrationWarning>{t("privacy.basisContract")}</p>
      </Section>

      <Section title={t("privacy.recipientsTitle")}>
        <p suppressHydrationWarning>{t("privacy.recipientsBody")}</p>
      </Section>

      <Section title={t("privacy.retentionTitle")}>
        <p suppressHydrationWarning>{t("privacy.retentionBody")}</p>
      </Section>

      <Section title={t("cookies.policy.rightsTitle")}>
        <p suppressHydrationWarning>{t("cookies.policy.rightsIntro")}</p>
        <ul className="list-disc space-y-1 pl-5">
          {RIGHT_KEYS.map((key) => (
            <li key={key} suppressHydrationWarning>
              {t(key)}
            </li>
          ))}
        </ul>
      </Section>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <h2 className="text-base font-medium" suppressHydrationWarning>
            {t("privacy.exerciseTitle")}
          </h2>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("privacy.exerciseBody", { contact: PRIVACY_CONTACT })}
          </p>
          <p className="text-sm text-muted-foreground">
            <Link href="/cookies" className="text-primary underline underline-offset-4">
              <span suppressHydrationWarning>{t("privacy.cookieLink")}</span>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-medium" suppressHydrationWarning>
        {title}
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
