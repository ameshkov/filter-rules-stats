import { RuleCategory, type AnyRule } from '@adguard/agtree';
import type { NetworkPatternStats, NetworkPatternCounts } from '../types/index.js';

function createEmptyPatternCounts(): NetworkPatternCounts {
  return {
    domainOnly: 0,
    domainPath: 0,
    regex: 0,
    urlPart: 0,
  };
}

export function createEmptyNetworkPatternStats(): NetworkPatternStats {
  return {
    blocking: createEmptyPatternCounts(),
    exception: createEmptyPatternCounts(),
  };
}

/**
 * Classifies a network rule pattern into one of four categories:
 * - domainOnly: ||example.org^ (starts with || and ends with ^ or has no path)
 * - domainPath: ||example.org/somepath (starts with || and has a path)
 * - regex: /regex/ (starts and ends with /)
 * - urlPart: everything else (does not start with ||)
 */
function classifyNetworkPattern(pattern: string): keyof NetworkPatternCounts {
  const trimmed = pattern.trim();

  // Regex pattern: starts and ends with /
  if (trimmed.startsWith('/') && trimmed.endsWith('/') && trimmed.length > 2) {
    return 'regex';
  }

  // Domain-based patterns start with ||
  if (trimmed.startsWith('||')) {
    const afterPrefix = trimmed.slice(2);

    // Find where the domain ends (at ^, /, $, or end of string)
    const domainEndChars = ['^', '/', '$'];
    let domainEndIndex = afterPrefix.length;

    for (const char of domainEndChars) {
      const idx = afterPrefix.indexOf(char);
      if (idx !== -1 && idx < domainEndIndex) {
        domainEndIndex = idx;
      }
    }

    const afterDomain = afterPrefix.slice(domainEndIndex);

    // Check if there's a path after the domain
    // domainOnly: ends with ^ or nothing after domain, or only has $ modifiers
    // domainPath: has / after domain indicating a path

    if (afterDomain.startsWith('/')) {
      return 'domainPath';
    }

    // If it ends with ^ or ^$ or just has modifiers ($...), it's domain only
    return 'domainOnly';
  }

  // Everything else is a URL part pattern
  return 'urlPart';
}

export function analyzeNetworkPatterns(asts: (AnyRule | null)[]): NetworkPatternStats {
  const stats = createEmptyNetworkPatternStats();

  for (const ast of asts) {
    if (!ast || ast.category !== RuleCategory.Network) {
      continue;
    }

    const networkRule = ast as { pattern?: { value?: string }; exception?: boolean };
    const pattern = networkRule.pattern?.value;

    if (pattern && typeof pattern === 'string') {
      const category = classifyNetworkPattern(pattern);
      const target = networkRule.exception ? stats.exception : stats.blocking;
      target[category]++;
    }
  }

  return stats;
}
