import crypto from 'crypto';

jest.mock('@/config/env', () => ({
  env: {
    RAZORPAY_KEY_ID: 'rzp_test_key',
    RAZORPAY_KEY_SECRET: 'test_secret_value',
    RAZORPAY_WEBHOOK_SECRET: 'whsec_test_value',
  },
}));

import {
  verifyCheckoutSignature,
  verifyWebhookSignature,
} from '../razorpay.client';

describe('Razorpay signature helpers', () => {
  it('accepts a valid checkout signature', () => {
    const orderId = 'order_abc';
    const paymentId = 'pay_xyz';
    const signature = crypto
      .createHmac('sha256', 'test_secret_value')
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    expect(
      verifyCheckoutSignature({
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      }),
    ).toBe(true);
  });

  it('rejects a tampered checkout signature', () => {
    expect(
      verifyCheckoutSignature({
        razorpayOrderId: 'order_abc',
        razorpayPaymentId: 'pay_xyz',
        razorpaySignature: 'deadbeef',
      }),
    ).toBe(false);
  });

  it('accepts a valid webhook signature over the raw body', () => {
    const raw = Buffer.from('{"event":"payment.captured"}');
    const signature = crypto
      .createHmac('sha256', 'whsec_test_value')
      .update(raw)
      .digest('hex');
    expect(verifyWebhookSignature(raw, signature)).toBe(true);
  });

  it('rejects an invalid webhook signature', () => {
    const raw = Buffer.from('{"event":"payment.captured"}');
    expect(verifyWebhookSignature(raw, 'nope')).toBe(false);
  });
});
