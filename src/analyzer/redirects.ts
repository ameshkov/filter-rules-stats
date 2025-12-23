import { RuleCategory, type AnyRule } from '@adguard/agtree';
import type { RedirectStats } from '../types/index.js';

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

const REDIRECT_MODIFIERS = ['redirect', 'redirect-rule', 'rewrite'];

function extractRedirectResource(ast: AnyRule): string | null {
  if (ast.category !== RuleCategory.Network) {
    return null;
  }

  const rule = ast as unknown as NetworkRuleWithModifiers;
  if (!rule.modifiers?.children) {
    return null;
  }

  for (const mod of rule.modifiers.children) {
    const modName = mod.name?.value;
    if (modName && REDIRECT_MODIFIERS.includes(modName)) {
      return mod.value?.value || 'unknown';
    }
  }

  return null;
}

export function createEmptyRedirectStats(): RedirectStats {
  return {
    total: 0,
    byResource: {},
  };
}

export function analyzeRedirects(asts: (AnyRule | null)[]): RedirectStats {
  const stats = createEmptyRedirectStats();

  for (const ast of asts) {
    if (ast === null) continue;

    const resource = extractRedirectResource(ast);
    if (resource) {
      stats.total++;
      stats.byResource[resource] = (stats.byResource[resource] || 0) + 1;
    }
  }

  return stats;
}
