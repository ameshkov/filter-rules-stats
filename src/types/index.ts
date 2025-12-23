export interface FilterGroup {
  name: string;
  urls: string[];
}

export interface Config {
  groups: FilterGroup[];
}

export interface RuleTypeCounts {
  network: {
    blocking: number;
    exception: number;
  };
  cosmetic: {
    elementHiding: number;
    elementHidingException: number;
    cssInjection: number;
    cssInjectionException: number;
  };
  scriptlet: {
    rules: number;
    exceptions: number;
  };
  script: {
    rules: number;
    exceptions: number;
  };
  htmlFiltering: {
    rules: number;
    exceptions: number;
  };
  comments: number;
  preprocessor: number;
  invalid: number;
}

export interface ScriptletStats {
  total: number;
  byName: Record<string, number>;
  bySyntax: {
    adguard: number;
    ublock: number;
    abp: number;
  };
}

export interface RedirectStats {
  total: number;
  byResource: Record<string, number>;
}

export interface GroupStatistics {
  name: string;
  totalRules: number;
  ruleTypes: RuleTypeCounts;
  modifiers: Record<string, number>;
  scriptlets: ScriptletStats;
  redirects: RedirectStats;
  errors: string[];
}

export interface Statistics {
  generatedAt: string;
  groups: GroupStatistics[];
}

export interface DownloadResult {
  url: string;
  content: string | null;
  error: string | null;
}

export interface ParsedRule {
  raw: string;
  ast: unknown;
  error: string | null;
}

export interface ParseResult {
  rules: ParsedRule[];
  errors: string[];
}

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
