import { RuleCategory, type AnyRule } from '@adguard/agtree';
import type { ScriptletStats } from '../types/index.js';

type ScriptletSyntax = 'adguard' | 'ublock' | 'abp';

interface ParameterList {
  children: Array<{
    value: string;
  }>;
}

interface ScriptletRuleBody {
  children: ParameterList[];
}

interface ScriptletRule {
  type: string;
  syntax: string;
  body: ScriptletRuleBody;
}

function detectSyntax(syntax: string): ScriptletSyntax {
  if (syntax === 'AdGuard') {
    return 'adguard';
  }
  if (syntax === 'AdblockPlus') {
    return 'abp';
  }
  return 'ublock';
}

function extractScriptletName(ast: AnyRule): { name: string; syntax: ScriptletSyntax } | null {
  if (ast.category !== RuleCategory.Cosmetic) {
    return null;
  }

  const rule = ast as unknown as ScriptletRule;

  if (rule.type !== 'ScriptletInjectionRule') {
    return null;
  }

  const syntaxType = rule.syntax || '';
  const syntax = detectSyntax(syntaxType);

  const body = rule.body;
  if (!body?.children || body.children.length === 0) {
    return null;
  }

  const paramList = body.children[0];
  if (!paramList?.children || paramList.children.length === 0) {
    return null;
  }

  const rawName = paramList.children[0]?.value || 'unknown';
  const name = rawName.replace(/^['"]|['"]$/g, '');

  return { name, syntax };
}

export function createEmptyScriptletStats(): ScriptletStats {
  return {
    total: 0,
    byName: {},
    bySyntax: { adguard: 0, ublock: 0, abp: 0 },
  };
}

export function analyzeScriptlets(asts: (AnyRule | null)[]): ScriptletStats {
  const stats = createEmptyScriptletStats();

  for (const ast of asts) {
    if (ast === null) continue;

    const result = extractScriptletName(ast);
    if (result) {
      stats.total++;
      stats.byName[result.name] = (stats.byName[result.name] || 0) + 1;
      stats.bySyntax[result.syntax]++;
    }
  }

  return stats;
}
