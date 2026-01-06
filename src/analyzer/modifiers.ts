import { RuleCategory, type AnyRule } from '@adguard/agtree';
import type { DomainModifierStats, ModifierStats } from '../types/index.js';

interface ModifierNode {
  name: {
    value: string;
  };
  value?: {
    value: string;
  };
}

interface ModifierList {
  children: ModifierNode[];
}

interface NetworkRuleWithModifiers {
  modifiers?: ModifierList;
}

interface CosmeticRuleWithModifiers {
  modifiers?: ModifierList;
}

interface ExtractedModifier {
  name: string;
  value?: string;
}

const DOMAIN_MODIFIERS = new Set(['domain', 'to', 'from', 'denyallow']);

export function extractModifiers(ast: AnyRule): ExtractedModifier[] {
  const modifiers: ExtractedModifier[] = [];

  if (ast.category === RuleCategory.Network) {
    const networkRule = ast as unknown as NetworkRuleWithModifiers;
    if (networkRule.modifiers?.children) {
      for (const mod of networkRule.modifiers.children) {
        if (mod.name?.value) {
          modifiers.push({
            name: mod.name.value,
            value: mod.value?.value,
          });
        }
      }
    }
  } else if (ast.category === RuleCategory.Cosmetic) {
    const cosmeticRule = ast as unknown as CosmeticRuleWithModifiers;
    if (cosmeticRule.modifiers?.children) {
      for (const mod of cosmeticRule.modifiers.children) {
        if (mod.name?.value) {
          modifiers.push({
            name: mod.name.value,
            value: mod.value?.value,
          });
        }
      }
    }
  }

  return modifiers;
}

function classifyDomainValue(value: string): 'plain' | 'tld' | 'regex' {
  if (value.startsWith('/') && value.endsWith('/')) {
    return 'regex';
  }
  if (value.includes('.*')) {
    return 'tld';
  }
  return 'plain';
}

function analyzeDomainModifierValue(value: string): DomainModifierStats {
  const stats: DomainModifierStats = { plain: 0, tld: 0, regex: 0 };

  // Split by | to get individual domain entries
  const domains = value.split('|').map(d => d.trim()).filter(d => d.length > 0);

  for (const domain of domains) {
    // Remove leading ~ for exception domains
    const cleanDomain = domain.startsWith('~') ? domain.slice(1) : domain;
    const type = classifyDomainValue(cleanDomain);
    stats[type]++;
  }

  return stats;
}

export function countModifiers(asts: (AnyRule | null)[]): ModifierStats {
  const counts: Record<string, number> = {};
  const domainModifiers: Record<string, DomainModifierStats> = {};

  // Initialize domain modifier stats
  for (const modName of DOMAIN_MODIFIERS) {
    domainModifiers[modName] = { plain: 0, tld: 0, regex: 0 };
  }

  for (const ast of asts) {
    if (ast === null) continue;

    const modifiers = extractModifiers(ast);
    for (const modifier of modifiers) {
      counts[modifier.name] = (counts[modifier.name] || 0) + 1;

      // Analyze domain modifier values
      if (DOMAIN_MODIFIERS.has(modifier.name) && modifier.value) {
        const valueStats = analyzeDomainModifierValue(modifier.value);
        domainModifiers[modifier.name].plain += valueStats.plain;
        domainModifiers[modifier.name].tld += valueStats.tld;
        domainModifiers[modifier.name].regex += valueStats.regex;
      }
    }
  }

  return { counts, domainModifiers };
}
