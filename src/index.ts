#!/usr/bin/env node

import { Command } from 'commander';
import { join } from 'node:path';
import { loadConfig, ConfigError } from './config/loader.js';
import { downloadGroup, mergeAndDeduplicate } from './downloader/index.js';
import { parseRules } from './parser/index.js';
import { analyzeGroup } from './analyzer/index.js';
import { writeJsonOutput } from './output/json.js';
import { writeHtmlOutput } from './output/html.js';
import type { Statistics, GroupStatistics, LogLevel } from './types/index.js';

let verboseMode = false;

function log(level: LogLevel, message: string): void {
  const timestamp = new Date().toISOString();

  switch (level) {
    case 'error':
      console.error(`[${timestamp}] ERROR: ${message}`);
      break;
    case 'warn':
      console.error(`[${timestamp}] WARN: ${message}`);
      break;
    case 'info':
      console.log(`[${timestamp}] INFO: ${message}`);
      break;
    case 'debug':
      if (verboseMode) {
        console.log(`[${timestamp}] DEBUG: ${message}`);
      }
      break;
  }
}

async function processGroup(name: string, urls: string[]): Promise<GroupStatistics> {
  log('info', `Processing group: ${name}`);
  log('debug', `URLs: ${urls.join(', ')}`);

  log('info', `Downloading ${urls.length} filter list(s)...`);
  const downloadResults = await downloadGroup(urls);

  const successfulContents: string[] = [];
  const downloadErrors: string[] = [];

  for (const result of downloadResults) {
    if (result.content) {
      successfulContents.push(result.content);
      log('debug', `Downloaded: ${result.url}`);
    } else {
      downloadErrors.push(`Failed to download ${result.url}: ${result.error}`);
      log('warn', `Failed to download ${result.url}: ${result.error}`);
    }
  }

  if (successfulContents.length === 0) {
    log('error', `No filter lists downloaded for group: ${name}`);
    return {
      name,
      totalRules: 0,
      ruleTypes: {
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
      },
      modifiers: {},
      scriptlets: { total: 0, byName: {}, bySyntax: { adguard: 0, ublock: 0, abp: 0 } },
      redirects: { total: 0, byResource: {} },
      errors: downloadErrors,
    };
  }

  log('info', 'Merging and deduplicating rules...');
  const rules = mergeAndDeduplicate(successfulContents);
  log('info', `Total unique rules: ${rules.length}`);

  log('info', 'Parsing rules...');
  const parseResult = parseRules(rules);
  log('debug', `Parse errors: ${parseResult.errors.length}`);

  log('info', 'Analyzing statistics...');
  const stats = analyzeGroup(name, parseResult.rules, [
    ...downloadErrors,
    ...parseResult.errors,
  ]);

  log('info', `Completed group: ${name}`);
  return stats;
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('filter-rules-stats')
    .description('Analyze ad-blocking filter lists and generate statistical reports')
    .version('1.0.0')
    .option('-c, --config <path>', 'Path to configuration file', 'config.yaml')
    .option('-o, --output <dir>', 'Output directory', './output')
    .option('--json-only', 'Generate only JSON output')
    .option('--html-only', 'Generate only HTML output')
    .option('-v, --verbose', 'Enable verbose logging');

  program.parse();

  const options = program.opts<{
    config: string;
    output: string;
    jsonOnly?: boolean;
    htmlOnly?: boolean;
    verbose?: boolean;
  }>();

  verboseMode = options.verbose ?? false;

  log('info', 'Filter Rules Statistics Tool v1.0.0');
  log('debug', `Config: ${options.config}`);
  log('debug', `Output: ${options.output}`);

  let config;
  try {
    config = await loadConfig(options.config);
    log('info', `Loaded configuration with ${config.groups.length} group(s)`);
  } catch (err) {
    if (err instanceof ConfigError) {
      log('error', err.message);
      process.exit(1);
    }
    throw err;
  }

  const groupStats: GroupStatistics[] = [];

  for (const group of config.groups) {
    try {
      const stats = await processGroup(group.name, group.urls);
      groupStats.push(stats);
    } catch (err) {
      const error = err as Error;
      log('error', `Failed to process group "${group.name}": ${error.message}`);
    }
  }

  const statistics: Statistics = {
    generatedAt: new Date().toISOString(),
    groups: groupStats,
  };

  if (!options.htmlOnly) {
    const jsonPath = join(options.output, 'stats.json');
    log('info', `Writing JSON output to ${jsonPath}`);
    await writeJsonOutput(statistics, jsonPath);
  }

  if (!options.jsonOnly) {
    const htmlPath = join(options.output, 'index.html');
    log('info', `Writing HTML report to ${htmlPath}`);
    await writeHtmlOutput(statistics, htmlPath);
  }

  log('info', 'Analysis complete!');

  const totalRules = groupStats.reduce((sum, g) => sum + g.totalRules, 0);
  log('info', `Total rules analyzed: ${totalRules.toLocaleString()}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
