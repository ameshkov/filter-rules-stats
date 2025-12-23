import type { AnyRule } from '@adguard/agtree';
import type { GroupStatistics, ParsedRule } from '../types/index.js';
import { countRuleTypes } from './rule-types.js';
import { countModifiers } from './modifiers.js';
import { analyzeScriptlets } from './scriptlets.js';
import { analyzeRedirects } from './redirects.js';

export function analyzeGroup(
  name: string,
  parsedRules: ParsedRule[],
  parseErrors: string[]
): GroupStatistics {
  const asts: (AnyRule | null)[] = parsedRules.map((r) => r.ast as AnyRule | null);

  const ruleTypes = countRuleTypes(asts);
  const modifiers = countModifiers(asts);
  const scriptlets = analyzeScriptlets(asts);
  const redirects = analyzeRedirects(asts);

  return {
    name,
    totalRules: parsedRules.length,
    ruleTypes,
    modifiers,
    scriptlets,
    redirects,
    errors: parseErrors,
  };
}

export { countRuleTypes } from './rule-types.js';
export { countModifiers } from './modifiers.js';
export { analyzeScriptlets } from './scriptlets.js';
export { analyzeRedirects } from './redirects.js';
