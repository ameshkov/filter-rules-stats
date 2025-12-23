import { RuleCategory, type AnyRule, type AnyCommentRule, CosmeticRuleSeparatorUtils } from '@adguard/agtree';
import type { RuleTypeCounts } from '../types/index.js';

export function createEmptyRuleTypeCounts(): RuleTypeCounts {
  return {
    network: { blocking: 0, exception: 0 },
    cosmetic: {
      elementHiding: 0,
      elementHidingException: 0,
      cssInjection: 0,
      cssInjectionException: 0,
    },
    scriptlet: { rules: 0, exceptions: 0 },
    script: { rules: 0, exceptions: 0 },
    htmlFiltering: { rules: 0, exceptions: 0 },
    comments: 0,
    preprocessor: 0,
    invalid: 0,
  };
}

function isExceptionSeparator(separator: string): boolean {
  return separator.includes('@');
}

export function categorizeRule(ast: AnyRule, counts: RuleTypeCounts): void {
  if (!ast || typeof ast !== 'object') {
    counts.invalid++;
    return;
  }

  const category = ast.category;

  switch (category) {
    case RuleCategory.Network: {
      const networkRule = ast as { exception?: boolean };
      if (networkRule.exception) {
        counts.network.exception++;
      } else {
        counts.network.blocking++;
      }
      break;
    }

    case RuleCategory.Cosmetic: {
      const cosmeticRule = ast as { type: string; separator: { value: string } };
      const ruleType = cosmeticRule.type;
      const separator = cosmeticRule.separator?.value || '';
      const isExc = isExceptionSeparator(separator);

      switch (ruleType) {
        case 'ElementHidingRule':
          if (isExc) {
            counts.cosmetic.elementHidingException++;
          } else {
            counts.cosmetic.elementHiding++;
          }
          break;
        case 'CssInjectionRule':
          if (isExc) {
            counts.cosmetic.cssInjectionException++;
          } else {
            counts.cosmetic.cssInjection++;
          }
          break;
        case 'ScriptletInjectionRule':
          if (isExc) {
            counts.scriptlet.exceptions++;
          } else {
            counts.scriptlet.rules++;
          }
          break;
        case 'HtmlFilteringRule':
          if (isExc) {
            counts.htmlFiltering.exceptions++;
          } else {
            counts.htmlFiltering.rules++;
          }
          break;
        case 'JsInjectionRule':
          if (isExc) {
            counts.script.exceptions++;
          } else {
            counts.script.rules++;
          }
          break;
        default:
          if (isExc) {
            counts.cosmetic.elementHidingException++;
          } else {
            counts.cosmetic.elementHiding++;
          }
      }
      break;
    }

    case RuleCategory.Comment: {
      const commentRule = ast as AnyCommentRule;
      if (commentRule.type === 'PreProcessorCommentRule') {
        counts.preprocessor++;
      } else {
        counts.comments++;
      }
      break;
    }

    case RuleCategory.Invalid:
      counts.invalid++;
      break;

    default:
      counts.invalid++;
  }
}

export function countRuleTypes(asts: (AnyRule | null)[]): RuleTypeCounts {
  const counts = createEmptyRuleTypeCounts();

  for (const ast of asts) {
    if (ast === null) {
      counts.invalid++;
    } else {
      categorizeRule(ast, counts);
    }
  }

  return counts;
}
