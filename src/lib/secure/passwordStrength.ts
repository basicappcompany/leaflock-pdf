export type Strength = 'weak' | 'fair' | 'strong';

/** A rough guide, not a guarantee: length matters most, variety helps. */
export function passwordStrength(password: string): Strength {
  if (password.length < 8) return 'weak';
  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z\d]/].filter((pattern) => pattern.test(password)).length;
  if (password.length >= 16 || (password.length >= 12 && classes >= 3)) return 'strong';
  return 'fair';
}
