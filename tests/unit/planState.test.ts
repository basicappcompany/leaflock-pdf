import { describe, expect, it } from 'vitest';
import {
  isNewerThan,
  paymentIsReversed,
  resolveStatus,
  updateFromPayment,
  updateFromSubscription,
  type DodoSubscriptionState,
} from '../../src/lib/server/planState';

const env = {
  DODO_PRODUCT_PRO_YEARLY: 'pdt_pro',
  DODO_PRODUCT_PRACTICE_YEARLY: 'pdt_practice',
  DODO_PRODUCT_LIFETIME: 'pdt_ten',
} as unknown as Env;

const now = Date.UTC(2027, 5, 1);
const future = '2027-12-01T00:00:00Z';
const past = '2027-01-01T00:00:00Z';

const sub = (overrides: Partial<DodoSubscriptionState>): DodoSubscriptionState => ({
  status: 'active',
  productId: 'pdt_pro',
  nextBillingDate: future,
  customerId: 'cus_1',
  subscriptionId: 'sub_1',
  ...overrides,
});
const user = { plan: 'free', current_period_end: null } as const;
const proUser = { plan: 'pro', current_period_end: Date.parse(future) } as const;

describe('updateFromSubscription', () => {
  it('grants the plan the product sells, paid through the next billing date', () => {
    expect(updateFromSubscription(env, sub({}), user, now)).toMatchObject({ plan: 'pro', planStatus: 'active', currentPeriodEnd: Date.parse(future) });
    expect(updateFromSubscription(env, sub({ productId: 'pdt_practice' }), user, now)).toMatchObject({ plan: 'practice' });
  });

  it('refuses to guess a tier for a product it does not know', () => {
    expect(() => updateFromSubscription(env, sub({ productId: 'pdt_other' }), user, now)).toThrow(/unrecognised product/);
  });

  it('keeps access while a renewal is past due', () => {
    expect(updateFromSubscription(env, sub({ status: 'past_due' }), proUser, now)).toMatchObject({ plan: 'pro', planStatus: 'past_due' });
  });

  it('lets a cancelled plan run to the end of the period already paid for', () => {
    expect(updateFromSubscription(env, sub({ status: 'cancelled' }), proUser, now)).toMatchObject({
      plan: 'pro',
      planStatus: 'cancelled',
      currentPeriodEnd: Date.parse(future),
    });
  });

  it('grants nothing for a cancelled subscription whose paid period is over or unknown', () => {
    expect(updateFromSubscription(env, sub({ status: 'cancelled', nextBillingDate: past }), user, now)).toMatchObject({ plan: 'free', planStatus: 'expired' });
    expect(updateFromSubscription(env, sub({ status: 'cancelled', nextBillingDate: null }), user, now)).toMatchObject({ plan: 'free', planStatus: 'expired' });
  });

  it.each(['paused', 'on_hold', 'expired', 'failed'])('takes the plan away while a subscription is %s', (status) => {
    expect(updateFromSubscription(env, sub({ status }), proUser, now)).toMatchObject({ plan: 'free', planStatus: 'expired', currentPeriodEnd: null });
  });

  it('leaves an account alone for a sale that has not completed, or a status it does not know', () => {
    expect(updateFromSubscription(env, sub({ status: 'pending' }), user, now)).toBeNull();
    expect(updateFromSubscription(env, sub({ status: undefined }), user, now)).toBeNull();
    expect(updateFromSubscription(env, sub({ status: 'something_new' }), user, now)).toBeNull();
  });

  it('keeps the subscription id when access is taken away, so a resume can restore it', () => {
    expect(updateFromSubscription(env, sub({ status: 'paused' }), proUser, now)).toMatchObject({ subscriptionId: 'sub_1' });
  });
});

describe('resolveStatus', () => {
  it('prefers the status in the payload, because a retried old event carries the latest state', () => {
    expect(resolveStatus('subscription.active', 'cancelled')).toBe('cancelled');
  });

  it('falls back to what the event name means when the payload has no usable status', () => {
    expect(resolveStatus('subscription.active', undefined)).toBe('active');
    expect(resolveStatus('subscription.paused', 'unheard_of')).toBe('paused');
    expect(resolveStatus('subscription.on_hold', undefined)).toBe('on_hold');
    expect(resolveStatus('subscription.plan_changed', undefined)).toBe('active');
  });

  it('has no opinion on events that are not about a subscription changing state', () => {
    expect(resolveStatus('subscription.update_payment_method', undefined)).toBeUndefined();
    expect(resolveStatus('payment.succeeded', 'succeeded')).toBeUndefined();
  });
});

describe('the ten-year payment', () => {
  const payment = { paymentId: 'pay_1', status: 'succeeded', productId: 'pdt_ten', customerId: 'cus_1', refundStatus: null, disputeStatus: null };

  it('grants the ten-year plan, with no end date, once the payment has succeeded', () => {
    expect(updateFromPayment(env, payment)).toMatchObject({ plan: 'lifetime', planStatus: 'active', currentPeriodEnd: null });
    expect(updateFromPayment(env, { ...payment, status: 'processing' })).toBeNull();
  });

  it('takes it back on a full refund or a lost dispute, but not on a partial refund', () => {
    expect(updateFromPayment(env, { ...payment, refundStatus: 'full' })).toMatchObject({ plan: 'free' });
    expect(updateFromPayment(env, { ...payment, disputeStatus: 'dispute_lost' })).toMatchObject({ plan: 'free' });
    expect(updateFromPayment(env, { ...payment, refundStatus: 'partial' })).toMatchObject({ plan: 'lifetime' });
    expect(updateFromPayment(env, { ...payment, disputeStatus: 'dispute_won' })).toMatchObject({ plan: 'lifetime' });
    expect(paymentIsReversed({ refundStatus: 'full', disputeStatus: null })).toBe(true);
  });

  it('ignores a payment for any other product, such as a subscription renewal', () => {
    expect(updateFromPayment(env, { ...payment, productId: 'pdt_pro' })).toBeNull();
  });
});

describe('isNewerThan', () => {
  it('applies a newer or equal event and drops an older one', () => {
    expect(isNewerThan(1000, 2000)).toBe(true);
    expect(isNewerThan(1000, 1000)).toBe(true);
    expect(isNewerThan(2000, 1000)).toBe(false);
  });

  it('applies an event that cannot be ordered, rather than risk losing a real change', () => {
    expect(isNewerThan(2000, null)).toBe(true);
    expect(isNewerThan(null, 1000)).toBe(true);
  });
});
