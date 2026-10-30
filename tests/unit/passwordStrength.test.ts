import { describe, expect, it } from 'vitest';
import { passwordStrength } from '../../src/lib/secure/passwordStrength';

describe('passwordStrength', () => {
  it('rates short passwords weak', () => {
    expect(passwordStrength('abc12!')).toBe('weak');
  });
  it('rates medium passwords fair', () => {
    expect(passwordStrength('lowercase')).toBe('fair');
    expect(passwordStrength('Abcdef12')).toBe('fair');
  });
  it('rates long or varied passwords strong', () => {
    expect(passwordStrength('correct horse battery')).toBe('strong');
    expect(passwordStrength('Tr0ub4dor&3x')).toBe('strong');
  });
});
