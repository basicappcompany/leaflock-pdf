import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { listStaleBillingUsers } from '../../../src/lib/server/db';

/**
 * Runs the real SQL of the sweep's batch query against a real SQLite database built from the real migrations, which
 * the pattern-matching fake used elsewhere cannot do.
 */
function database() {
  const sqlite = new DatabaseSync(':memory:');
  const dir = new URL('../../../migrations/', import.meta.url);
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()) {
    sqlite.exec(readFileSync(new URL(file, dir), 'utf8'));
  }
  const db = {
    prepare: (sql: string) => {
      let params: unknown[] = [];
      const statement = {
        bind: (...values: unknown[]) => {
          params = values;
          return statement;
        },
        all: async () => ({ results: sqlite.prepare(sql).all(...(params as never[])) }),
      };
      return statement;
    },
  } as unknown as D1Database;
  const insert = (id: string, plan: string, subscriptionId: string | null, paymentId: string | null, syncedAt: number | null) =>
    sqlite
      .prepare(`INSERT INTO users (id, email, created_at, plan, subscription_id, dodo_payment_id, billing_synced_at) VALUES (?, ?, 0, ?, ?, ?, ?)`)
      .run(id, `${id}@example.com`, plan, subscriptionId, paymentId, syncedAt);
  return { db, insert };
}

describe('the billing sweep batch (P3)', () => {
  it('is not filled by paid-plan rows that have no Dodo ids, which can never be marked as read', async () => {
    const { db, insert } = database();
    for (let i = 0; i < 25; i++) insert(`manual${i}`, 'practice', null, null, null);
    insert('real1', 'pro', 'sub_1', null, null);
    insert('real2', 'lifetime', null, 'pay_1', 5);

    const batch = await listStaleBillingUsers(db, 1_000_000, 20);
    expect(batch.map((user) => user.id).sort()).toEqual(['real1', 'real2']);
  });

  it('does not reappear in the next batch, and still qualifies once a Dodo id is attached', async () => {
    const { db, insert } = database();
    insert('manual', 'pro', null, null, null);
    expect(await listStaleBillingUsers(db, 1_000_000, 20)).toHaveLength(0);
    expect(await listStaleBillingUsers(db, 2_000_000, 20)).toHaveLength(0);

    const { db: later, insert: add } = database();
    add('manual', 'pro', 'sub_9', null, null);
    expect((await listStaleBillingUsers(later, 1_000_000, 20)).map((user) => user.id)).toEqual(['manual']);
  });

  it('still returns the stalest rows first and skips ones read recently', async () => {
    const { db, insert } = database();
    insert('old', 'pro', 'sub_a', null, 10);
    insert('never', 'pro', 'sub_b', null, null);
    insert('fresh', 'pro', 'sub_c', null, 999_999_999);
    expect((await listStaleBillingUsers(db, 1_000_000, 20)).map((user) => user.id)).toEqual(['never', 'old']);
  });
});
