/**
 * Cloudflare Pages Function: receives crash reports from src/lib/errorReporting.ts.
 *
 * Privacy: we read only the JSON body. No IP address, cookie or other request header is
 * logged or stored. Reports are re-checked here, so a forged request can't log arbitrary data.
 * For now reports go to the Functions log; storage and GitHub issues come with the
 * self-healing loop.
 */

const MAX_BODY = 8 * 1024;

interface Report {
  v: 1;
  kind: string;
  tool: string | null;
  name: string;
  message: string;
  stack: string[];
  page: string;
  browser: string;
}

function text(value: unknown, max: number): string | null {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

/** Keeps only the fields and sizes the client is allowed to send. */
export function sanitize(input: unknown): Report | null {
  if (typeof input !== 'object' || input === null) return null;
  const body = input as Record<string, unknown>;
  const kind = text(body['kind'], 20);
  const name = text(body['name'], 60);
  const message = text(body['message'], 320);
  const page = text(body['page'], 100);
  const browser = text(body['browser'], 40);
  if (body['v'] !== 1 || !kind || !['error', 'unhandled', 'job'].includes(kind) || name === null || message === null || !page || !browser) {
    return null;
  }
  const stack = Array.isArray(body['stack'])
    ? body['stack'].filter((line): line is string => typeof line === 'string').slice(0, 12).map((line) => line.slice(0, 200))
    : [];
  return { v: 1, kind, tool: text(body['tool'], 40), name, message, stack, page, browser };
}

export async function onRequestPost({ request }: { request: Request }): Promise<Response> {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_BODY) return new Response(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const report = sanitize(parsed);
  if (!report) return new Response(null, { status: 400 });

  console.log(JSON.stringify({ type: 'client-error', receivedAt: new Date().toISOString(), ...report }));
  return new Response(null, { status: 204 });
}
