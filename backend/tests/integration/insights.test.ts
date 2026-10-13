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
  cards: [
    {
      category: 'Skin Care',
      name: 'Skin whitening with new technology',
      publishedAt: '2025-11-22T00:00:00.000Z',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/sample.jpg',
      imagePublicId: 'insights/sample',
      description: '<p>Full TipTap description about formulation notes.</p>',
      active: true,
      order: 1,
    },
    {
      category: 'Wellness',
      name: 'Anti aging with vitamin C',
      publishedAt: '2025-11-22T00:00:00.000Z',
      imageUrl: '',
      imagePublicId: '',
      description: '<p>Inactive card should not appear publicly.</p>',
      active: false,
      order: 2,
    },
  ],
  qaItems: [
    {
      question: 'Online store with a wide selection?',
      answer: '<p>Browse curated catalogue picks with clear labels.</p>',
      active: true,
      order: 1,
    },
    {
      question: 'Inactive question',
      answer: '<p>Hidden from public.</p>',
      active: false,
      order: 2,
    },
  ],
};

describe('Admin Insights config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/insights');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no insights exist', async () => {
    await createAdminUser({
      email: 'insights@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('insights@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/insights')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.cards).toEqual([]);
    expect(res.body.data.qaItems).toEqual([]);
  });

  it('upserts cards/Q&A and replaces on second save', async () => {
    await createAdminUser({
      email: 'insights@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('insights@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/insights')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.cards).toHaveLength(2);
    expect(createRes.body.data.qaItems).toHaveLength(2);
    expect(createRes.body.data.cards[0].name).toBe(
      'Skin whitening with new technology',
    );

    const updateRes = await api()
      .put('/api/v1/admin/sites/IN/insights')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cards: [
          {
            category: 'Brand',
            name: 'Packaging clarity',
            publishedAt: '2026-01-10T00:00:00.000Z',
            imageUrl: '',
            imagePublicId: '',
            description: '<p>Updated description</p>',
            active: true,
            order: 1,
          },
        ],
        qaItems: [
          {
            question: 'Updated question?',
            answer: '<p>Updated answer</p>',
            active: true,
            order: 1,
          },
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.cards).toHaveLength(1);
    expect(updateRes.body.data.cards[0].name).toBe('Packaging clarity');
    expect(updateRes.body.data.qaItems).toHaveLength(1);
    expect(updateRes.body.data.qaItems[0].question).toBe('Updated question?');
  });

  it('blocks admin without site membership', async () => {
    await createAdminUser({
      email: 'com-only@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['COM'],
    });
    const token = await loginAs('com-only@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/insights')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('Public Insights config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns only active cards and Q&A', async () => {
    await createAdminUser({
      email: 'insights@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('insights@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/insights')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/insights');
    expect(res.status).toBe(200);
    expect(res.body.data.cards).toHaveLength(1);
    expect(res.body.data.cards[0].name).toBe(
      'Skin whitening with new technology',
    );
    expect(res.body.data.qaItems).toHaveLength(1);
    expect(res.body.data.qaItems[0].question).toBe(
      'Online store with a wide selection?',
    );
  });

  it('keeps IN and COM insights isolated', async () => {
    await createAdminUser({
      email: 'insights@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN', 'COM'],
    });
    const token = await loginAs('insights@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/insights')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cards: [
          {
            category: 'IN',
            name: 'IN card',
            publishedAt: '2025-11-22T00:00:00.000Z',
            imageUrl: '',
            imagePublicId: '',
            description: '<p>IN</p>',
            active: true,
            order: 1,
          },
        ],
        qaItems: [],
      });

    await api()
      .put('/api/v1/admin/sites/COM/insights')
      .set('Authorization', `Bearer ${token}`)
      .send({
        cards: [
          {
            category: 'COM',
            name: 'COM card',
            publishedAt: '2025-11-22T00:00:00.000Z',
            imageUrl: '',
            imagePublicId: '',
            description: '<p>COM</p>',
            active: true,
            order: 1,
          },
        ],
        qaItems: [],
      });

    const inRes = await api().get('/api/v1/sites/IN/insights');
    const comRes = await api().get('/api/v1/sites/COM/insights');
    expect(inRes.body.data.cards[0].name).toBe('IN card');
    expect(comRes.body.data.cards[0].name).toBe('COM card');
  });
});
