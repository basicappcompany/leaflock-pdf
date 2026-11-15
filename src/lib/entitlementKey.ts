/**
 * The public half of the entitlement signing key (Ed25519, SPKI, base64). Public by design: it can only check
 * a signature. The private half is the `ENTITLEMENT_PRIVATE_KEY` secret on the site and is never in the repo.
 *
 * To rotate: generate a new pair, change this value and the secret together, and deploy. Tokens signed with the
 * old key stop verifying, which is the intent: they last at most 48 hours and the next online run issues a new one.
 */
export const ENTITLEMENT_PUBLIC_KEY_SPKI = 'MCowBQYDK2VwAyEAQzlYNes4zApUefnPA+suBf1H31NC6FqT66gVpLNdf4w=';
