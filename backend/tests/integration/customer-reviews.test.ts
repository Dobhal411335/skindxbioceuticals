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

const reviewPayload = {
  customerName: 'Candace V. Miller',
  designation: 'From Florida',
  description:
    'Checkout felt clear and the product pages listed pack size up front — exactly what I wanted.',
  rating: 5,
  imageUrl: 'https://cdn.example.com/avatar.jpg',
  imagePublicId: '',
  active: true,
};

describe('Admin customer reviews', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/customer-reviews');
    expect(res.status).toBe(401);
  });

  it('returns an empty list when no reviews exist', async () => {
    await createAdminUser({
      email: 'reviews@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('reviews@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('creates, updates, patches, and deletes', async () => {
    await createAdminUser({
      email: 'reviews@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('reviews@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .post('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(reviewPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.customerName).toBe(reviewPayload.customerName);
    expect(createRes.body.data.rating).toBe(5);
    expect(createRes.body.data.order).toBe(1);
    const reviewId = createRes.body.data.id as string;

    const updateRes = await api()
      .put(`/api/v1/admin/sites/IN/customer-reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...reviewPayload,
        designation: 'From Texas',
        rating: 4,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.designation).toBe('From Texas');
    expect(updateRes.body.data.rating).toBe(4);

    const patchRes = await api()
      .patch(`/api/v1/admin/sites/IN/customer-reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.active).toBe(false);

    const deleteRes = await api()
      .delete(`/api/v1/admin/sites/IN/customer-reviews/${reviewId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const listRes = await api()
      .get('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.body.data).toEqual([]);
  });

  it('isolates IN and COM reviews and blocks cross-site access', async () => {
    await createAdminUser({
      email: 'in-only@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    await createAdminUser({
      email: 'both@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN', 'COM'],
    });

    const inToken = await loginAs('in-only@skindx.test', 'StrongPass1!xx');
    const bothToken = await loginAs('both@skindx.test', 'StrongPass1!xx');

    await api()
      .post('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${bothToken}`)
      .send(reviewPayload);

    await api()
      .post('/api/v1/admin/sites/COM/customer-reviews')
      .set('Authorization', `Bearer ${bothToken}`)
      .send({
        ...reviewPayload,
        customerName: 'COM Reviewer',
      });

    const inList = await api()
      .get('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${bothToken}`);
    const comList = await api()
      .get('/api/v1/admin/sites/COM/customer-reviews')
      .set('Authorization', `Bearer ${bothToken}`);

    expect(inList.body.data).toHaveLength(1);
    expect(inList.body.data[0].customerName).toBe(reviewPayload.customerName);
    expect(comList.body.data).toHaveLength(1);
    expect(comList.body.data[0].customerName).toBe('COM Reviewer');

    const forbidden = await api()
      .get('/api/v1/admin/sites/COM/customer-reviews')
      .set('Authorization', `Bearer ${inToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('rejects invalid rating and missing image', async () => {
    await createAdminUser({
      email: 'reviews@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('reviews@skindx.test', 'StrongPass1!xx');

    const badRating = await api()
      .post('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...reviewPayload, rating: 6 });

    expect(badRating.status).toBe(422);

    const missingImage = await api()
      .post('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...reviewPayload, imageUrl: '' });

    expect(missingImage.status).toBe(422);
  });
});

describe('Public customer reviews', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns only active reviews for the site', async () => {
    await createAdminUser({
      email: 'reviews@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('reviews@skindx.test', 'StrongPass1!xx');

    await api()
      .post('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(reviewPayload);

    await api()
      .post('/api/v1/admin/sites/IN/customer-reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...reviewPayload,
        customerName: 'Hidden Reviewer',
        active: false,
      });

    const res = await api().get('/api/v1/sites/IN/customer-reviews');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].active).toBe(true);
    expect(res.body.data[0].customerName).toBe(reviewPayload.customerName);
  });
});
