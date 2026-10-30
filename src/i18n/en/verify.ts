/**
 * The verifiability page (roadmap 3.4). The demo lives in
 * src/components/verify/NetworkProof.tsx; these are the words around it.
 *
 * Written for the reason the item was promoted on 30 October 2026: two rivals now use our
 * exact wording — "nothing leaves your browser" — while their own pricing pages describe
 * server-side processing. The sentence is commodity; the demonstration is not. So nothing
 * here asks to be believed. Every claim on the page is one the visitor's own browser
 * reports back to them.
 */
export const verify = {
  title: 'See it for yourself',
  metaTitle: 'Check that your files never leave your device | LeafLock PDF',
  metaDescription:
    'A live demonstration, not a promise: see every request this page has made, watch your browser refuse to let it contact another site, and keep working with the network off.',
  intro:
    'Any website can say your files never leave your device. This page asks your own browser instead, while you watch.',
  lead:
    'Nothing below is our word for it. The request list comes from the browser’s own record, the block is reported by the browser as it happens, and the offline test is one you run yourself.',

  requests: {
    heading: '1. Every request this page has made',
    intro:
      'Your browser keeps a record of each file a page fetched and where it came from. This is that record, read back to you as it grows.',
    count: '{count} requests so far, and every one of them to {origin}.',
    allOurs:
      'No request has gone to any other site. There are no analytics, no advertising and no third-party scripts to make one.',
    foreignFound:
      'A request went somewhere other than this site. If you are seeing this on leaflockpdf.com, it is a bug and we want to know about it.',
    showAll: 'Show the full list',
    limit:
      'What this shows: where the page’s requests went. What it cannot show: whether a request carried a document. For that, the next panel is the stronger test — and the file-by-file detail is in your browser’s Network tab.',
  },

  attempt: {
    heading: '2. Watch the browser refuse',
    intro:
      'Every page here is served with a rule that permits network connections to this site and nowhere else. The button asks the page to break that rule, so you can see what happens when it tries.',
    action: 'Try to contact another site',
    blocked: 'Blocked by your browser, not by us.',
    directiveLabel: 'Rule that blocked it',
    blockedUriLabel: 'Address it refused to reach',
    errorLabel: 'What the page received instead',
    note:
      'The refusal happens before anything leaves your machine, so that address is never actually contacted. The rule is enforced by the browser, which means it applies to our code and to anything else that ends up on the page.',
    notBlocked:
      'The request was not blocked. That should not happen on leaflockpdf.com — if you are seeing this here, please tell us, because it means the policy this page describes is not in force.',
  },

  offline: {
    heading: '3. Turn off the network and keep working',
    intro:
      'The strongest test is the simplest one. Load a tool, disconnect from Wi-Fi, and use it. If a file had to be uploaded to be processed, nothing could work.',
    statusOnline: 'Your browser reports that you are online. Disconnect, and this line will change by itself.',
    statusOffline: 'Your browser reports that you are offline — and this page is still working.',
    note:
      'Run a tool once first, so everything it needs has been downloaded. Then go offline and run it again on a different file.',
  },

  honest: {
    heading: 'What this page does not prove',
    intro: 'A demonstration is worth less if it implies more than it shows.',
    points: [
      'The rule above permits connections to this site. It rules out a document going to a third party; on its own it does not rule out one going to us. What rules that out is that no code here sends one — which the offline test demonstrates, because a tool that needed our server could not work without it.',
      'It proves what happened in your browser, on this visit. It is not an audit, and we hold no security certification.',
      'Browser extensions can read any page, including this one. The policy governs the page, not extensions.',
    ],
    claims: 'Every claim we make, with how to check each one: Our claims.',
  },

  next: {
    heading: 'Do it the thorough way',
    intro:
      'This page is the short version. The full method — which works on any PDF website, not just ours — is in the guide, including how to spot an upload in the Network tab and what the policy’s other rules do.',
    guide: 'How to check if a PDF website uploads your files',
    tool: 'Or go and use a tool, with the network off: Merge PDF',
  },
};
