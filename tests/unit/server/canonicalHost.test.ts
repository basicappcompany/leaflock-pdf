import { describe, expect, it } from 'vitest';
import { CANONICAL_HOST, canonicalRedirect } from '../../../src/lib/server/canonicalHost';

describe('canonicalRedirect', () => {
  it('serves the apex as-is', () => {
    expect(canonicalRedirect(`https://${CANONICAL_HOST}/api/auth/me`)).toBeNull();
  });

  it('serves localhost for wrangler pages dev', () => {
    expect(canonicalRedirect('http://localhost:8788/api/auth/me')).toBeNull();
    expect(canonicalRedirect('http://127.0.0.1:8788/api/usage/today')).toBeNull();
  });

  it('sends pages.dev, preview and www hosts to the apex, keeping path and query', () => {
    for (const host of ['leaflock-pdf.pages.dev', 'abc123.leaflock-pdf.pages.dev', `www.${CANONICAL_HOST}`]) {
      expect(canonicalRedirect(`https://${host}/api/auth/verify?token=x&y=1`)).toBe(
        `https://${CANONICAL_HOST}/api/auth/verify?token=x&y=1`,
      );
    }
  });

  it('does not treat a lookalike host as the apex', () => {
    expect(canonicalRedirect(`https://${CANONICAL_HOST}.evil.example/api/auth/me`)).not.toBeNull();
  });
});
