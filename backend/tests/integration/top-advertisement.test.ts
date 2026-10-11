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
  announcements: [
    {
      text: 'Complimentary shipping on orders over ₹999',
      url: '/shop',
      active: true,
    },
    {
      text: 'New arrivals this week',
      url: '',
      active: true,
    },
    {
      text: 'Hidden promo',
      url: '/hidden',
      active: false,
    },
  ],
  utilityItems: [
    {
      text: 'India storefront · Prices in INR',
      url: '',
      active: true,
    },
    {
      text: 'Complimentary shipping over ₹999',
      url: '/policies/shipping',
      active: true,
    },
  ],
  benefits: [
    {
      text: 'Free shipping',
      url: '',
      active: true,
    },
    {
      text: 'Secure payments',
      url: '/policies/privacy',
      active: true,
    },
    {
      text: 'Hidden benefit',
      url: '',
      active: false,
    },
  ],
};

describe('Admin top advertisement config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/top-advertisement');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no record exists', async () => {
    await createAdminUser({
      email: 'topad@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('topad@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/top-advertisement')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.announcements).toEqual([]);
    expect(res.body.data.utilityItems).toEqual([]);
    expect(res.body.data.benefits).toEqual([]);
  });

  it('upserts three sections and replaces on second save', async () => {
    await createAdminUser({
      email: 'topad@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('topad@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/top-advertisement')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.id).toBeTruthy();
    expect(createRes.body.data.announcements).toHaveLength(3);
    expect(createRes.body.data.utilityItems).toHaveLength(2);
    expect(createRes.body.data.benefits).toHaveLength(3);
    expect(createRes.body.data.benefits[0].text).toBe('Free shipping');
    expect(createRes.body.data.benefits[0].description).toBeUndefined();
    expect(createRes.body.data.benefits[0].iconKey).toBeUndefined();
    expect(createRes.body.data.benefits[0].order).toBeUndefined();

    const updateRes = await api()
      .put('/api/v1/admin/sites/IN/top-advertisement')
      .set('Authorization', `Bearer ${token}`)
      .send({
        announcements: [
          {
            text: 'Only one announcement',
            url: '',
            active: true,
          },
        ],
        utilityItems: basePayload.utilityItems,
        benefits: [
          {
            text: 'Account ready',
            url: '/account',
            active: true,
          },
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.id).toBe(createRes.body.data.id);
    expect(updateRes.body.data.announcements).toHaveLength(1);
    expect(updateRes.body.data.announcements[0].text).toBe(
      'Only one announcement',
    );
    expect(updateRes.body.data.benefits).toHaveLength(1);
    expect(updateRes.body.data.benefits[0].text).toBe('Account ready');
  });

  it('isolates IN and COM records', async () => {
    await createAdminUser({
      email: 'both@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN', 'COM'],
    });
    const token = await loginAs('both@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/top-advertisement')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        announcements: [
          {
            text: 'IN announcement',
            url: '',
            active: true,
          },
        ],
      });

    await api()
      .put('/api/v1/admin/sites/COM/top-advertisement')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        announcements: [
          {
            text: 'COM announcement',
            url: '',
            active: true,
          },
        ],
      });

    const inRes = await api()
      .get('/api/v1/admin/sites/IN/top-advertisement')
      .set('Authorization', `Bearer ${token}`);
    const comRes = await api()
      .get('/api/v1/admin/sites/COM/top-advertisement')
      .set('Authorization', `Bearer ${token}`);

    expect(inRes.body.data.announcements[0].text).toBe('IN announcement');
    expect(comRes.body.data.announcements[0].text).toBe('COM announcement');
    expect(inRes.body.data.id).not.toBe(comRes.body.data.id);
  });

  it('blocks IN-only admin from COM top advertisement', async () => {
    await createAdminUser({
      email: 'in-only@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('in-only@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/COM/top-advertisement')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('rejects invalid URLs', async () => {
    await createAdminUser({
      email: 'topad@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('topad@skindx.test', 'StrongPass1!xx');

    const badUrl = await api()
      .put('/api/v1/admin/sites/IN/top-advertisement')
      .set('Authorization', `Bearer ${token}`)
      .send({
        announcements: [
          {
            text: 'Bad link',
            url: 'not a valid url',
            active: true,
          },
        ],
        utilityItems: [],
        benefits: [],
      });

    expect(badUrl.status).toBe(422);
  });
});

describe('Public top advertisement config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns active items only for an active site', async () => {
    await createAdminUser({
      email: 'topad@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('topad@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/top-advertisement')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/top-advertisement');

    expect(res.status).toBe(200);
    expect(res.body.data.announcements).toHaveLength(2);
    expect(res.body.data.utilityItems).toHaveLength(2);
    expect(res.body.data.benefits).toHaveLength(2);
    expect(
      res.body.data.announcements.every(
        (item: { active: boolean }) => item.active,
      ),
    ).toBe(true);
  });

  it('returns empty defaults when no config is saved', async () => {
    const res = await api().get('/api/v1/sites/IN/top-advertisement');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.announcements).toEqual([]);
    expect(res.body.data.utilityItems).toEqual([]);
    expect(res.body.data.benefits).toEqual([]);
  });
});
