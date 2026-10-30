/**
 * Cloudflare Pages Function: hands the signed-in visitor everything we hold about
 * them, as a JSON file. Required by the GDPR and India's DPDP Act, and cheap to
 * honour here because we hold so little: no files, no file names, no raw IP.
 */

import { exportAccount } from '../../../src/lib/server/db';
import { readSessionFromRequest } from '../../../src/lib/server/session';

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return new Response(null, { status: 401 });

  const data = await exportAccount(env.DB, session.userId);
  if (!data) return new Response(null, { status: 404 });

  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      note: 'This is everything LeafLock PDF holds about your account. Your documents are never uploaded, so none appear here.',
      ...data,
    },
    null,
    2,
  );

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leaflock-account.json"',
    },
  });
}
