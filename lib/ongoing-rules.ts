// Mirrors the API's src/ongoing/rules.ts: the same keys, in the same order. The wording lives in the
// four locale files under `ongoing.rules.<key>`; only the keys travel to the server.

/** Rules that hold whatever the format is. */
export const GENERAL_RULE_KEYS = ["serving", "tiebreak"] as const;

/** Per-scheme steps, in the order the day actually runs. */
export const SCHEME_RULE_KEYS: Record<string, readonly string[]> = {
  roundRobin: ["roundRobin.step1", "roundRobin.step2", "roundRobin.step3"],
  groupsPlayoff: [
    "groupsPlayoff.step1",
    "groupsPlayoff.step2",
    "groupsPlayoff.step3",
    "groupsPlayoff.step4",
  ],
  fullRotation: [
    "fullRotation.step1",
    "fullRotation.step2",
    "fullRotation.step3",
    "fullRotation.step4",
    "fullRotation.step5",
  ],
};

/**
 * Every rule this scheme can show, hidden ones included — the order the config form lists its
 * checkboxes in. An unknown scheme falls back to round robin, matching the API.
 */
export function ruleKeysForScheme(scheme: string): readonly string[] {
  return [...(SCHEME_RULE_KEYS[scheme] ?? SCHEME_RULE_KEYS.roundRobin), ...GENERAL_RULE_KEYS];
}

/**
 * What the Rules tab renders. Exclusions are stored rather than inclusions, so a rule added in a
 * later release shows up on tournaments configured before it existed.
 */
export function visibleRuleKeys(scheme: string, hiddenRules: string[] | undefined): string[] {
  const hidden = new Set(hiddenRules ?? []);
  return ruleKeysForScheme(scheme).filter((key) => !hidden.has(key));
}

/** The numbered steps of the format, separated from the house rules the tab renders as own cards. */
export function isSchemeStep(key: string): boolean {
  return !GENERAL_RULE_KEYS.includes(key as (typeof GENERAL_RULE_KEYS)[number]);
}

/** The translation key holding a rule's wording. */
export function ruleTranslationKey(key: string): string {
  return `ongoing.rules.${key}`;
}
