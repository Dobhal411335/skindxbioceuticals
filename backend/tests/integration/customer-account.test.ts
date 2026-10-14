import request from 'supertest';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { sha256 } from '@/lib/crypto';
import { createTokenPair } from '@/lib/jwt';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { expiresAtFromDuration } from '@/lib/tokenExpiry';
import { ensureSites, resetDatabase } from '../setup/db';

const app = createApp();
const api = () => request(app);

const STRONG_PASSWORD = 'StrongPass1!xx';

async function createCustomer(email: string, name = 'Ada Lovelace') {
  const [firstName, ...rest] = name.split(' ');
  return prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(STRONG_PASSWORD),
      firstName: firstName ?? 'Ada',
      lastName: rest.join(' ') || null,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    },
  });
}

async function authHeaderFor(userId: string, email: string) {
  const tokens = createTokenPair({
    sub: userId,
    email,
    role: 'CUSTOMER',
  });
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: sha256(tokens.refreshToken),
      expiresAt: expiresAtFromDuration(env.JWT_REFRESH_EXPIRES_IN),
    },
  });
  return { Authorization: `Bearer ${tokens.accessToken}` };
}

async function seedProduct(siteId: string) {
  const product = await prisma.product.create({
    data: {
      siteId,
      productCode: `BS-${Date.now()}`,
      name: 'Barrier Serum',
      slug: `barrier-serum-${Date.now()}`,
      status: 'ACTIVE',
      variants: {
        create: {
          sku: `BS-30-${Date.now()}`,
          name: '30ml',
          price: '1299.00',
          currency: 'INR',
          isActive: true,
          inventory: {
            create: {
              quantityOnHand: 10,
              quantityReserved: 0,
            },
          },
        },
      },
    },
    include: { variants: true },
  });
  return product;
}

describe('Customer account APIs', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  describe('/me profile and addresses', () => {
    it('updates profile name fields only', async () => {
      const user = await createCustomer('ada@skindx.test');
      const headers = await authHeaderFor(user.id, user.email);

      const res = await api()
        .patch('/api/v1/me')
        .set(headers)
        .send({ firstName: 'Ada', lastName: 'King' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.firstName).toBe('Ada');
      expect(res.body.data.user.lastName).toBe('King');
      expect(res.body.data.user.email).toBe('ada@skindx.test');
      expect(res.body.data.user.hasPassword).toBe(true);
    });

    it('rejects avatar upload without a file and clears avatar', async () => {
      const user = await createCustomer('avatar@skindx.test');
      const headers = await authHeaderFor(user.id, user.email);

      await prisma.user.update({
        where: { id: user.id },
        data: { imageUrl: 'https://cdn.example.com/old.jpg' },
      });

      const missing = await api().post('/api/v1/me/avatar').set(headers);
      expect(missing.status).toBe(422);

      const cleared = await api().delete('/api/v1/me/avatar').set(headers);
      expect(cleared.status).toBe(200);
      expect(cleared.body.data.user.imageUrl).toBeNull();
    });

    it('enforces address ownership across customers', async () => {
      const owner = await createCustomer('owner@skindx.test', 'Owner User');
      const other = await createCustomer('other@skindx.test', 'Other User');
      const ownerHeaders = await authHeaderFor(owner.id, owner.email);
      const otherHeaders = await authHeaderFor(other.id, other.email);

      const created = await api()
        .post('/api/v1/me/addresses')
        .set(ownerHeaders)
        .send({
          line1: '12 MG Road',
          city: 'Bengaluru',
          state: 'KA',
          postalCode: '560001',
          country: 'IN',
          isDefault: true,
        });

      expect(created.status).toBe(201);
      const addressId = created.body.data.address.id as string;

      const leaked = await api()
        .patch(`/api/v1/me/addresses/${addressId}`)
        .set(otherHeaders)
        .send({ city: 'Mumbai' });
      expect(leaked.status).toBe(404);

      const deleteLeak = await api()
        .delete(`/api/v1/me/addresses/${addressId}`)
        .set(otherHeaders);
      expect(deleteLeak.status).toBe(404);

      const listOther = await api().get('/api/v1/me/addresses').set(otherHeaders);
      expect(listOther.status).toBe(200);
      expect(listOther.body.data.addresses).toEqual([]);

      const listOwner = await api().get('/api/v1/me/addresses').set(ownerHeaders);
      expect(listOwner.body.data.addresses).toHaveLength(1);
    });

    it('requires authentication', async () => {
      const res = await api().get('/api/v1/me/addresses');
      expect(res.status).toBe(401);
    });
  });

  describe('/orders', () => {
    it('returns only the authenticated customer orders', async () => {
      const sites = await ensureSites();
      const owner = await createCustomer('buyer@skindx.test', 'Buyer One');
      const other = await createCustomer('buyer2@skindx.test', 'Buyer Two');
      const ownerHeaders = await authHeaderFor(owner.id, owner.email);
      const otherHeaders = await authHeaderFor(other.id, other.email);

      const product = await seedProduct(sites.inId);
      const variant = product.variants[0]!;

      const order = await prisma.order.create({
        data: {
          siteId: sites.inId,
          orderNumber: 'IN-1001',
          userId: owner.id,
          status: 'CONFIRMED',
          currency: 'INR',
          contactEmail: owner.email.toLowerCase(),
          subtotal: '1299.00',
          grandTotal: '1299.00',
          shippingAddress: {
            line1: '12 MG Road',
            city: 'Bengaluru',
            state: 'KA',
            postalCode: '560001',
            country: 'IN',
          },
          placedAt: new Date(),
          items: {
            create: {
              variantId: variant.id,
              productName: product.name,
              variantName: variant.name,
              sku: variant.sku ?? 'BS-30',
              unitPrice: '1299.00',
              quantity: 1,
              lineTotal: '1299.00',
            },
          },
          payments: {
            create: {
              status: 'CAPTURED',
              method: 'UPI',
              amount: '1299.00',
              amountInPaise: 129900,
              currency: 'INR',
              provider: 'razorpay',
            },
          },
        },
      });

      const listOwner = await api().get('/api/v1/orders').set(ownerHeaders);
      expect(listOwner.status).toBe(200);
      expect(listOwner.body.data.orders).toHaveLength(1);
      expect(listOwner.body.data.orders[0].orderNumber).toBe('IN-1001');

      const listOther = await api().get('/api/v1/orders').set(otherHeaders);
      expect(listOther.status).toBe(200);
      expect(listOther.body.data.orders).toEqual([]);

      const detailLeak = await api()
        .get(`/api/v1/orders/${order.id}`)
        .set(otherHeaders);
      expect(detailLeak.status).toBe(404);

      const detail = await api().get(`/api/v1/orders/${order.id}`).set(ownerHeaders);
      expect(detail.status).toBe(200);
      expect(detail.body.data.order.items).toHaveLength(1);
    });
  });

  describe('/wishlist', () => {
    it('adds, lists, and removes wishlist items with ownership checks', async () => {
      const sites = await ensureSites();
      const owner = await createCustomer('wish@skindx.test', 'Wish User');
      const other = await createCustomer('wish2@skindx.test', 'Wish Two');
      const ownerHeaders = await authHeaderFor(owner.id, owner.email);
      const otherHeaders = await authHeaderFor(other.id, other.email);
      const product = await seedProduct(sites.inId);

      const added = await api()
        .post('/api/v1/wishlist')
        .set(ownerHeaders)
        .send({ productId: product.id });
      expect(added.status).toBe(201);
      const itemId = added.body.data.item.id as string;

      const list = await api().get('/api/v1/wishlist').set(ownerHeaders);
      expect(list.status).toBe(200);
      expect(list.body.data.wishlist.items).toHaveLength(1);

      const listOther = await api().get('/api/v1/wishlist').set(otherHeaders);
      expect(listOther.body.data.wishlist.items).toEqual([]);

      const removeLeak = await api()
        .delete(`/api/v1/wishlist/items/${itemId}`)
        .set(otherHeaders);
      expect(removeLeak.status).toBe(404);

      const removed = await api()
        .delete(`/api/v1/wishlist/items/${itemId}`)
        .set(ownerHeaders);
      expect(removed.status).toBe(204);

      const after = await api().get('/api/v1/wishlist').set(ownerHeaders);
      expect(after.body.data.wishlist.items).toEqual([]);
    });

    it('rejects unauthenticated wishlist sync', async () => {
      const response = await api()
        .post('/api/v1/wishlist/sync')
        .send({ items: [] });
      expect(response.status).toBe(401);
    });

    it('merges guest wishlist items without duplicating existing products', async () => {
      const sites = await ensureSites();
      const owner = await createCustomer('wish.sync@skindx.test', 'Wish Sync');
      const ownerHeaders = await authHeaderFor(owner.id, owner.email);
      const productA = await seedProduct(sites.inId);
      const productB = await prisma.product.create({
        data: {
          siteId: sites.inId,
          productCode: 'RC-SYNC-1',
          name: 'Repair Cream',
          slug: 'repair-cream-sync',
          status: 'ACTIVE',
          variants: {
            create: {
              sku: 'RC-50-SYNC',
              name: '50ml',
              price: '999.00',
              currency: 'INR',
              isActive: true,
              inventory: {
                create: { quantityOnHand: 8, quantityReserved: 0 },
              },
            },
          },
        },
        include: { variants: true },
      });
      const draft = await prisma.product.create({
        data: {
          siteId: sites.inId,
          productCode: 'DR-SYNC-1',
          name: 'Draft Only',
          slug: 'draft-only-sync',
          status: 'DRAFT',
        },
      });

      await api()
        .post('/api/v1/wishlist')
        .set(ownerHeaders)
        .send({ productId: productA.id });

      const sync = await api()
        .post('/api/v1/wishlist/sync')
        .set(ownerHeaders)
        .set('Idempotency-Key', 'wishlist-sync-test-1')
        .send({
          items: [
            { productId: productA.id },
            { productId: productB.id, variantId: productB.variants[0]?.id },
            { productId: draft.id },
            { productId: productB.id },
          ],
        });

      expect(sync.status).toBe(200);
      expect(sync.body.data.wishlist.items).toHaveLength(2);
      expect(sync.body.data.skipped).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productId: draft.id,
            reason: 'INACTIVE_OR_WRONG_SITE',
          }),
        ]),
      );

      const again = await api()
        .post('/api/v1/wishlist/sync')
        .set(ownerHeaders)
        .set('Idempotency-Key', 'wishlist-sync-test-1')
        .send({
          items: [{ productId: productA.id }, { productId: productB.id }],
        });
      expect(again.status).toBe(200);
      expect(again.body.data.wishlist.items).toHaveLength(2);
    });
  });
});
