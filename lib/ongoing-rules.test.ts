import { describe, expect, it } from 'vitest'
import { isSchemeStep, ruleKeysForScheme, ruleTranslationKey, visibleRuleKeys } from './ongoing-rules'

describe('ruleKeysForScheme', () => {
  it('lists a scheme its own steps, then the house rules', () => {
    expect(ruleKeysForScheme('roundRobin')).toEqual([
      'roundRobin.step1',
      'roundRobin.step2',
      'roundRobin.step3',
      'serving',
      'tiebreak',
    ])
  })

  it('gives fullRotation five steps', () => {
    expect(ruleKeysForScheme('fullRotation')).toHaveLength(7)
  })

  // A config row written by another version can name a scheme this build does not know; the API
  // falls back the same way, so both show round robin rather than an empty tab.
  it('falls back to roundRobin for an unknown scheme', () => {
    expect(ruleKeysForScheme('mystery')).toEqual(ruleKeysForScheme('roundRobin'))
  })
})

describe('visibleRuleKeys', () => {
  it('shows every rule when nothing is hidden', () => {
    expect(visibleRuleKeys('roundRobin', [])).toEqual(ruleKeysForScheme('roundRobin'))
    expect(visibleRuleKeys('roundRobin', undefined)).toEqual(ruleKeysForScheme('roundRobin'))
  })

  it('drops the keys the organiser switched off, keeping the rest in order', () => {
    expect(visibleRuleKeys('roundRobin', ['roundRobin.step2', 'serving'])).toEqual([
      'roundRobin.step1',
      'roundRobin.step3',
      'tiebreak',
    ])
  })

  // Storing exclusions is what makes this work: a rule shipped after the event was configured is
  // not in the stored list, so it appears rather than staying invisible forever.
  it('shows a rule the stored list could not have known about', () => {
    expect(visibleRuleKeys('roundRobin', ['fullRotation.step1'])).toEqual(ruleKeysForScheme('roundRobin'))
  })

  it('ignores a hidden key belonging to another scheme', () => {
    expect(visibleRuleKeys('fullRotation', ['roundRobin.step1'])).toEqual(ruleKeysForScheme('fullRotation'))
  })

  it('can hide everything', () => {
    expect(visibleRuleKeys('roundRobin', [...ruleKeysForScheme('roundRobin')])).toEqual([])
  })
})

describe('isSchemeStep', () => {
  it('separates the numbered steps from the house rules', () => {
    expect(isSchemeStep('roundRobin.step1')).toBe(true)
    expect(isSchemeStep('serving')).toBe(false)
    expect(isSchemeStep('tiebreak')).toBe(false)
  })
})

describe('ruleTranslationKey', () => {
  it('namespaces a key into the locale files', () => {
    expect(ruleTranslationKey('serving')).toBe('ongoing.rules.serving')
    expect(ruleTranslationKey('roundRobin.step1')).toBe('ongoing.rules.roundRobin.step1')
  })
})
