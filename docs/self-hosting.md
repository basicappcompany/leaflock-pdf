# Self-hosting LeafLock PDF — the Business edition

The document handed to a Business licensee. Roadmap item 4.10.

It lives in `docs/` rather than in `src/content/` on purpose: it is a deliverable for people
who have bought a licence, not a public page. The commercial argument for Business is
"nothing to deploy and nothing to breach", and that only beats Stirling-PDF if the
deployment is actually written down — but writing it down for everyone would be publishing
the operations manual for a closed-source product nobody else can build.

**Status: written against the code, not yet run end-to-end on a customer's network.** The
build flags, headers and verification steps below are all read from the repository and are
correct as described. What has not happened is a full install inside a real air-gapped
environment, because there is no licensee yet. Treat the "Verify it" section as the thing
to do first on the first real deployment, and correct this document from what you find.

---

## 1. What you are deploying

The Business edition is **the static site, and nothing else**. There is no application
server, no database, and no outbound connection of any kind.

That is not a reduced version — it is the whole product. Every tool runs in the visitor's
browser, so the server's only job is to hand over files: HTML, JavaScript, WebAssembly,
fonts and the OCR language model. A plain web server on your own network is enough, and so
is a USB stick served from a laptop.

What is deliberately absent, and why nothing breaks without it:

| Not deployed | What happens instead |
|---|---|
| Accounts and sign-in | `useSession` catches the failed request and treats everyone as signed out. No login UI is reachable and nothing waits on it. |
| Payments | Not applicable: the licence covers the organisation, so there is nothing to buy per person. |
| Daily usage metering | Switched off at build time (below). Unlimited use, which is what the licence grants. |
| Crash reporting | Switched off at build time. Nothing ever leaves the network. |

## 2. Build it

Requires Node 22.22 or newer — the repository develops against Node 24 — and pnpm, whose
exact version is pinned in `package.json`'s `packageManager` field.

```sh
pnpm install --frozen-lockfile
PUBLIC_USAGE_LIMITS=off PUBLIC_ERROR_REPORTING=off pnpm build
```

The output is the `dist/` directory. Copy it to the machine that will serve it.

**Both flags matter, and for different reasons.**

`PUBLIC_USAGE_LIMITS=off` removes the per-job metering call entirely (`src/lib/usage.ts`).
On a network with no internet access this is not a tidiness measure: without it, every job
would first make a request that cannot complete, and the visitor would wait out a
connection timeout before the tool ran.

`PUBLIC_ERROR_REPORTING=off` stops the crash reporter (`src/lib/errorReporting.ts`). A
report contains no file content — names, page text and anything typed are stripped in the
browser first — but a report that cannot be sent is still a request that cannot complete,
and an air-gapped deployment should make no attempt at all.

Both are read at **build** time, not run time. Setting them on the server does nothing; the
build has to be made with them.

## 3. Serve it

Any static file server. The only requirements are that it serves the directory as-is and
sends a few response headers.

`public/_headers` is Cloudflare Pages syntax and will mean nothing to your server, so the
same headers have to be configured wherever you host. They are:

```
Content-Security-Policy: frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(self), microphone=(), geolocation=(), interest-cohort=()
Cross-Origin-Opener-Policy: same-origin
```

And one cache rule that is not optional:

```
/sw.js  →  Cache-Control: no-cache
           Content-Type: text/javascript; charset=utf-8
```

The service worker is how every other asset gets updated. A cached `sw.js` pins a visitor
to an old build indefinitely, and on a network where nobody can reach the internet to work
around it, that is a support call you cannot fix remotely.

**The main Content-Security-Policy needs nothing from you.** It is a `<meta>` tag written
into every page at build time by `astro.config.mjs`, including `connect-src 'self'`, so it
travels with the files. The headers above are only the parts a meta tag cannot express.

Serve over **HTTPS** with a certificate your workstations trust. Not for the file
processing — that never leaves the browser — but because a service worker will not register
on an insecure origin, and without it the offline behaviour in the next section does not
work.

## 4. Verify it

Do these on the first deployment, in this order. They take about ten minutes and they test
the three claims the edition is sold on.

1. **Open any tool and run it.** Merge two PDFs. If the result downloads, the build is
   sound.
2. **Open the browser's Network tab, reload, and run the tool again.** Every request should
   go to your own host. There should be no request to `leaflockpdf.com`, no CDN, and no
   analytics. If you see one, stop and report it — that is a defect, not a configuration
   problem.
3. **Disconnect the machine from the network and run the tool again.** It should still
   work. This is the real test: a tool that needed a server could not survive it.
4. **Check the metering flag took.** Run more than 20 jobs in a day on one machine. If
   anything mentions a daily limit, the build was made without `PUBLIC_USAGE_LIMITS=off`.
   Twenty, not sixty: there are no accounts here, so everyone is anonymous, and the
   anonymous allowance is the one that would apply if metering were on at all.
5. **View source on any page and search for `content-security-policy`.** You should find
   `connect-src 'self'` in the meta tag. That is the browser-enforced rule that the page
   may not open a connection to anywhere but your own server.

The public [verifiability page](/verify) walks through steps 2 and 3 interactively, and
works on a self-hosted copy too.

## 5. Updating

Rebuild with the same two flags and replace `dist/`. There is no migration step and no
state on the server to preserve — there is no server state at all.

Visitors pick up the new build the next time they load a page, provided `sw.js` is being
served with `Cache-Control: no-cache` as above. A visitor with the old build still open
keeps working until they reload; nothing breaks mid-job.

## 5a. Plan and usage checks are an honor system in this build

The hosted site asks a server before every tool run (`POST /api/usage/claim`): it counts the free daily
allowance, refuses a tool above the account's plan, and, for a paid account, issues a signed token so paid tools
keep working offline. **A self-hosted build does none of this.** It is built with `PUBLIC_USAGE_LIMITS=off`, has no
server to ask, and makes no request at all, so every tool runs ungated. That is deliberate: the Business edition
is licensed per organisation, and it must work on a network with no internet.

So the licence terms are what bind a licensee, not the software. Say that plainly in any conversation with one.

**What the hosted site cannot prevent either.** Every tool runs on the visitor's own device and the paid tools'
operations are in the shared worker bundle that is sent to every visitor, so a determined person with developer
tools can run them directly. The hosted checks make paying the supported way to use them and keep an honest free
account within its allowance; they do not make the tools impossible to run without paying. The same is true of the
files you are given here. This was decided, not overlooked: keeping the computation on the device is the
product's privacy promise, and gating it would mean either splitting the worker per tool or moving work to a
server, which breaks the offline app and this edition.

## 6. What the licence covers

One organisation, no limit on the number of people using it. The current price and the
conditions for the published increase are on the [Business page](/business) and in
`src/lib/pricing.ts` — do not restate them here, or this document becomes another figure to
keep in step.

## 7. Open questions for the first real deployment

Honest gaps, listed so the first licensee is not surprised and so whoever runs that install
knows what to write down:

- **No tested install exists.** See the status note at the top.
- **Which web servers have been tried: none.** The requirements above are generic, but the
  exact configuration syntax for nginx, IIS, Apache or Caddy is not written here and should
  be added once one is used in anger.
- **Updating is manual.** There is no in-place updater and no update notification; an
  administrator copies a new `dist/`. Whether that is acceptable at this price is a
  question for the first customer, not an assumption to make for them.
- **The OCR language model is about 10 MB** and downloads from your own server the first
  time someone uses OCR. On a slow internal link, warn people or pre-warm it.
