import { describe, it, expect } from 'vitest';
import { parseRules } from '../src/parser/index.js';
import { countRuleTypes, countModifiers, analyzeScriptlets, analyzeRedirects, analyzeNetworkPatterns } from '../src/analyzer/index.js';
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
      const stats = countModifiers(asts);
      expect(stats.counts['third-party']).toBe(2);
      expect(stats.counts['script']).toBe(1);
    });

    it('should return empty counts for rules without modifiers', () => {
      const asts = parseToAsts(['||example.com^']);
      const stats = countModifiers(asts);
      expect(Object.keys(stats.counts).length).toBe(0);
    });

    it('should track plain domain modifiers', () => {
      const asts = parseToAsts(['||example.com^$domain=test.com|other.org']);
      const stats = countModifiers(asts);
      expect(stats.domainModifiers['domain'].plain).toBe(2);
      expect(stats.domainModifiers['domain'].tld).toBe(0);
      expect(stats.domainModifiers['domain'].regex).toBe(0);
    });

    it('should track TLD domain modifiers', () => {
      const asts = parseToAsts(['||example.com^$domain=test.*|example.*']);
      const stats = countModifiers(asts);
      expect(stats.domainModifiers['domain'].plain).toBe(0);
      expect(stats.domainModifiers['domain'].tld).toBe(2);
      expect(stats.domainModifiers['domain'].regex).toBe(0);
    });

    it('should track regex domain modifiers', () => {
      const asts = parseToAsts(['||example.com^$domain=/test/|/pattern/']);
      const stats = countModifiers(asts);
      expect(stats.domainModifiers['domain'].plain).toBe(0);
      expect(stats.domainModifiers['domain'].tld).toBe(0);
      expect(stats.domainModifiers['domain'].regex).toBe(2);
    });

    it('should track mixed domain modifier types', () => {
      const asts = parseToAsts(['||example.com^$domain=plain.com|tld.*|/regex/']);
      const stats = countModifiers(asts);
      expect(stats.domainModifiers['domain'].plain).toBe(1);
      expect(stats.domainModifiers['domain'].tld).toBe(1);
      expect(stats.domainModifiers['domain'].regex).toBe(1);
    });

    it('should track $to modifier domain types', () => {
      const asts = parseToAsts(['||example.com^$to=test.*']);
      const stats = countModifiers(asts);
      expect(stats.domainModifiers['to'].tld).toBe(1);
    });

    it('should track $denyallow modifier domain types', () => {
      const asts = parseToAsts(['||example.com^$denyallow=test.com']);
      const stats = countModifiers(asts);
      expect(stats.domainModifiers['denyallow'].plain).toBe(1);
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

    it('should strip uBlock Origin redirect priority', () => {
      const asts = parseToAsts(['||example.com^$redirect=noopjs:42']);
      const stats = analyzeRedirects(asts);
      expect(stats.total).toBe(1);
      expect(stats.byResource['noopjs']).toBe(1);
      expect(stats.byResource['noopjs:42']).toBeUndefined();
    });
  });

  describe('analyzeNetworkPatterns', () => {
    it('should classify domain-only blocking patterns', () => {
      const asts = parseToAsts(['||example.org^', '||test.com^$third-party']);
      const stats = analyzeNetworkPatterns(asts);
      expect(stats.blocking.domainOnly).toBe(2);
    });

    it('should classify domain+path blocking patterns', () => {
      const asts = parseToAsts(['||example.org/somepath', '||test.com/ads/banner.js']);
      const stats = analyzeNetworkPatterns(asts);
      expect(stats.blocking.domainPath).toBe(2);
    });

    it('should classify regex blocking patterns', () => {
      const asts = parseToAsts(['/ads\\.js/', '/tracking[0-9]+/']);
      const stats = analyzeNetworkPatterns(asts);
      expect(stats.blocking.regex).toBe(2);
    });

    it('should classify URL part blocking patterns', () => {
      const asts = parseToAsts(['ads', 'banner.gif', '*tracking*']);
      const stats = analyzeNetworkPatterns(asts);
      expect(stats.blocking.urlPart).toBe(3);
    });

    it('should classify exception patterns separately', () => {
      const asts = parseToAsts([
        '@@||example.org^',
        '@@||test.com/path',
        '@@/regex/',
        '@@urlpart',
      ]);
      const stats = analyzeNetworkPatterns(asts);
      expect(stats.exception.domainOnly).toBe(1);
      expect(stats.exception.domainPath).toBe(1);
      expect(stats.exception.regex).toBe(1);
      expect(stats.exception.urlPart).toBe(1);
      expect(stats.blocking.domainOnly).toBe(0);
    });

    it('should handle mixed blocking and exception patterns', () => {
      const asts = parseToAsts([
        '||example.org^',
        '@@||example.org^',
      ]);
      const stats = analyzeNetworkPatterns(asts);
      expect(stats.blocking.domainOnly).toBe(1);
      expect(stats.exception.domainOnly).toBe(1);
    });

    it('should ignore non-network rules', () => {
      const asts = parseToAsts(['##.ad', '! comment']);
      const stats = analyzeNetworkPatterns(asts);
      expect(stats.blocking.domainOnly).toBe(0);
      expect(stats.exception.domainOnly).toBe(0);
    });
  });
});
