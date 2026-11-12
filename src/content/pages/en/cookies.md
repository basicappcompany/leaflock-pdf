---
title: Cookie policy
description: The three strictly-necessary cookies LeafLock PDF sets, what else it stores in your browser (theme choice, the OCR model), and how to remove any of it.
updated: 2026-11-12
awaitingLegalReview: true
---

This policy explains whether leaflockpdf.com uses cookies and similar technologies, and what it stores in your browser.

## We don't use cookies

leaflockpdf.com sets **no advertising cookies and no analytics or tracking cookies**, ever. There are three cookies in total, described below — none of them track you across sites, build a profile, or get sent to anyone but us.

- **`__Host-leaflock_session`** — set only if you sign in. Identifies your signed-in session so you don't have to log in on every page, and carries nothing else: no profile, no record of which tools you used. Strictly necessary for signing in, which is the category that needs no consent under the ePrivacy rules. Signing out removes it.
- **`leaflock_signed_in`** — set only if you sign in, alongside the cookie above. A one-word label of your plan (for example `free` or `pro`) and nothing else, so the page can show you the right view at a glance without asking our server first. It is a display hint only: our server never reads it. Also strictly necessary for the same reason, and also removed on sign-out.
- **`leaflock_skin`** — set only if you pick a visual skin other than the default from the appearance menu, and only remembered between visits (for a year) if you're signed in on a Pro or Practice plan; for everyone else it lasts only until you close the browser. Carries nothing but which of the fifteen skins you chose. We treat this as strictly necessary too: you have to take an explicit action to set it, it exists only to give you back the thing you just asked for, and nothing about it is used to track or profile you — but we're not the final word on that reading, so [TO CONFIRM: whether the skin-choice cookie needs consent under the ePrivacy Directive, particularly for the year-long case].

[TO CONFIRM: that the hosting provider does not set any cookies of its own, such as bot-protection cookies — Cloudflare's own documentation says it does not unless we turn on a bot-protection feature; confirm nothing of that kind is enabled before relying on this]

## What we store in your browser instead

Cookies aren't the only way a website can store information in your browser. LeafLock PDF uses two other browser features, for limited purposes. Almost all of it stays on your device: the data isn't sent to us, and we can't read it. The one exception is your list of starred tools when you are signed in, described below.

### localStorage: your theme choice

The site saves your theme choice in your browser's localStorage under the name `theme`, so the next page you open uses the same one. The default is light, and nothing is saved until you press the theme button, which saves your choice of light or dark.

- **What it contains:** the word `light` or `dark`.
- **When it's set:** the first time you open the site, and again whenever you change it with the theme switch.
- **How long it lasts:** until you change the setting or clear the site's data.

### localStorage: your starred and recent tools

If you star a tool, the site saves the list in your browser's localStorage under the name `leaflock-starred`. It also keeps the tools you used recently, with the time you used them, under `leaflock-recent`, so the sidebar and your dashboard can show them. A few smaller entries remember whether you collapsed the sidebar's groups and which side it is docked to.

- **What it contains:** tool names, such as `merge`, and times. Never a file, a file name or anything you typed into a tool.
- **When it's set:** when you star or unstar a tool, or finish using one.
- **Does it leave your device:** the recent list never does. If you are signed in, your starred tools are also saved to your account so they follow you to other browsers, and you can download them with the rest of your account data. Signed out, they stay here.
- **How long it lasts:** until you unstar the tool, clear the list, or clear the site's data.

### Browser storage: the OCR model

The first time you use [OCR PDF](/ocr-pdf), your browser downloads an English text-recognition model of about 10 MB from leaflockpdf.com. The OCR engine saves it in your browser's storage (IndexedDB), so it doesn't need to be downloaded again next time.

- **What it contains:** the language model, which is the same file for every visitor. It contains nothing about you or your documents.
- **When it's set:** only when you use OCR PDF.
- **How long it lasts:** until you clear the site's data, or your browser removes it to free up space.

### The normal browser cache

Like every website, your browser may also keep copies of our pages, scripts, fonts and other files in its cache, so they load faster on your next visit. These are copies of our own files, not information about you.

## Why no consent banner

The items above are needed for features you choose to use, or are part of how browsers load any website. They aren't used to track you or for advertising, and no information from them is sent to us. [TO CONFIRM: that this storage is exempt from consent under the ePrivacy Directive and other applicable law]

## How to remove it

You can remove everything LeafLock PDF has stored by clearing the site data for leaflockpdf.com in your browser:

- **Chrome and Edge:** select the icon to the left of the address bar, then **Site settings** or **Cookies and site data**, and delete the data for this site.
- **Firefox:** select the padlock icon in the address bar, then **Clear cookies and site data**.
- **Safari on Mac:** go to **Settings > Privacy > Manage Website Data**, find leaflockpdf.com and remove it.
- **Safari on iPhone and iPad:** go to **Settings > Apps > Safari > Advanced > Website Data**, find leaflockpdf.com and remove it.

The site works the same afterward. Your theme goes back to the default (light), and OCR PDF downloads its model again the next time you use it.

## If this changes

We'll update this policy before any cookie is ever added to the site. If a future cookie needs your consent, we'll ask for it first, and you'll be able to say no without losing access to the tools.

For details on the other data we process, see the [Privacy policy](/privacy).

## Contact

For questions about this policy, email [hello@leaflockpdf.com](mailto:hello@leaflockpdf.com).
