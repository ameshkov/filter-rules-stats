#!/usr/bin/env node

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Command } from 'commander';
import { generateHtml } from './output/html.js';
import type { Statistics } from './types/index.js';

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('build-html')
    .description('Build HTML report from a JSON statistics file')
    .version('1.0.0')
    .requiredOption('-i, --input <path>', 'Path to input JSON file')
    .option('-o, --output <path>', 'Path to output HTML file', 'index.html');

  program.parse();

  const options = program.opts<{
    input: string;
    output: string;
  }>();

  console.log(`Reading JSON from: ${options.input}`);

  let jsonContent: string;
  try {
    jsonContent = await readFile(options.input, 'utf-8');
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOENT') {
      console.error(`Error: Input file not found: ${options.input}`);
      process.exit(1);
    }
    throw err;
  }

  let stats: Statistics;
  try {
    stats = JSON.parse(jsonContent) as Statistics;
  } catch {
    console.error('Error: Invalid JSON format');
    process.exit(1);
  }

  if (!stats.generatedAt || !Array.isArray(stats.groups)) {
    console.error('Error: Invalid statistics format. Expected { generatedAt, groups[] }');
    process.exit(1);
  }

  console.log(`Found ${stats.groups.length} group(s) in statistics`);

  const html = generateHtml(stats);

  const dir = dirname(options.output);
  if (dir && dir !== '.') {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(options.output, html, 'utf-8');
  console.log(`HTML report written to: ${options.output}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
