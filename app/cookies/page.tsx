"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCookieConsent } from "@/components/providers/cookie-consent-provider";
import { PRIVACY_CONTACT, POLICY_LAST_UPDATED } from "@/lib/cookie-consent";

interface StorageEntry {
  name: string;
  typeKey: string;
  purposeKey: string;
  retentionKey: string;
}

const STORAGE_ENTRIES: StorageEntry[] = [
  {
    name: "access_token",
    typeKey: "cookies.policy.typeNecessary",
    purposeKey: "cookies.policy.sessionPurpose",
    retentionKey: "cookies.policy.sessionRetention",
  },
  {
    name: "i18next",
    typeKey: "cookies.policy.typeNecessary",
    purposeKey: "cookies.policy.languagePurpose",
    retentionKey: "cookies.policy.languageRetention",
  },
  {
    name: "sandstats.cookie-consent",
    typeKey: "cookies.policy.typeNecessary",
    purposeKey: "cookies.policy.consentPurpose",
    retentionKey: "cookies.policy.consentRetention",
  },
  {
    name: "Vercel Analytics",
    typeKey: "cookies.policy.typeAnalytics",
    purposeKey: "cookies.policy.analyticsPurpose",
    retentionKey: "cookies.policy.analyticsRetention",
  },
];

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

export default function CookiePolicyPage() {
  const { t } = useTranslation();
  const { consent, openPreferences } = useCookieConsent();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold" suppressHydrationWarning>
          {t("cookies.policy.title")}
        </h1>
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          {t("cookies.policy.updated", { date: POLICY_LAST_UPDATED })}
        </p>
      </header>

      <p className="text-sm leading-relaxed" suppressHydrationWarning>
        {t("cookies.policy.intro")}
      </p>

      <Section title={t("cookies.policy.controllerTitle")}>
        <p suppressHydrationWarning>{t("cookies.policy.controllerBody", { contact: PRIVACY_CONTACT })}</p>
      </Section>

      <Section title={t("cookies.policy.storedTitle")}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="py-2 pr-3 font-medium" suppressHydrationWarning>
                  {t("cookies.policy.tableName")}
                </th>
                <th className="py-2 pr-3 font-medium" suppressHydrationWarning>
                  {t("cookies.policy.tableType")}
                </th>
                <th className="py-2 pr-3 font-medium" suppressHydrationWarning>
                  {t("cookies.policy.tablePurpose")}
                </th>
                <th className="py-2 font-medium" suppressHydrationWarning>
                  {t("cookies.policy.tableRetention")}
                </th>
              </tr>
            </thead>
            <tbody>
              {STORAGE_ENTRIES.map((entry) => (
                <tr key={entry.name} className="border-b last:border-0 align-top">
                  <td className="py-2 pr-3 font-mono">{entry.name}</td>
                  <td className="py-2 pr-3" suppressHydrationWarning>
                    {t(entry.typeKey)}
                  </td>
                  <td className="py-2 pr-3" suppressHydrationWarning>
                    {t(entry.purposeKey)}
                  </td>
                  <td className="py-2" suppressHydrationWarning>
                    {t(entry.retentionKey)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={t("cookies.policy.basisTitle")}>
        <p suppressHydrationWarning>{t("cookies.policy.basisNecessary")}</p>
        <p suppressHydrationWarning>{t("cookies.policy.basisAnalytics")}</p>
      </Section>

      <Section title={t("cookies.policy.recipientsTitle")}>
        <p suppressHydrationWarning>{t("cookies.policy.recipientsBody")}</p>
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
        <CardContent className="flex flex-col gap-3 p-4">
          <h2 className="text-base font-medium" suppressHydrationWarning>
            {t("cookies.policy.withdrawTitle")}
          </h2>
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t("cookies.policy.withdrawBody")}
          </p>
          <p className="text-sm" suppressHydrationWarning>
            {consent
              ? t("cookies.policy.currentChoice", {
                  state: consent.analytics
                    ? t("cookies.policy.stateAllowed")
                    : t("cookies.policy.stateDenied"),
                  date: new Date(consent.decidedAt).toLocaleDateString(),
                })
              : t("cookies.policy.noChoice")}
          </p>
          <Button className="self-start" onClick={openPreferences}>
            <span suppressHydrationWarning>{t("cookies.policy.manageButton")}</span>
          </Button>
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
