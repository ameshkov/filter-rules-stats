import { RuleCategory, type AnyRule } from '@adguard/agtree';

interface ModifierNode {
  name: {
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

export function extractModifiers(ast: AnyRule): string[] {
  const modifiers: string[] = [];

  if (ast.category === RuleCategory.Network) {
    const networkRule = ast as unknown as NetworkRuleWithModifiers;
    if (networkRule.modifiers?.children) {
      for (const mod of networkRule.modifiers.children) {
        if (mod.name?.value) {
          modifiers.push(mod.name.value);
        }
      }
    }
  } else if (ast.category === RuleCategory.Cosmetic) {
    const cosmeticRule = ast as unknown as CosmeticRuleWithModifiers;
    if (cosmeticRule.modifiers?.children) {
      for (const mod of cosmeticRule.modifiers.children) {
        if (mod.name?.value) {
          modifiers.push(mod.name.value);
        }
      }
    }
  }

  return modifiers;
}

export function countModifiers(asts: (AnyRule | null)[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const ast of asts) {
    if (ast === null) continue;

    const modifiers = extractModifiers(ast);
    for (const modifier of modifiers) {
      counts[modifier] = (counts[modifier] || 0) + 1;
    }
  }

  return counts;
}
