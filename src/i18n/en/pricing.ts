/** Pricing page. Prices are set in src/lib/pricing.ts; these are the words around them. */
export const pricing = {
  title: 'Pricing',
  metaTitle: 'Pricing: free PDF tools, Pro, Practice and Business | LeafLock PDF',
  metaDescription:
    'LeafLock PDF is free to use, with no file-size limit. Pro removes the daily limit for $4 a month or $24 a year, and Practice adds the six professional tools for $249 a year. No trials that turn into charges.',
  intro: 'Every core tool is free, with no account. Pro is for people who work with PDFs every day.',
  earlyAccess: 'Pro and Practice are in early access: every tool, including the six professional ones, is free for everyone until paid plans open.',
  /**
   * Only things that genuinely do not exist yet. This previously promised batch processing
   * — already a shipped Pro tool — and an installable offline app, which shipped in Phase 1
   * and is free to everyone, so two of its three items were things we already had.
   */
  comingToPro: 'Coming to Pro later: saved workflows, team seats, and keeping a file beyond what one device can hold.',
  perMonth: '/ month',
  perYear: '/ year',
  oneTime: 'one time',
  perCompanyYear: '/ company / year',
  yearlySaving: 'Save {percent}% compared with monthly',
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
