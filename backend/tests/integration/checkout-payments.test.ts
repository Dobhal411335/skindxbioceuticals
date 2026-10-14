import crypto from 'crypto';
import request from 'supertest';
import { createApp } from '@/app';
import { createTokenPair } from '@/lib/jwt';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { ensureSites, resetDatabase } from '../setup/db';

jest.mock('@/lib/integrations/razorpay.client', () => ({
  createRazorpayOrder: jest.fn(async ({ amountInPaise, currency, receipt }) => ({
    id: `order_test_${receipt}`,
    amount: amountInPaise,
    currency,
    status: 'created',
    receipt,
  })),
  verifyCheckoutSignature: jest.fn(({ razorpaySignature }) => razorpaySignature === 'valid-sig'),
  verifyWebhookSignature: jest.fn((raw: Buffer, signature: string) => {
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'whsec_test_placeholder')
      .update(raw)
      .digest('hex');
    return expected === signature;
  }),
  getRazorpayPublicKeyId: jest.fn(() => 'rzp_test_key'),
  resetRazorpayClientForTests: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  emailService: {
    sendOtpEmail: jest.fn(async () => ({ messageId: 'otp-1' })),
    sendOrderConfirmationEmail: jest.fn(async () => ({ messageId: 'conf-1' })),
  },
}));

const app = createApp();

describe('checkout payments integration', () => {
  let siteId: string;
  let variantId: string;

  beforeEach(async () => {
    await resetDatabase();
    const sites = await ensureSites();
    siteId = sites.inId;

    const product = await prisma.product.create({
      data: {
        siteId,
        productCode: `CHK-${Date.now()}`,
        name: 'Checkout Test Serum',
        slug: `checkout-test-${Date.now()}`,
        status: 'ACTIVE',
        variants: {
          create: {
            name: '30 ml',
            price: '499.00',
            currency: 'INR',
            isActive: true,
            inventory: {
              create: { quantityOnHand: 20, quantityReserved: 0 },
            },
          },
        },
      },
      include: { variants: true },
    });
    variantId = product.variants[0]!.id;
  });

  it('blocks guest payment before email OTP verification', async () => {
    const sessionRes = await request(app)
      .post('/api/v1/checkout/guest/session')
      .send({ email: `guest-${Date.now()}@example.com` });
    expect(sessionRes.status).toBe(201);
    const sessionToken = sessionRes.body.data.sessionToken as string;

    const payRes = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Idempotency-Key', `idem_${Date.now()}`)
      .send({
        guestSessionToken: sessionToken,
        items: [{ variantId, quantity: 1 }],
        shippingAddress: {
          lastName: 'Guest',
          line1: '1 Test Road',
          city: 'Mumbai',
          postalCode: '400001',
          country: 'IN',
        },
      });

    expect(payRes.status).toBe(403);
  });

  it('allows verified guest checkout create-order idempotently', async () => {
    const email = `paid-guest-${Date.now()}@example.com`;
    const sessionRes = await request(app)
      .post('/api/v1/checkout/guest/session')
      .send({ email });
    const sessionToken = sessionRes.body.data.sessionToken as string;

    // Mark session verified directly (OTP email is mocked; avoid reading OTP from logs)
    const { sha256 } = await import('@/lib/crypto');
    const tokenHash = sha256(sessionToken);
    await prisma.guestCheckoutSession.update({
      where: { tokenHash },
      data: { emailVerifiedAt: new Date() },
    });

    const idem = `idem_guest_${Date.now()}`;
    const body = {
      guestSessionToken: sessionToken,
      items: [{ variantId, quantity: 1 }],
      shippingAddress: {
        lastName: 'Guest',
        line1: '1 Test Road',
        city: 'Mumbai',
        postalCode: '400001',
        country: 'IN',
      },
    };

    const first = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Idempotency-Key', idem)
      .send(body);
    expect(first.status).toBe(200);
    expect(first.body.data.razorpayOrderId).toBeTruthy();
    expect(first.body.data.orderId).toBeTruthy();

    const second = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Idempotency-Key', idem)
      .send(body);
    expect(second.status).toBe(200);
    expect(second.body.data.orderId).toBe(first.body.data.orderId);
    expect(second.body.data.razorpayOrderId).toBe(first.body.data.razorpayOrderId);
  });

  it('rejects verification with an invalid signature', async () => {
    const passwordHash = await hashPassword('Password1!');
    const user = await prisma.user.create({
      data: {
        email: `buyer-${Date.now()}@example.com`,
        passwordHash,
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        firstName: 'Buyer',
      },
    });
    const tokens = createTokenPair({
      sub: user.id,
      email: user.email,
      role: 'CUSTOMER',
    });

    const create = await request(app)
      .post('/api/v1/payments/create-order')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .set('Idempotency-Key', `idem_auth_${Date.now()}`)
      .send({
        items: [{ variantId, quantity: 1 }],
        shippingAddress: {
          lastName: 'Buyer',
          line1: '2 Auth Lane',
          city: 'Pune',
          postalCode: '411001',
          country: 'IN',
        },
      });
    expect(create.status).toBe(200);

    const badVerify = await request(app)
      .post('/api/v1/payments/verify')
      .set('Authorization', `Bearer ${tokens.accessToken}`)
      .send({
        orderId: create.body.data.orderId,
        razorpayOrderId: create.body.data.razorpayOrderId,
        razorpayPaymentId: 'pay_fake',
        razorpaySignature: 'invalid',
      });
    expect(badVerify.status).toBe(422);
  });
});
