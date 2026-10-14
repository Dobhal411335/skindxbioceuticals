import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '@/config/env';
import { logger } from '@/lib/logger';

export type RazorpayOrderResult = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
};

let client: Razorpay | null = null;

function getClient(): Razorpay {
  if (!client) {
    client = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
  return client;
}

/** Create a Razorpay order. Amount must already be in paise for INR. */
export async function createRazorpayOrder(input: {
  amountInPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrderResult> {
  try {
    const order = await getClient().orders.create({
      amount: input.amountInPaise,
      currency: input.currency,
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    });

    return {
      id: String(order.id),
      amount: Number(order.amount),
      currency: String(order.currency),
      status: String(order.status),
      receipt: order.receipt ? String(order.receipt) : undefined,
    };
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? { message: error.message, name: error.name } : error },
      'Razorpay order creation failed',
    );
    throw error;
  }
}

/**
 * Official checkout signature:
 * HMAC SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyCheckoutSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const payload = `${input.razorpayOrderId}|${input.razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(input.razorpaySignature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Official webhook signature:
 * HMAC SHA256(rawBody, webhook_secret) compared to X-Razorpay-Signature
 */
export function verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getRazorpayPublicKeyId(): string {
  return env.RAZORPAY_KEY_ID;
}

/** Test helper — reset singleton between tests. */
export function resetRazorpayClientForTests(): void {
  client = null;
}
