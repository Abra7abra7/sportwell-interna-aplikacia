import { describe, it, expect } from 'vitest';
import { formatPhone, formatName, formatAddress } from './validation';

describe('validation utils', () => {
  describe('formatPhone', () => {
    it('formats numbers starting with 09 to +421', () => {
      expect(formatPhone('0901234567')).toBe('+421 901 234 567');
    });

    it('formats numbers starting with 02 to +421', () => {
      expect(formatPhone('02123456')).toBe('+421 212 345 6');
    });

    it('formats existing +421 numbers correctly', () => {
      expect(formatPhone('+421905111222')).toBe('+421 905 111 222');
    });
    
    it('handles empty strings', () => {
      expect(formatPhone('')).toBe('');
    });
  });

  describe('formatName', () => {
    it('capitalizes the first letter of each word and lowercases the rest', () => {
      expect(formatName('jOZEF mRKVICKA')).toBe('Jozef Mrkvicka');
    });

    it('handles multiple spaces between words', () => {
      expect(formatName('Jan    Novak')).toBe('Jan Novak');
    });
  });

  describe('formatAddress', () => {
    it('formats postal codes with a space', () => {
      expect(formatAddress('Hlavna 12, 85101 Bratislava')).toBe('Hlavna 12, 851 01 Bratislava');
    });

    it('removes double spaces', () => {
      expect(formatAddress('Hlavna 12,   85101  Bratislava')).toBe('Hlavna 12, 851 01 Bratislava');
    });
  });
});
