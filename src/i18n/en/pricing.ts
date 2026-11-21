/** Pricing page. Prices are set in src/lib/pricing.ts; these are the words around them. */
export const pricing = {
  title: 'Pricing',
  metaTitle: 'Pricing: free PDF tools, Pro, Practice and Business | LeafLock PDF',
  metaDescription:
    'LeafLock PDF is free with no file-size limit. Pro removes the daily limit for $4 a month or $24 a year; Practice is $249 a year.',
  intro: 'Every core tool is free, with no account. Pro is for people who work with PDFs every day.',
  /** `{endDate}` is the last day of early access and `{startDate}` the day paid plans start (src/lib/pricing.ts). */
  earlyAccess:
    'Every tool, including Pro and Practice, is free until {endDate}. We never ask for a card to use the tools, and nothing renews by itself unless you buy a plan. Paid plans start on {startDate}.',
  /**
   * These two live here, not in common.ts: every tool page serialises the whole `common` catalogue
   * into its React island's props, so a string added there costs bytes on all ~80 tool pages and
   * the HTML budgets in tests/e2e/performance.spec.ts count them. `pricing` is not passed down.
   *
   * `homeNotice`: above the home page's tool grid while paid plans are not on sale.
   * `freeNow`: added to a Pro or Practice badge in the same period, so a badge never reads as a paywall.
   */
  homeNotice:
    'Tools marked Pro or Practice are free for everyone until {endDate}. Buy a plan before then and save up to {percent}%.',
  freeNow: 'Free now',
  /** The heading over the home page's grid of major tools (src/pages/index.astro). Here, not in `common`, so it costs no tool page. */
  homePopular: 'Popular right now',
  /** "See all ..." is the one wording for every way on to a longer list: under a category tab it opens the All tab, under All it goes to the full directory at the foot of the page. */
  homeSeeAll: 'See all tools',
  /** The sentence under the home page headline: the difference from other tools, then the proof. Here, not in `common`, so it costs no tool page. The `compareIndex` title follows it as a link. */
  homeContrast:
    'Most online PDF tools send your file to their servers first. LeafLock PDF does the work in your browser, so there is nothing to upload, and you can check that yourself.',
  /**
   * The launch offer, shown while it can be taken (src/lib/pricing.ts `offerOpen`). `{percent}` is the
   * largest discount, `{yearlyPercent}` and `{tenYearPercent}` the two actual ones, the dates as above.
   */
  offer: {
    heading: 'Launch offer: up to {percent}% off until {endDate}',
    body: 'Buy a yearly plan before {endDate} and pay {yearlyPercent}% less for your first year, or {tenYearPercent}% less for the ten-year plan. You pay at checkout and your plan starts on {startDate}. A yearly plan renews at the standard price after its first year, and you can cancel in one click before then.',
    was: 'Standard price {price}',
  },
  /**
   * Only things that genuinely do not exist yet. This previously promised batch processing
   * — already a shipped Pro tool — and an installable offline app, which shipped in Phase 1
   * and is free to everyone, so two of its three items were things we already had.
   */
  comingToPro: 'Coming to Pro later: saved workflows, team seats, and keeping a file beyond what one device can hold.',
  /** A line on the Pro card for the ten-year option, which is no longer a card of its own. `{price}` is formatted. */
  tenYearLine: 'Or ten years of Pro for one payment of {price}. A limited number is available.',
  perMonth: '/ month',
  perYear: '/ year',
  oneTime: 'one time',
  perCompanyYear: '/ company / year',
  yearlySaving: 'Save {percent}% compared with monthly',
  /**
   * What a signed-in member on a paid plan sees at the top of the pricing page, in place of the launch
   * offer (which is for new buyers). Plain "upgrade" and "standard price" wording, not "launch offer".
   * `{plan}` is the plan's name, `{price}` and `{standard}` formatted prices, the dates as above.
   */
  member: {
    planLabel: 'Your plan: {plan}',
    startsOn: 'Your plan starts on {startDate}. Until then every tool is free.',
    active: 'Your plan is active.',
    upgradeHeading: 'Upgrade to Practice',
    upgradeBody: 'Adds redaction, compare, batch, table extraction, Bates numbering and PDF/A.',
    upgradePriceOffer: 'Upgrade price {price} for the first year, available until {endDate}. The standard price is {standard}.',
    upgradePrice: 'Practice is {price} a year.',
    upgradeDifference: 'You only pay the difference for what you have already paid.',
    upgrade: 'Upgrade to Practice',
    checking: 'Checking your upgrade…',
    /** {amount} is the exact charge from the payment provider, in the customer's currency, tax included. */
    confirmCharge: 'You will be charged {amount} now, tax included, on the card you paid with.',
    /** {date} is the day the plan next renews. */
    confirmRenews: 'Your plan then renews at the standard price on {date}.',
    confirm: 'Confirm and pay',
    cancel: 'Cancel',
    working: 'Starting your upgrade…',
    pending:
      'Your bank is confirming the payment, which can take up to two days. Your plan changes to Practice on its own; there is nothing more to do.',
    unavailable: 'Upgrading is not available right now. Please try again later.',
    failed: 'We could not upgrade your plan. Please try again.',
    top: 'You are on the top plan for individuals. To run LeafLock on your own network, see the Business edition.',
  },
  plans: {
    free: {
      name: 'Free',
      price: '$0',
      summary: 'Every core tool, no account needed.',
      features: [
        'Merge, split, compress, convert, sign and more',
        'Files never leave your device',
        'No watermarks and no file-size limit',
        '20 tools a day without an account, 60 a day with a free account',
      ],
      cta: 'Use the tools',
    },
    pro: {
      name: 'Pro',
      summary: 'For people who work with PDFs every day.',
      /**
       * Every tool carrying `tier: 'pro'` in `src/tools/registry.ts` has to be named here,
       * and nothing carrying another tier may be. `tests/unit/proCopy.test.ts` enforces
       * both: this list named two of six Pro tools for days, understating what Pro bought
       * — the same drift that had the free tier advertising a third of its real allowance.
       *
       * Since 30 October 2026 (roadmap 4.9) the six professional tools are Practice, not
       * Pro, so they moved to the block below rather than being listed in both.
       */
      features: [
        'Everything in Free',
        'No daily limit on any tool',
        'Keep a finished file on your device for as long as you choose',
      ],
      cta: 'Coming soon',
    },
    /**
     * Ten years, not "lifetime" — decided 30 October 2026. A plan with no end date is a
     * promise we would still owe after the product's economics change, and a buyer can
     * check a defined term against the price. The message key keeps its old name because
     * the stored plan value does (src/lib/pricing.ts `proTenYear`).
     */
    lifetime: {
      name: 'Pro, ten years',
      summary: 'Ten years of Pro for one payment, for early supporters.',
      features: ['Everything in Pro for ten years', 'Every Pro tool we add in that time', 'Limited number available'],
      cta: 'Coming soon',
    },
    practice: {
      name: 'Practice',
      summary: 'For the professional work: redaction, legal numbering and archival formats.',
      /**
       * Every tool carrying `tier: 'practice'` in `src/tools/registry.ts` has to be named
       * here — `tests/unit/proCopy.test.ts` checks this list the same way it checks Pro's.
       */
      features: [
        'Everything in Pro',
        'Redact PDF: remove sensitive content for good',
        'Compare PDF: see what changed between two versions',
        'Batch PDF: run one tool across many files in a single pass',
        'Extract tables from PDF: straight to Excel or CSV',
        'Bates numbering: continuous legal numbering across a set of files',
        'Convert PDF to PDF/A: the archival format compliance teams ask for',
        'A data processing agreement you can accept online, with no negotiation',
      ],
      cta: 'Coming soon',
    },
    business: {
      name: 'Business edition',
      summary: 'LeafLock on your own network, for teams that can’t use the internet for documents. Now taking early-access enquiries.',
      features: ['Self-hosted on your internal server', 'No internet connection needed', 'For law firms, accountants, clinics and public offices'],
      cta: 'Ask about early access',
    },
  },
  checkout: {
    alreadyOwned: 'You already have this plan or a higher one.',
    useUpgrade: 'You already have Pro. Use the upgrade option at the top of this page instead.',
    buy: 'Get this plan',
    buyYearly: 'Get the yearly plan',
    buyMonthly: 'Get the monthly plan',
    buyTenYear: 'Get the ten-year plan',
    logInToBuy: 'Log in to subscribe',
    starting: 'Taking you to checkout…',
    failed: 'We could not start checkout. Please try again.',
    note: 'Payments are handled by Dodo Payments, who are the seller for your purchase.',
  },
  promisesHeading: 'Our pricing promises',
  promises: [
    'You see the price before you pay, never after you’ve added files.',
    'No trial that quietly turns into a subscription.',
    'Cancel in one click, any time.',
  ],
};
