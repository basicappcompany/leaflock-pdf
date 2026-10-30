import { describe, expect, it } from 'vitest';
import { onRequestPost, sanitize } from '../../functions/api/errors';
import { browserFamily, buildReport, scrubMessage, scrubStack } from '../../src/lib/errorReporting';

const origin = 'https://leaflockpdf.com';

describe('scrubMessage', () => {
  it('removes file names, quoted text and local URLs', () => {
    const message = scrubMessage(
      'Failed on Salary Slip March.pdf and scan_01.JPG: unexpected "Confidential – Asha Rao" at blob:https://leaflockpdf.com/1234',
    );
    expect(message).not.toMatch(/Salary|scan_01|Asha|blob:/);
    expect(message).toContain('[file]');
    expect(message).toContain('[text]');
    expect(message).toContain('[url]');
  });

  it('keeps ordinary technical messages readable', () => {
    expect(scrubMessage('Cannot read properties of undefined (reading width)')).toBe(
      'Cannot read properties of undefined (reading width)',
    );
  });

  it('caps the length', () => {
    expect(scrubMessage('x'.repeat(1000)).length).toBeLessThanOrEqual(301);
  });
});

describe('scrubStack', () => {
  it('keeps only our frames, as paths without query strings', () => {
    const stack = [
      'TypeError: boom',
      `    at merge (${origin}/_astro/MergeTool.abc123.js?v=9:1:200)`,
      '    at chrome-extension://abcdef/content.js:4:2',
      `    at run (${origin}/_astro/client.def456.js:2:30)`,
    ].join('\n');
    expect(scrubStack(stack, origin)).toEqual([
      'at merge (/_astro/MergeTool.abc123.js:1:200)',
      'at run (/_astro/client.def456.js:2:30)',
    ]);
  });
});

describe('browserFamily', () => {
  it('names the browser and major version only', () => {
    expect(
      browserFamily('Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.1'),
    ).toBe('Edge 141');
    expect(browserFamily('Mozilla/5.0 (Macintosh) Gecko/20100101 Firefox/133.0')).toBe('Firefox 133');
    expect(
      browserFamily('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'),
    ).toBe('Safari 18');
  });
});

describe('buildReport', () => {
  it('builds a report with nothing identifying in it', () => {
    const error = new Error('Could not draw page of "Passport scan.pdf"');
    const report = buildReport(error, 'job', {
      tool: 'merge',
      origin,
      path: '/merge-pdf/',
      userAgent: 'Mozilla/5.0 Firefox/133.0',
    });
    expect(report).toMatchObject({ v: 1, kind: 'job', tool: 'merge', name: 'Error', page: '/merge-pdf/', browser: 'Firefox 133' });
    expect(JSON.stringify(report)).not.toContain('Passport');
  });
});

describe('error collector', () => {
  const valid = { v: 1, kind: 'error', tool: 'merge', name: 'TypeError', message: 'x is undefined', stack: ['at a (/_astro/a.js:1:1)'], page: '/merge-pdf/', browser: 'Chrome 141' };

  it('accepts a valid report and drops unknown fields', () => {
    expect(sanitize({ ...valid, ip: '1.2.3.4', fileName: 'secret.pdf' })).toEqual(valid);
  });

  it('rejects malformed reports', () => {
    expect(sanitize({ ...valid, v: 2 })).toBeNull();
    expect(sanitize({ ...valid, kind: 'anything' })).toBeNull();
    expect(sanitize('hello')).toBeNull();
  });

  it('answers 204, 400 and 413', async () => {
    const post = (body: string) => onRequestPost({ request: new Request('https://leaflockpdf.com/api/errors', { method: 'POST', body }) });
    expect((await post(JSON.stringify(valid))).status).toBe(204);
    expect((await post('not json')).status).toBe(400);
    expect((await post('x'.repeat(9000))).status).toBe(413);
  });
});
