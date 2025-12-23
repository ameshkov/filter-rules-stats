import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, unlink, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { loadConfig, ConfigError } from '../src/config/loader.js';

const TEST_DIR = join(process.cwd(), 'tests', 'fixtures');

describe('Configuration Loader', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should load valid configuration', async () => {
    const configPath = join(TEST_DIR, 'valid.yaml');
    await writeFile(
      configPath,
      `groups:
  - name: Test Group
    urls:
      - https://example.com/filter.txt
`
    );

    const config = await loadConfig(configPath);
    expect(config.groups).toHaveLength(1);
    expect(config.groups[0].name).toBe('Test Group');
    expect(config.groups[0].urls).toEqual(['https://example.com/filter.txt']);
  });

  it('should throw error for missing file', async () => {
    await expect(loadConfig('/nonexistent/path.yaml')).rejects.toThrow(ConfigError);
  });

  it('should throw error for empty groups array', async () => {
    const configPath = join(TEST_DIR, 'empty-groups.yaml');
    await writeFile(configPath, 'groups: []');

    await expect(loadConfig(configPath)).rejects.toThrow('"groups" array must not be empty');
  });

  it('should throw error for missing group name', async () => {
    const configPath = join(TEST_DIR, 'no-name.yaml');
    await writeFile(
      configPath,
      `groups:
  - urls:
      - https://example.com/filter.txt
`
    );

    await expect(loadConfig(configPath)).rejects.toThrow('name must be a non-empty string');
  });

  it('should throw error for empty urls array', async () => {
    const configPath = join(TEST_DIR, 'empty-urls.yaml');
    await writeFile(
      configPath,
      `groups:
  - name: Test
    urls: []
`
    );

    await expect(loadConfig(configPath)).rejects.toThrow('urls must be a non-empty array');
  });

  it('should throw error for invalid URL', async () => {
    const configPath = join(TEST_DIR, 'invalid-url.yaml');
    await writeFile(
      configPath,
      `groups:
  - name: Test
    urls:
      - not-a-valid-url
`
    );

    await expect(loadConfig(configPath)).rejects.toThrow('not a valid HTTP/HTTPS URL');
  });

  it('should handle multiple groups', async () => {
    const configPath = join(TEST_DIR, 'multiple.yaml');
    await writeFile(
      configPath,
      `groups:
  - name: Group 1
    urls:
      - https://example.com/filter1.txt
  - name: Group 2
    urls:
      - https://example.com/filter2.txt
      - https://example.com/filter3.txt
`
    );

    const config = await loadConfig(configPath);
    expect(config.groups).toHaveLength(2);
    expect(config.groups[1].urls).toHaveLength(2);
  });
});
