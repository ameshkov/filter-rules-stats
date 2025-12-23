import type { DownloadResult } from '../types/index.js';

const DEFAULT_TIMEOUT = 30000;
const DEFAULT_RETRIES = 3;
const RETRY_DELAY_BASE = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function downloadUrl(
  url: string,
  timeout: number = DEFAULT_TIMEOUT,
  retries: number = DEFAULT_RETRIES
): Promise<DownloadResult> {
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'filter-rules-stats/1.0.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      return { url, content, error: null };
    } catch (err) {
      const error = err as Error;
      lastError = error.name === 'AbortError' ? 'Request timed out' : error.message;

      if (attempt < retries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  return { url, content: null, error: lastError };
}

export async function downloadGroup(
  urls: string[],
  concurrencyLimit: number = 5
): Promise<DownloadResult[]> {
  const results: DownloadResult[] = [];
  const queue = [...urls];

  async function worker(): Promise<void> {
    while (queue.length > 0) {
      const url = queue.shift();
      if (url) {
        const result = await downloadUrl(url);
        results.push(result);
      }
    }
  }

  const workers = Array(Math.min(concurrencyLimit, urls.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

export function mergeAndDeduplicate(contents: string[]): string[] {
  const seen = new Set<string>();
  const rules: string[] = [];

  for (const content of contents) {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        rules.push(trimmed);
      }
    }
  }

  return rules;
}
