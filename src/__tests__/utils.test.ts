import { generatePickupCode, getPhoneLast4, normalizePhoneToE164 } from '@/lib/utils';

describe('Pickup Code Generation', () => {
  test('should generate 3-letter uppercase code', () => {
    const code = generatePickupCode();
    expect(code).toHaveLength(3);
    expect(/^[A-Z]+$/.test(code)).toBe(true);
    // No confusing characters
    expect(code).not.toMatch(/[OIL]/);
  });

  test('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generatePickupCode());
    }
    // Should have generated mostly unique codes (allow for collisions in random generation)
    expect(codes.size).toBeGreaterThan(95);
  });
});

describe('Phone Utilities', () => {
  test('should extract last 4 digits from E.164 format', () => {
    expect(getPhoneLast4('+15551234567')).toBe('4567');
    expect(getPhoneLast4('+1 (555) 123-4567')).toBe('4567');
  });

  test('should normalize 10-digit US number to E.164', () => {
    expect(normalizePhoneToE164('5551234567')).toBe('+15551234567');
  });

  test('should normalize 11-digit US number starting with 1 to E.164', () => {
    expect(normalizePhoneToE164('15551234567')).toBe('+15551234567');
  });

  test('should handle formatted input', () => {
    expect(normalizePhoneToE164('(555) 123-4567')).toBe('+15551234567');
  });
});
