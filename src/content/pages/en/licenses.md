---
title: Open-source licenses
description: The open-source software LeafLock PDF ships to your browser, and the license each one is used under.
updated: 2026-11-03
---

LeafLock PDF is closed source, but the tools are built on open-source libraries that do the real work of reading, rendering and converting PDFs. This page lists every one that ships code to your browser, and the license it's used under. It's generated from the project's own dependency list, not typed out by hand, so it stays accurate as dependencies change.

Build tools (TypeScript, the test runner, the bundler) aren't listed here — they never leave our build machine, so nothing about them reaches you.

## MIT License

The following are used under the MIT License. Each copyright notice belongs to that project; the license text below applies to all of them.

- **Astro** 7.4.1 — Copyright (c) 2021 Fred K. Schott — [astro.build](https://astro.build)
- **@astrojs/react** 7.1.0 (Astro's React integration) — Copyright (c) 2021 Fred K. Schott
- **@cantoo/pdf-lib** 2.11.1 — Copyright (c) 2019 Andrew Dillon — [npmjs.com/package/@cantoo/pdf-lib](https://www.npmjs.com/package/@cantoo/pdf-lib)
- **@tesseract.js-data/eng** 1.0.0 (the English text-recognition model used by OCR PDF) — [npmjs.com/package/@tesseract.js-data/eng](https://www.npmjs.com/package/@tesseract.js-data/eng)
- **docx** 9.15.0 — Copyright (c) 2016 Dolan — [npmjs.com/package/docx](https://www.npmjs.com/package/docx)
- **fflate** 0.8.3 — Copyright (c) 2026 Arjun Barrett — [npmjs.com/package/fflate](https://www.npmjs.com/package/fflate)
- **flag-icons** 7.6.0 (the country flags on the language button, served as separate files from `/vendor/flags/`) — Copyright (c) 2013 Panayiotis Lipiridis — [npmjs.com/package/flag-icons](https://www.npmjs.com/package/flag-icons)
- **React** 19.3.1 — Copyright (c) Meta Platforms, Inc. and affiliates. — [react.dev](https://react.dev)
- **React DOM** 19.3.1 — Copyright (c) Meta Platforms, Inc. and affiliates.
- **read-excel-file** 9.3.13 — Copyright (c) 2018 gitlab.com/catamphetamine — [npmjs.com/package/read-excel-file](https://www.npmjs.com/package/read-excel-file)
- **write-excel-file** 4.1.1 — Copyright (c) 2018 gitlab.com/catamphetamine — [npmjs.com/package/write-excel-file](https://www.npmjs.com/package/write-excel-file)

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## BSD 2-Clause License

- **mammoth** 1.13.0 (reads `.docx` files for Word to PDF) — Copyright (c) 2013, Michael Williamson — [npmjs.com/package/mammoth](https://www.npmjs.com/package/mammoth)

> Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
>
> 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
> 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
>
> THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

## Apache License 2.0

- **pdf.js** (`pdfjs-dist`) 6.4.299 — Mozilla and the pdf.js project's contributors — renders and reads PDF files in every tool. [github.com/mozilla/pdf.js](https://github.com/mozilla/pdf.js)
- **Tesseract.js** 7.0.0 — the Tesseract.js project ([github.com/naptha/tesseract.js](https://github.com/naptha/tesseract.js)) and its contributors — recognizes text in scanned pages for OCR PDF.

Full text: [apache.org/licenses/LICENSE-2.0](https://www.apache.org/licenses/LICENSE-2.0).

## GNU Lesser General Public License 3.0

- **libheif-js** 1.23.5 — decodes `.heic` photos for the HEIC-to-PDF tools. [github.com/catdad-experiments/libheif-js](https://github.com/catdad-experiments/libheif-js)

libheif-js is **LGPL-3.0**, a copyleft license that still permits use in closed-source products like this one, on one condition: the library has to stay a component you could swap out, not code compiled into ours. That's why it's loaded as a separate file (`/vendor/libheif/libheif.js` and `libheif.wasm`) rather than bundled into any tool's code — it's shipped exactly as it was published, unmodified. The library's own license text ships alongside it: [/vendor/libheif/LICENSE](/vendor/libheif/LICENSE).

## About this list

Generated from `package.json`'s runtime `dependencies` against the exact versions installed, not a general description of what the project might use. If something here looks wrong, or you believe a license obligation isn't being met, [contact us](/contact) and we'll look into it right away.
