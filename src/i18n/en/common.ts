import type { PluralForms } from '../format';

/** Strings shared by the whole site and by every tool. */
export const common = {
  site: {
    name: 'LeafLock PDF',
    /** Under an installed app's icon, where there is room for about 12 characters. */
    shortName: 'LeafLock',
    /** Small label above the home page headline. */
    eyebrow: 'Private by design',
    tagline: 'Private PDF tools. Your files never leave your device.',
    metaDescription:
      'Free PDF tools that run entirely in your browser: merge, split, compress, sign, convert and more. Your files are never uploaded.',
    privacyNote: 'Everything happens in your browser. Nothing is uploaded.',
    allTools: 'All tools',
    footer: 'LeafLock PDF processes every file on your device. We never see your documents.',
  },
  /** Labels inside the home page diagram (src/components/PrivacyDiagram.astro). */
  diagram: {
    label: 'Your file opens in your browser, is processed there, and the result is saved back to your device. It never reaches our server.',
    device: 'Your device',
    work: 'Processed here',
    result: 'Your result',
    server: 'Our server',
  },
  /** Shown when a page is opened with no network and was never cached (src/pages/offline.astro). */
  offline: {
    metaTitle: 'Offline: LeafLock PDF',
    heading: 'This page isn’t available offline',
    body: 'You have no connection, and this page hasn’t been opened on this device before. Every tool you have already used still works — including the ones that need no network at all, because the work happens here rather than on our server.',
    retry: 'Try again',
    home: 'Go to all tools',
  },
  /** Home page hero buttons (src/pages/index.astro). */
  cta: {
    merge: 'Merge a PDF',
    howItWorks: 'How it works',
  },
  /** The trust-badge row under a hero's call-to-action buttons (home page and every
   * tool page). Each claim already exists elsewhere in the product's own copy —
   * src/i18n/en/pricing.ts has "no file-size limit" verbatim — this just surfaces the
   * same facts where a first-time visitor lands, not new claims of their own. */
  trust: {
    noUpload: 'No upload, ever',
    worksOffline: 'Works offline',
    freeToStart: 'Free to start',
    noFileSizeLimit: 'No file-size limit',
  },
  /** The signed-in dashboard (src/pages/dashboard.astro). */
  dashboard: {
    metaTitle: 'Your dashboard: LeafLock PDF',
    metaDescription: 'The tools you used recently, today’s allowance and your plan.',
    loading: 'Loading your dashboard…',
    welcome: 'Welcome back',
    subtitle: 'Pick up where you left off, or start something new below.',
    recentHeading: 'Recent tools',
    /** Shown under the list, because a device-local list surprises people otherwise. */
    recentNote: 'Kept on this device only. We never see which files you open, so this list does not follow you to another browser.',
    /** No longer shown (the card is left out while nothing has been used); kept because generated locale catalogues must match English key for key. */
    recentEmpty: 'Nothing yet. The tools you use will show up here.',
    starredHeading: 'Starred tools',
    /** Under the list, because where stars are kept is the question people ask. */
    starredNote: 'Kept in this browser, and in your account, so they follow you to other browsers.',
    quickHeading: 'Quick tools',
    allTools: 'All tools',
    open: 'Open',
    clear: 'Clear list',
    todayHeading: 'Today',
    /** `{used}` and `{limit}` are counts of tool runs. */
    todayUsed: '{used} of {limit} runs used',
    todayResets: 'The allowance resets at midnight UTC.',
    unlimitedHeading: 'Unlimited',
    unlimited: 'Your plan has no daily limit, and a run never waits on our server.',
    planHeading: 'Plan',
    planFree: 'Free account',
    upgrade: 'See Pro',
    /** Shown to paying customers in place of the upgrade prompt. */
    proHeading: 'Batch processing',
    proNote: 'Run one tool across many files in a single pass.',
    proAction: 'Open batch',
    /**
     * Shown to Pro customers once paid plans open: batch moved to Practice on
     * 30 October 2026 (roadmap 4.9), so the card above would otherwise point a paying
     * customer at a tool their own plan does not include.
     */
    practiceHeading: 'The professional tools',
    practiceNote:
      'Redaction, Bates numbering, compare, batch, table extraction and PDF/A are part of Practice.',
    practiceAction: 'See Practice',
    accountAction: 'Account settings',
  },
  nav: {
    label: 'Main',
    allTools: 'All tools',
    guides: 'Guides',
    security: 'Security',
    pricing: 'Pricing',
    business: 'Business',
    login: 'Log in',
    account: 'Account',
    dashboard: 'Dashboard',
    skipToContent: 'Skip to content',
    breadcrumb: 'Breadcrumb',
  },
  footer: {
    tools: 'Tools',
    product: 'Product',
    company: 'Company',
    legal: 'Legal',
    compare: 'Compare',
    copyright: '© {year} LeafLock PDF',
  },
  /** The home page's collapsible category sections (src/pages/index.astro). */
  home: {
    /** `{category}` is one of the common.categories labels, e.g. "Organize". */
    viewAll: 'See all {category} tools',
  },
  /** Titles of site pages, used in navigation and footers. Keys match src/content/pages/<locale>/<key>.md. */
  pageLinks: {
    about: 'About',
    security: 'Security and privacy',
    claims: 'Our claims',
    verify: 'See it for yourself',
    contact: 'Contact',
    business: 'Business edition',
    help: 'Help and FAQ',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    cookies: 'Cookies',
    licenses: 'Open-source licenses',
    pricing: 'Pricing',
    guides: 'Guides',
    compare: 'Compare',
  },
  /** The skin picker dropdown in the header (src/components/SkinPicker.astro). */
  /** Language switcher and the first-visit suggestion (src/components/LanguageSwitcher.astro). */
  language: {
    label: 'Language',
    /** The first-visit suggestion, rendered in the *suggested* language. {language} is its native name. */
    suggest: 'This site is also available in {language}.',
    switchTo: 'Switch',
    dismiss: 'No thanks',
  },
  appearance: {
    heading: 'Appearance',
    defaultBadge: 'Default',
    /** Remembering a choice between visits is a Pro/Practice perk (see the component's
     * own comment for why); everyone else gets it applied for the current browser
     * session only. */
    freeNote: 'Remembered on this browser with Pro or Practice. Otherwise, for this session only.',
  },
  article: {
    published: 'Published {date}',
    updated: 'Updated {date}',
    relatedTools: 'Tools in this guide',
    relatedGuides: 'Guides',
    moreGuides: 'More guides',
    legalDraft:
      'Draft: this text has not yet been reviewed by a lawyer and may change before LeafLock PDF launches.',
    checkedOn: 'Facts about {competitor} were checked on {date} against the sources below, and may have changed since.',
    sources: 'Sources',
  },
  guidesIndex: {
    title: 'Guides',
    metaTitle: 'PDF guides: privacy, compression, signing and more | LeafLock PDF',
    description: 'Practical guides to working with PDFs privately: merging, compressing, signing, redacting and making scans searchable.',
  },
  compareIndex: {
    title: 'Compare LeafLock PDF',
    metaTitle: 'How LeafLock PDF compares with other PDF tools | LeafLock PDF',
    description:
      'Factual comparisons of LeafLock PDF with other online PDF services: where your files are processed, what is kept, and which tools each offers.',
    intro:
      'The main difference: LeafLock PDF processes files on your device, while most online PDF services upload them to their servers. These pages compare the details, with sources.',
  },
  toolFaq: {
    heading: 'Questions and answers',
  },
  notFound: {
    title: 'Page not found',
    metaTitle: 'Page not found | LeafLock PDF',
    body: 'This page doesn’t exist, or it has moved. All our tools are listed below.',
  },
  theme: {
    label: 'Color theme',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },
  categories: {
    organize: 'Organize',
    convert: 'Convert',
    edit: 'Edit and sign',
    secure: 'Protect and optimize',
  },
  /** The star button on a tool's page. Its name stays the same; whether it is on is its pressed state. */
  star: {
    label: 'Star this tool',
    short: 'Star',
  },
  /** The persistent tools sidebar on tool and category pages (src/components/ToolsSidebar.astro). */
  sidebar: {
    label: 'All tools',
    allTools: 'All tools',
    /** Heading of the "recently used" group at the top of the list; shown only once a tool has been used. */
    recent: 'Recent tools',
    /** Heading of the group of tools the visitor has starred, below the recent ones. */
    starred: 'Starred tools',
    hide: 'Hide sidebar',
    show: 'Show tools',
    /** Labels of the three handles on the sidebar's inner edge. */
    position: 'Sidebar position',
    moveLeft: 'Move sidebar to the left',
    moveRight: 'Move sidebar to the right',
    search: 'Search tools',
    searchClear: 'Clear search',
    searchNoResults: 'No tools match "{query}".',
    reset: 'Reset to default position',
    dock: {
      // Not "...left/right edge": the crop tool's own resize handles are already
      // named "Left edge"/"Right edge" (CropOverlay.tsx), and Playwright's
      // getByRole name match is substring, not exact — "edge" here made these two
      // completely unrelated controls ambiguous on every tool page.
      left: 'Dock sidebar to the left',
      right: 'Dock sidebar to the right',
    },
    links: {
      heading: 'More',
    },
  },
  /** The category hub pages at /tools/<category> (src/pages/tools/[category].astro). */
  categoryHub: {
    intro: {
      organize: 'Merge, split, reorder, rotate and crop — the everyday PDF tools for putting a document into the shape it needs to be.',
      convert: 'Turn images and scans into PDFs, or a PDF into text and images — every conversion runs in your browser, nothing is uploaded to do it.',
      edit: 'Add page numbers, a watermark, a signature, or new text and images — mark up a PDF without printing it first.',
      secure: 'Set a password, remove one, shrink a file down, or fix one that won’t open — all without the file ever leaving your device.',
    },
  },
  toolPage: {
    howItWorks: 'How it works',
    privacyHeading: 'Private by design',
    privacyBody:
      'This tool runs entirely in your browser. Your files are never uploaded to a server, and the page is technically blocked from sending them anywhere.',
    related: 'Related tools',
    variants: 'Converting a specific format?',
    /**
     * Wording for the paid tiers, keyed by the tool's own tier.
     *
     * Added 30 October 2026 with Practice (roadmap 4.9). It is keyed rather than flat
     * because the six professional tools moved out of Pro, and every `tier === 'pro'`
     * check that drew a badge or a notice would otherwise have gone quiet on exactly
     * the six tools that now cost the most.
     *
     * `note` applies during early access; `noteGated` replaces it once paid plans open
     * (src/lib/pricing.ts).
     */
    tiers: {
      pro: {
        label: 'Pro',
        note: 'Pro tool, free during early access.',
        noteGated: 'Pro tool, included with LeafLock PDF Pro.',
        gateHeading: 'This tool is part of Pro',
        gateBody:
          'Your plan doesn’t include this tool yet. Pro removes the daily limit on every tool, and still processes every file on your device.',
        gateAction: 'See Pro',
        gateHaveIt: 'Already bought Pro? Log in and it will unlock here.',
      },
      practice: {
        label: 'Practice',
        note: 'Practice tool, free during early access.',
        noteGated: 'Practice tool, included with LeafLock PDF Practice.',
        gateHeading: 'This tool is part of Practice',
        gateBody:
          'Your plan doesn’t include this tool yet. Practice adds the six professional tools — redaction, Bates numbering, compare, batch, table extraction and PDF/A — and still processes every file on your device.',
        gateAction: 'See Practice',
        gateHaveIt: 'Already bought Practice? Log in and it will unlock here.',
      },
    },
    gateLogIn: 'Log in',
    loading: 'Loading tool…',
  },
  picker: {
    dropOne: 'Drop a PDF here, or',
    dropMany: 'Drop PDF files here, or',
    dropImages: 'Drop images here, or',
    browseOne: 'choose a file',
    browseMany: 'choose files',
    addMore: 'Add more files',
    replace: 'Choose a different file',
    skippedWrongType: '{name} is not a supported file, so it was skipped.',
  },
  files: {
    count: { one: '{count} file', other: '{count} files' } as PluralForms,
    moveUp: 'Move {name} up',
    moveDown: 'Move {name} down',
    remove: 'Remove {name}',
    clear: 'Clear all',
  },
  pages: {
    count: { one: '{count} page', other: '{count} pages' } as PluralForms,
    selected: { one: '{count} page selected', other: '{count} pages selected' } as PluralForms,
    page: 'Page {number}',
    selectAll: 'Select all',
    selectNone: 'Select none',
    rotateLeft: 'Rotate page {number} left',
    rotateRight: 'Rotate page {number} right',
    remove: 'Remove page {number}',
    restore: 'Restore page {number}',
    moveEarlier: 'Move page {number} earlier',
    moveLater: 'Move page {number} later',
    rangeLabel: 'Pages',
    rangeHint: 'For example: 1-3, 5, 8-',
    rangeInvalid: 'Use page numbers between 1 and {count}, like 1-3, 5.',
    allPages: 'All pages',
    previous: 'Previous page',
    next: 'Next page',
    of: 'Page {number} of {count}',
  },
  actions: {
    working: 'Working…',
    progress: 'Working… {percent}%',
    download: 'Download',
    downloadFile: 'Download {name}',
    downloadAll: 'Download all as ZIP',
    zipName: 'leaflock-files.zip',
    startOver: 'Start over',
    done: 'Done. Your file is ready.',
    doneMany: { one: 'Done. Your file is ready.', other: 'Done. {count} files are ready.' } as PluralForms,
    sizeChange: '{before} → {after}',
  },
  /**
   * Keeping a result on this device. Deliberately plain about the two things people get
   * wrong about it: that it stays on the machine, and that it goes away by itself.
   */
  retention: {
    keepHeading: 'Keep on this device?',
    keepNote: 'Stays in this browser, never uploaded, and deletes itself when the time is up.',
    off: 'Don’t keep',
    preset5m: '5 minutes',
    preset1h: '1 hour',
    preset24h: '24 hours',
    custom: 'Custom',
    /** `{max}` is a duration, e.g. "7 days". */
    customLabel: 'Minutes to keep (up to {max})',
    customInvalid: 'Enter a whole number of minutes, from {min} to {max}.',
    customPro: 'Custom lengths are part of Pro.',
    /** The device-only ceiling, explained where someone asks for longer. */
    customCeiling: 'Seven days is the longest a browser can be relied on to hold a file. Longer keeps need server support, which is coming to Pro.',
    kept: { one: 'Kept for {duration}.', other: 'All {count} files kept for {duration}.' } as PluralForms,
    keptFailed: 'This browser wouldn’t store the file, so nothing was kept. Your download above still works.',
    shelfHeading: 'Still on this device',
    shelfNote: 'Only what you chose to keep. Nothing here has been uploaded, so it won’t appear in another browser.',
    /** `{value}` is a number, `{unit}` an already-pluralised word like "minutes". */
    remaining: 'about {value} {unit} left',
    unitMinute: { one: 'minute', other: 'minutes' } as PluralForms,
    unitHour: { one: 'hour', other: 'hours' } as PluralForms,
    unitDay: { one: 'day', other: 'days' } as PluralForms,
    remove: 'Remove',
    removeFile: 'Remove {name}',
    clearAll: 'Remove all',
    unavailable: 'This browser isn’t letting us store anything, so keeping files is off.',
  },
  errors: {
    passwordProtected: '{name} is password-protected. Unlock it first, then try again.',
    wrongPassword: 'That password is not correct for {name}.',
    notAPdf: '{name} could not be read. It may be damaged or not a real PDF.',
    unexpected: 'Something went wrong. Please try again. If it keeps happening, let us know.',
    // Not failures: the daily free allowance is used up. Shown with a link, not as an error.
    dailyLimitAnonymous: 'You have used today’s free tools. Create a free account for a higher daily limit.',
    dailyLimitAnonymousAction: 'Create a free account',
    dailyLimitFree: 'You have used today’s free tools. Pro removes the daily limit.',
    dailyLimitFreeAction: 'See Pro',
  },
};

export type CommonMessages = typeof common;
