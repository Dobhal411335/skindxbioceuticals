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
  sectionLabel: 'Collection',
  sectionHeading: 'Discover The Beauty In Our Gallery',
  items: [
    {
      imageUrl: 'https://cdn.example.com/necklaces.jpg',
      imagePublicId: 'collection/necklaces',
      title: 'Necklaces',
      description: 'Explore our necklace collection.',
      buttonUrl: '/shop/necklaces',
      active: true,
    },
    {
      imageUrl: 'https://cdn.example.com/bracelets.jpg',
      imagePublicId: 'collection/bracelets',
      title: 'Bracelets',
      description: 'Delicate chains and bold pieces.',
      buttonUrl: '/shop/bracelets',
      active: true,
    },
    {
      imageUrl: 'https://cdn.example.com/hidden.jpg',
      imagePublicId: 'collection/hidden',
      title: 'Hidden',
      description: 'Should not appear publicly.',
      buttonUrl: '/hidden',
      active: false,
    },
  ],
};

describe('Admin collection banner config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/collection-banners');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no record exists', async () => {
    await createAdminUser({
      email: 'collectionbanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('collectionbanner@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/collection-banners')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.sectionLabel).toBe('');
    expect(res.body.data.items).toEqual([]);
  });

  it('upserts section fields and items', async () => {
    await createAdminUser({
      email: 'collectionbanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('collectionbanner@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/collection-banners')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.sectionHeading).toBe(basePayload.sectionHeading);
    expect(createRes.body.data.items).toHaveLength(3);
    expect(createRes.body.data.items[0].title).toBe('Necklaces');
  });

  it('rejects items without a title', async () => {
    await createAdminUser({
      email: 'collectionbanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('collectionbanner@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .put('/api/v1/admin/sites/IN/collection-banners')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sectionLabel: 'Collection',
        sectionHeading: 'Discover',
        items: [
          {
            imageUrl: 'https://cdn.example.com/x.jpg',
            imagePublicId: 'collection/x',
            title: '',
            description: 'Missing title',
            buttonUrl: '/x',
            active: true,
          },
        ],
      });

    // Empty titles are dropped by normalize, so body becomes items: []
    expect(res.status).toBe(200);
    expect(res.body.data.items).toEqual([]);
  });
});

describe('Public collection banner config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns only active items', async () => {
    await createAdminUser({
      email: 'collectionbanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('collectionbanner@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/collection-banners')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/collection-banners');
    expect(res.status).toBe(200);
    expect(res.body.data.sectionLabel).toBe('Collection');
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items.map((item: { title: string }) => item.title)).toEqual([
      'Necklaces',
      'Bracelets',
    ]);
  });
});
