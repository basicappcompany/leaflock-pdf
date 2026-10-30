/**
 * Salted SHA-256 of a requester's IP address. The raw address is never stored or
 * logged anywhere (see functions/api/errors.ts and privacy.md); only this hash is,
 * and only to count requests per visitor.
 */
export async function hashIp(ip: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${ip}`));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
