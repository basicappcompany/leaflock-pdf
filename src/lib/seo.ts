/**
 * Structured data (schema.org JSON-LD) for search engines. Keep every claim here true:
 * no ratings we didn't collect, no features we don't have.
 */

import { isPaidTier, type ToolTier } from './proAccess';

export const siteName = 'LeafLock PDF';

type JsonLd = Record<string, unknown>;

export function organization(site: URL): JsonLd {
  return {
    '@type': 'Organization',
    '@id': new URL('/#organization', site).href,
    name: siteName,
    url: site.href,
    logo: new URL('/favicon.svg', site).href,
  };
}

export function website(site: URL, locale: string): JsonLd {
  return {
    '@type': 'WebSite',
    '@id': new URL('/#website', site).href,
    name: siteName,
    url: site.href,
    inLanguage: locale,
    publisher: { '@id': new URL('/#organization', site).href },
  };
}

/**
 * A tool page as a web application that runs in the browser.
 *
 * The price has to follow the product rather than being hard-coded free: a Pro tool is
 * only free while `proToolsGated` is off, and claiming `isAccessibleForFree` for
 * something behind a paywall is the kind of untrue markup that earns a manual action.
 * Callers pass the tool's tier and whether gating is live, so this stays honest on its
 * own.
 */
export function webApplication(options: {
  name: string;
  description: string;
  url: string;
  locale: string;
  site: URL;
  tier: ToolTier;
  /** `proToolsGated` — paid tools are free during early access. */
  gated: boolean;
  /**
   * The price of the plan this tool needs, used only when it actually costs money:
   * monthly Pro for a Pro tool, yearly Practice for one of the six professional tools.
   */
  tierPrice: number;
}): JsonLd {
  const costsMoney = isPaidTier(options.tier) && options.gated;
  return {
    '@type': 'WebApplication',
    name: options.name,
    description: options.description,
    url: options.url,
    inLanguage: options.locale,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any (runs in a web browser)',
    browserRequirements: 'Requires a modern browser with JavaScript and WebAssembly.',
    // True of every tool here and the single most distinguishing fact about them.
    featureList: ['Runs entirely in the browser', 'Files are never uploaded', 'Works offline once installed'],
    isAccessibleForFree: !costsMoney,
    offers: costsMoney
      ? {
          '@type': 'Offer',
          price: String(options.tierPrice),
          priceCurrency: 'USD',
          category: 'subscription',
          url: new URL('/pricing', options.site).href,
        }
      : { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': new URL('/#organization', options.site).href },
  };
}

/**
 * The steps a tool page already lists, as a HowTo.
 *
 * The steps come from each tool's `howTo` strings, so there is nothing to write twice —
 * and nothing can describe a procedure the page does not also show a reader.
 */
export function howTo(options: { name: string; description: string; url: string; steps: readonly string[] }): JsonLd {
  return {
    '@type': 'HowTo',
    name: options.name,
    description: options.description,
    // Honest zero: the work happens on the visitor's device and costs nothing.
    totalTime: 'PT1M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    step: options.steps.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: text,
      text,
      url: `${options.url}#step-${index + 1}`,
    })),
  };
}

/** The catalogue, so an assistant asked "what tools does it have" has one list to read. */
export function itemList(options: { name: string; items: readonly { name: string; url: string }[] }): JsonLd {
  return {
    '@type': 'ItemList',
    name: options.name,
    numberOfItems: options.items.length,
    itemListElement: options.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

/**
 * The paid plans, as one Product with an offer per plan.
 *
 * Only emitted when the plans can actually be bought: offers for something with no
 * checkout behind it would be a false claim, and `paidPlansAvailable` is the switch.
 */
export function product(options: {
  name: string;
  description: string;
  url: string;
  site: URL;
  offers: readonly { name: string; price: number; recurring: 'month' | 'year' | null }[];
}): JsonLd {
  return {
    '@type': 'Product',
    name: options.name,
    description: options.description,
    url: options.url,
    brand: { '@id': new URL('/#organization', options.site).href },
    offers: options.offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      price: String(offer.price),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      url: options.url,
      ...(offer.recurring
        ? { priceSpecification: { '@type': 'UnitPriceSpecification', billingDuration: 1, billingIncrement: 1, unitCode: offer.recurring === 'month' ? 'MON' : 'ANN' } }
        : {}),
    })),
  };
}

export function faqPage(questions: readonly { q: string; a: string }[]): JsonLd {
  return {
    '@type': 'FAQPage',
    mainEntity: questions.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function breadcrumbs(items: readonly { name: string; url: string }[]): JsonLd {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function article(options: {
  headline: string;
  description: string;
  url: string;
  locale: string;
  published: Date;
  updated?: Date | undefined;
  site: URL;
}): JsonLd {
  return {
    '@type': 'Article',
    headline: options.headline,
    description: options.description,
    url: options.url,
    inLanguage: options.locale,
    datePublished: options.published.toISOString().slice(0, 10),
    dateModified: (options.updated ?? options.published).toISOString().slice(0, 10),
    author: { '@id': new URL('/#organization', options.site).href },
    publisher: { '@id': new URL('/#organization', options.site).href },
  };
}

/** Wraps several items in one @graph, the form Google recommends for multiple items per page. */
export function graph(items: readonly JsonLd[]): string {
  // Escape "<" so content can never close the surrounding <script> element.
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': items }).replace(/</g, '\\u003c');
}
