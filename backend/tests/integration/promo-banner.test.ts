import request from 'supertest';
import { createApp } from '@/app';
import { createAdminUser, ensureSites, resetDatabase } from '../setup/db';

const app = createApp();
const api = () => request(app);

async function loginAs(email: string, password: string) {
  const res = await api().post('/api/v1/auth/admin/login').send({ email, password });
  expect(res.status).toBe(200);
  return res.body.data.accessToken as string;
}

const basePayload = {
  items: [
    {
      imageUrl: 'https://cdn.example.com/promo-1.jpg',
      imagePublicId: 'promo/1',
      buttonUrl: '/categories/serums',
      active: true,
    },
    {
      imageUrl: 'https://cdn.example.com/promo-2.jpg',
      imagePublicId: 'promo/2',
      buttonUrl: '/categories/cleansers',
      active: true,
    },
    {
      imageUrl: 'https://cdn.example.com/promo-hidden.jpg',
      imagePublicId: 'promo/hidden',
      buttonUrl: '/hidden',
      active: false,
    },
  ],
};

describe('Admin promo banner config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/promo-banners');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no record exists', async () => {
    await createAdminUser({
      email: 'promobanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('promobanner@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/promo-banners')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.items).toEqual([]);
  });

  it('upserts items and replaces on second save', async () => {
    await createAdminUser({
      email: 'promobanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('promobanner@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/promo-banners')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.id).toBeTruthy();
    expect(createRes.body.data.items).toHaveLength(3);

    const replaceRes = await api()
      .put('/api/v1/admin/sites/IN/promo-banners')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            imageUrl: 'https://cdn.example.com/promo-only.jpg',
            imagePublicId: 'promo/only',
            buttonUrl: '/shop',
            active: true,
          },
        ],
      });

    expect(replaceRes.status).toBe(200);
    expect(replaceRes.body.data.items).toHaveLength(1);
    expect(replaceRes.body.data.items[0].imagePublicId).toBe('promo/only');
  });

  it('keeps site scope between IN and COM', async () => {
    await createAdminUser({
      email: 'promobanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'SUPER_ADMIN',
      siteCodes: ['IN', 'COM'],
    });
    const token = await loginAs('promobanner@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/promo-banners')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    await api()
      .put('/api/v1/admin/sites/COM/promo-banners')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [
          {
            imageUrl: 'https://cdn.example.com/com.jpg',
            imagePublicId: 'promo/com',
            buttonUrl: '/com',
            active: true,
          },
        ],
      });

    const inRes = await api()
      .get('/api/v1/admin/sites/IN/promo-banners')
      .set('Authorization', `Bearer ${token}`);
    const comRes = await api()
      .get('/api/v1/admin/sites/COM/promo-banners')
      .set('Authorization', `Bearer ${token}`);

    expect(inRes.body.data.items).toHaveLength(3);
    expect(comRes.body.data.items).toHaveLength(1);
  });
});

describe('Public promo banner config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns only active items', async () => {
    await createAdminUser({
      email: 'promobanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('promobanner@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/promo-banners')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/promo-banners');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items.every((item: { active: boolean }) => item.active)).toBe(
      true,
    );
  });

  it('returns empty defaults when unset', async () => {
    const res = await api().get('/api/v1/sites/IN/promo-banners');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });
});
