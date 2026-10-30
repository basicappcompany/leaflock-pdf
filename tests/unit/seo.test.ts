import { describe, expect, it } from 'vitest';
import { graph, howTo, itemList, product, webApplication } from '../../src/lib/seo';

const site = new URL('https://leaflockpdf.com');

const base = {
  name: 'Redact PDF',
  description: 'Black out text and images so they cannot be recovered.',
  url: 'https://leaflockpdf.com/redact-pdf',
  locale: 'en',
  site,
  tierPrice: 8,
};

/**
 * These tests exist for one reason: structured data that claims something untrue is
 * worse than none, and the truth here depends on two flags in src/lib/pricing.ts that
 * will be flipped long after this markup was written.
 */
describe('webApplication', () => {
  it('describes a free tool as free', () => {
    const data = webApplication({ ...base, tier: 'free', gated: true });
    expect(data.isAccessibleForFree).toBe(true);
    expect(data.offers).toMatchObject({ price: '0' });
  });

  it('describes a Pro tool as free while Pro tools are not gated', () => {
    const data = webApplication({ ...base, tier: 'pro', gated: false });
    expect(data.isAccessibleForFree).toBe(true);
    expect(data.offers).toMatchObject({ price: '0' });
  });

  it('stops claiming a Pro tool is free as soon as it is gated', () => {
    const data = webApplication({ ...base, tier: 'pro', gated: true });
    expect(data.isAccessibleForFree).toBe(false);
    expect(data.offers).toMatchObject({
      price: '8',
      priceCurrency: 'USD',
      url: 'https://leaflockpdf.com/pricing',
    });
  });

  it('says the things that actually distinguish these tools', () => {
    const data = webApplication({ ...base, tier: 'free', gated: false });
    expect(data.featureList).toContain('Files are never uploaded');
  });
});

describe('howTo', () => {
  it('numbers the steps the page already lists', () => {
    const data = howTo({
      name: 'Merge PDF',
      description: 'Combine several PDFs into one.',
      url: 'https://leaflockpdf.com/merge-pdf',
      steps: ['Choose the files.', 'Put them in order.', 'Select Merge PDFs.'],
    });

    expect(data['@type']).toBe('HowTo');
    const steps = data.step as { position: number; name: string; url: string }[];
    expect(steps).toHaveLength(3);
    expect(steps[0]).toMatchObject({ position: 1, name: 'Choose the files.', url: 'https://leaflockpdf.com/merge-pdf#step-1' });
    expect(steps[2]?.position).toBe(3);
  });

  it('costs nothing, because the work happens on the device', () => {
    const data = howTo({ name: 'x', description: 'y', url: 'https://leaflockpdf.com/x', steps: ['one'] });
    expect(data.estimatedCost).toMatchObject({ value: '0' });
  });
});

describe('itemList', () => {
  it('positions every entry and counts them', () => {
    const data = itemList({
      name: 'All tools',
      items: [
        { name: 'Merge PDF', url: 'https://leaflockpdf.com/merge-pdf' },
        { name: 'Split PDF', url: 'https://leaflockpdf.com/split-pdf' },
      ],
    });

    expect(data.numberOfItems).toBe(2);
    expect(data.itemListElement).toMatchObject([{ position: 1, name: 'Merge PDF' }, { position: 2, name: 'Split PDF' }]);
  });
});

describe('product', () => {
  it('marks a recurring plan with its billing period and a one-off without', () => {
    const data = product({
      name: 'LeafLock PDF Pro',
      description: 'Pro plans.',
      url: 'https://leaflockpdf.com/pricing',
      site,
      offers: [
        { name: 'Pro', price: 8, recurring: 'month' },
        { name: 'Founding lifetime', price: 599, recurring: null },
      ],
    });

    const offers = data.offers as Record<string, unknown>[];
    expect(offers[0]).toMatchObject({ price: '8' });
    expect(offers[0]?.priceSpecification).toMatchObject({ unitCode: 'MON' });
    expect(offers[1]).toMatchObject({ price: '599' });
    expect(offers[1]?.priceSpecification).toBeUndefined();
  });
});

describe('graph', () => {
  it('escapes anything that could close the surrounding script element', () => {
    const json = graph([{ '@type': 'Thing', name: '</script><script>alert(1)</script>' }]);
    expect(json).not.toContain('</script>');
    expect(JSON.parse(json)['@graph'][0].name).toBe('</script><script>alert(1)</script>');
  });
});
