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
  thankYou: 'Thank you for visiting',
  description: 'SkinDx Bioceuticals storefront footer.',
  columns: [
    {
      title: 'My account',
      active: true,
      order: 1,
      links: [
        { label: 'Register', url: '/account/register', active: true, order: 1 },
        { label: 'Sign in', url: '/account/login', active: true, order: 2 },
      ],
    },
    {
      title: 'Our policies',
      active: true,
      order: 2,
      links: [
        { label: 'Shipping', url: '/policies/shipping', active: true, order: 1 },
        { label: 'Hidden', url: '/hidden', active: false, order: 2 },
      ],
    },
  ],
};

describe('Admin footer config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/footer');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no record exists', async () => {
    await createAdminUser({
      email: 'footer@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('footer@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/footer')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.columns).toEqual([]);
  });

  it('upserts nested columns/links and replaces on second save', async () => {
    await createAdminUser({
      email: 'footer@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('footer@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/footer')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.id).toBeTruthy();
    expect(createRes.body.data.columns).toHaveLength(2);
    expect(createRes.body.data.columns[0].links).toHaveLength(2);
    expect(createRes.body.data.logo).toBeUndefined();
    expect(createRes.body.data.socialLinks).toBeUndefined();

    const updateRes = await api()
      .put('/api/v1/admin/sites/IN/footer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        thankYou: 'Thanks again',
        columns: [
          {
            title: 'Customer care',
            active: true,
            order: 1,
            links: [{ label: 'Contact', url: '/contact', active: true, order: 1 }],
          },
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.id).toBe(createRes.body.data.id);
    expect(updateRes.body.data.thankYou).toBe('Thanks again');
    expect(updateRes.body.data.columns).toHaveLength(1);
    expect(updateRes.body.data.columns[0].title).toBe('Customer care');
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
      .put('/api/v1/admin/sites/IN/footer')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...basePayload, thankYou: 'IN thanks' });

    await api()
      .put('/api/v1/admin/sites/COM/footer')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...basePayload, thankYou: 'COM thanks' });

    const inRes = await api()
      .get('/api/v1/admin/sites/IN/footer')
      .set('Authorization', `Bearer ${token}`);
    const comRes = await api()
      .get('/api/v1/admin/sites/COM/footer')
      .set('Authorization', `Bearer ${token}`);

    expect(inRes.body.data.thankYou).toBe('IN thanks');
    expect(comRes.body.data.thankYou).toBe('COM thanks');
    expect(inRes.body.data.id).not.toBe(comRes.body.data.id);
  });

  it('blocks IN-only admin from COM footer', async () => {
    await createAdminUser({
      email: 'in-only@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('in-only@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/COM/footer')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('rejects invalid nested URLs', async () => {
    await createAdminUser({
      email: 'footer@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('footer@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .put('/api/v1/admin/sites/IN/footer')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        columns: [
          {
            title: 'Broken',
            active: true,
            order: 1,
            links: [
              {
                label: 'Bad link',
                url: 'not a valid url',
                active: true,
                order: 1,
              },
            ],
          },
        ],
      });

    expect(res.status).toBe(422);
  });
});

describe('Public footer config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns active nested items only for an active site', async () => {
    await createAdminUser({
      email: 'footer@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('footer@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/footer')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/footer');

    expect(res.status).toBe(200);
    expect(res.body.data.columns).toHaveLength(2);
    expect(res.body.data.columns[1].links).toHaveLength(1);
    expect(res.body.data.columns[1].links[0].label).toBe('Shipping');
    expect(res.body.data.logo).toBeUndefined();
    expect(res.body.data.socialLinks).toBeUndefined();
  });

  it('returns empty defaults when no footer is configured', async () => {
    const res = await api().get('/api/v1/sites/IN/footer');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.columns).toEqual([]);
  });
});
