import { RuleParser, type AnyRule } from '@adguard/agtree';
import type { ParsedRule, ParseResult } from '../types/index.js';

export function parseRule(ruleText: string): ParsedRule {
  try {
    const ast = RuleParser.parse(ruleText);
    return { raw: ruleText, ast, error: null };
  } catch (err) {
    const error = err as Error;
    return { raw: ruleText, ast: null, error: error.message };
  }
}

export function parseRules(ruleTexts: string[]): ParseResult {
  const rules: ParsedRule[] = [];
  const errors: string[] = [];

  for (const ruleText of ruleTexts) {
    const parsed = parseRule(ruleText);
    rules.push(parsed);
    if (parsed.error) {
      errors.push(`Failed to parse "${ruleText}": ${parsed.error}`);
    }
  }

  return { rules, errors };
}

export function getAst(parsed: ParsedRule): AnyRule | null {
  return parsed.ast as AnyRule | null;
}
