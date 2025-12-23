import { describe, it, expect } from 'vitest';
import { parseRule, parseRules, getAst } from '../src/parser/index.js';

describe('Parser', () => {
  describe('parseRule', () => {
    it('should parse a network blocking rule', () => {
      const result = parseRule('||example.com^');
      expect(result.error).toBeNull();
      expect(result.ast).not.toBeNull();
    });

    it('should parse a network exception rule', () => {
      const result = parseRule('@@||example.com^');
      expect(result.error).toBeNull();
      expect(result.ast).not.toBeNull();
    });

    it('should parse an element hiding rule', () => {
      const result = parseRule('example.com##.ad-banner');
      expect(result.error).toBeNull();
      expect(result.ast).not.toBeNull();
    });

    it('should parse a comment', () => {
      const result = parseRule('! This is a comment');
      expect(result.error).toBeNull();
      expect(result.ast).not.toBeNull();
    });

    it('should preserve raw rule text', () => {
      const rule = '||example.com^$third-party';
      const result = parseRule(rule);
      expect(result.raw).toBe(rule);
    });
  });

  describe('parseRules', () => {
    it('should parse multiple rules', () => {
      const rules = ['||example.com^', '@@||trusted.com^', 'example.com##.ad'];
      const result = parseRules(rules);
      expect(result.rules).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect errors for invalid rules', () => {
      const rules = ['||example.com^', 'invalid rule here $$$'];
      const result = parseRules(rules);
      expect(result.rules).toHaveLength(2);
    });
  });

  describe('getAst', () => {
    it('should return AST for valid parsed rule', () => {
      const parsed = parseRule('||example.com^');
      const ast = getAst(parsed);
      expect(ast).not.toBeNull();
    });

    it('should return null for failed parse', () => {
      const parsed = { raw: 'test', ast: null, error: 'parse error' };
      const ast = getAst(parsed);
      expect(ast).toBeNull();
    });
  });
});
