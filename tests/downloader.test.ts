import { describe, it, expect } from 'vitest';
import { mergeAndDeduplicate } from '../src/downloader/index.js';

describe('Downloader', () => {
  describe('mergeAndDeduplicate', () => {
    it('should merge multiple content strings', () => {
      const contents = ['rule1\nrule2', 'rule3\nrule4'];
      const result = mergeAndDeduplicate(contents);
      expect(result).toEqual(['rule1', 'rule2', 'rule3', 'rule4']);
    });

    it('should deduplicate identical rules', () => {
      const contents = ['rule1\nrule2', 'rule2\nrule3'];
      const result = mergeAndDeduplicate(contents);
      expect(result).toEqual(['rule1', 'rule2', 'rule3']);
    });

    it('should preserve first occurrence order', () => {
      const contents = ['rule3\nrule1', 'rule2\nrule1'];
      const result = mergeAndDeduplicate(contents);
      expect(result).toEqual(['rule3', 'rule1', 'rule2']);
    });

    it('should handle empty lines', () => {
      const contents = ['rule1\n\nrule2\n'];
      const result = mergeAndDeduplicate(contents);
      expect(result).toEqual(['rule1', 'rule2']);
    });

    it('should trim whitespace', () => {
      const contents = ['  rule1  \n  rule2  '];
      const result = mergeAndDeduplicate(contents);
      expect(result).toEqual(['rule1', 'rule2']);
    });

    it('should handle Windows line endings', () => {
      const contents = ['rule1\r\nrule2\r\n'];
      const result = mergeAndDeduplicate(contents);
      expect(result).toEqual(['rule1', 'rule2']);
    });

    it('should return empty array for empty input', () => {
      const result = mergeAndDeduplicate([]);
      expect(result).toEqual([]);
    });
  });
});
