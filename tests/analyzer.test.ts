import { describe, it, expect } from 'vitest';
import { parseRules } from '../src/parser/index.js';
import { countRuleTypes, countModifiers, analyzeScriptlets, analyzeRedirects } from '../src/analyzer/index.js';
import type { AnyRule } from '@adguard/agtree';

function parseToAsts(rules: string[]): (AnyRule | null)[] {
  const result = parseRules(rules);
  return result.rules.map((r) => r.ast as AnyRule | null);
}

describe('Analyzer', () => {
  describe('countRuleTypes', () => {
    it('should count network blocking rules', () => {
      const asts = parseToAsts(['||example.com^', '||test.com^']);
      const counts = countRuleTypes(asts);
      expect(counts.network.blocking).toBe(2);
    });

    it('should count network exception rules', () => {
      const asts = parseToAsts(['@@||example.com^']);
      const counts = countRuleTypes(asts);
      expect(counts.network.exception).toBe(1);
    });

    it('should count element hiding rules', () => {
      const asts = parseToAsts(['example.com##.ad', '##.banner']);
      const counts = countRuleTypes(asts);
      expect(counts.cosmetic.elementHiding).toBe(2);
    });

    it('should count element hiding exceptions', () => {
      const asts = parseToAsts(['example.com#@#.ad']);
      const counts = countRuleTypes(asts);
      expect(counts.cosmetic.elementHidingException).toBe(1);
    });

    it('should count comments', () => {
      const asts = parseToAsts(['! Comment 1', '! Comment 2']);
      const counts = countRuleTypes(asts);
      expect(counts.comments).toBe(2);
    });

    it('should count preprocessor directives', () => {
      const asts = parseToAsts(['!#if adguard', '!#endif']);
      const counts = countRuleTypes(asts);
      expect(counts.preprocessor).toBe(2);
    });

    it('should handle null ASTs as invalid', () => {
      const asts: (AnyRule | null)[] = [null, null];
      const counts = countRuleTypes(asts);
      expect(counts.invalid).toBe(2);
    });
  });

  describe('countModifiers', () => {
    it('should count modifiers in network rules', () => {
      const asts = parseToAsts([
        '||example.com^$third-party',
        '||test.com^$script,third-party',
      ]);
      const counts = countModifiers(asts);
      expect(counts['third-party']).toBe(2);
      expect(counts['script']).toBe(1);
    });

    it('should return empty object for rules without modifiers', () => {
      const asts = parseToAsts(['||example.com^']);
      const counts = countModifiers(asts);
      expect(Object.keys(counts).length).toBe(0);
    });
  });

  describe('analyzeScriptlets', () => {
    it('should count uBlock scriptlets', () => {
      const asts = parseToAsts(['example.com##+js(set-constant, foo, bar)']);
      const stats = analyzeScriptlets(asts);
      expect(stats.total).toBe(1);
      expect(stats.bySyntax.ublock).toBe(1);
    });

    it('should return empty stats for non-scriptlet rules', () => {
      const asts = parseToAsts(['||example.com^']);
      const stats = analyzeScriptlets(asts);
      expect(stats.total).toBe(0);
    });
  });

  describe('analyzeRedirects', () => {
    it('should count redirect rules', () => {
      const asts = parseToAsts(['||example.com^$redirect=noopjs']);
      const stats = analyzeRedirects(asts);
      expect(stats.total).toBe(1);
      expect(stats.byResource['noopjs']).toBe(1);
    });

    it('should return empty stats for non-redirect rules', () => {
      const asts = parseToAsts(['||example.com^']);
      const stats = analyzeRedirects(asts);
      expect(stats.total).toBe(0);
    });
  });
});
