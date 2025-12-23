import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { Config, FilterGroup } from './schema.js';

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function validateGroup(group: unknown, index: number): FilterGroup {
  if (typeof group !== 'object' || group === null) {
    throw new ConfigError(`groups[${index}] must be an object`);
  }

  const g = group as Record<string, unknown>;

  if (typeof g.name !== 'string' || g.name.trim() === '') {
    throw new ConfigError(`groups[${index}].name must be a non-empty string`);
  }

  if (!Array.isArray(g.urls) || g.urls.length === 0) {
    throw new ConfigError(`groups[${index}].urls must be a non-empty array`);
  }

  for (let i = 0; i < g.urls.length; i++) {
    const url = g.urls[i];
    if (typeof url !== 'string') {
      throw new ConfigError(`groups[${index}].urls[${i}] must be a string`);
    }
    if (!isValidUrl(url)) {
      throw new ConfigError(`groups[${index}].urls[${i}] is not a valid HTTP/HTTPS URL: ${url}`);
    }
  }

  return {
    name: g.name.trim(),
    urls: g.urls as string[],
  };
}

function validateConfig(data: unknown): Config {
  if (typeof data !== 'object' || data === null) {
    throw new ConfigError('Configuration must be an object');
  }

  const config = data as Record<string, unknown>;

  if (!Array.isArray(config.groups)) {
    throw new ConfigError('Configuration must have a "groups" array');
  }

  if (config.groups.length === 0) {
    throw new ConfigError('"groups" array must not be empty');
  }

  const groups: FilterGroup[] = [];
  for (let i = 0; i < config.groups.length; i++) {
    groups.push(validateGroup(config.groups[i], i));
  }

  return { groups };
}

export async function loadConfig(configPath: string): Promise<Config> {
  let content: string;
  try {
    content = await readFile(configPath, 'utf-8');
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === 'ENOENT') {
      throw new ConfigError(`Configuration file not found: ${configPath}`);
    }
    throw new ConfigError(`Failed to read configuration file: ${error.message}`);
  }

  let data: unknown;
  try {
    data = parseYaml(content);
  } catch (err) {
    const error = err as Error;
    throw new ConfigError(`Failed to parse YAML: ${error.message}`);
  }

  return validateConfig(data);
}
