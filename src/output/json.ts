import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Statistics } from '../types/index.js';

export async function writeJsonOutput(
  stats: Statistics,
  outputPath: string
): Promise<void> {
  const dir = dirname(outputPath);
  await mkdir(dir, { recursive: true });

  const json = JSON.stringify(stats, null, 2);
  await writeFile(outputPath, json, 'utf-8');
}
