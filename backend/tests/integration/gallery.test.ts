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

const imagePayload = {
  mediaType: 'image',
  mediaUrl: 'https://cdn.example.com/gallery.jpg',
  mediaPublicId: 'gallery/img',
  title: 'Clinic moment',
  caption: 'Derm care lookbook',
  active: true,
  order: 1,
};

const videoPayload = {
  mediaType: 'video',
  mediaUrl: 'https://cdn.example.com/gallery.mp4',
  mediaPublicId: 'gallery/vid',
  title: 'Routine clip',
  caption: 'Short muted video',
  active: true,
  order: 2,
};

describe('Admin gallery items', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/gallery');
    expect(res.status).toBe(401);
  });

  it('returns an empty list when no items exist', async () => {
    await createAdminUser({
      email: 'gallery@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('gallery@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('creates, updates, patches, filters by mediaType, and deletes', async () => {
    await createAdminUser({
      email: 'gallery@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('gallery@skindx.test', 'StrongPass1!xx');

    const createImage = await api()
      .post('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send(imagePayload);

    expect(createImage.status).toBe(201);
    expect(createImage.body.data.mediaType).toBe('image');
    const itemId = createImage.body.data.id as string;

    await api()
      .post('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send(videoPayload);

    const imageList = await api()
      .get('/api/v1/admin/sites/IN/gallery?mediaType=image')
      .set('Authorization', `Bearer ${token}`);
    expect(imageList.status).toBe(200);
    expect(imageList.body.data).toHaveLength(1);
    expect(imageList.body.data[0].mediaType).toBe('image');

    const updateRes = await api()
      .put(`/api/v1/admin/sites/IN/gallery/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...imagePayload,
        title: 'Updated look',
        order: 3,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Updated look');
    expect(updateRes.body.data.order).toBe(3);

    const patchRes = await api()
      .patch(`/api/v1/admin/sites/IN/gallery/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.active).toBe(false);

    const deleteRes = await api()
      .delete(`/api/v1/admin/sites/IN/gallery/${itemId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const listRes = await api()
      .get('/api/v1/admin/sites/IN/gallery?mediaType=image')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.body.data).toEqual([]);
  });

  it('isolates IN and COM gallery items and blocks cross-site access', async () => {
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
      .post('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${bothToken}`)
      .send({ ...imagePayload, title: 'IN only' });

    await api()
      .post('/api/v1/admin/sites/COM/gallery')
      .set('Authorization', `Bearer ${bothToken}`)
      .send({ ...videoPayload, title: 'COM only' });

    const inList = await api()
      .get('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${bothToken}`);
    const comList = await api()
      .get('/api/v1/admin/sites/COM/gallery')
      .set('Authorization', `Bearer ${bothToken}`);

    expect(inList.body.data).toHaveLength(1);
    expect(inList.body.data[0].mediaType).toBe('image');
    expect(comList.body.data).toHaveLength(1);
    expect(comList.body.data[0].mediaType).toBe('video');

    const forbidden = await api()
      .get('/api/v1/admin/sites/COM/gallery')
      .set('Authorization', `Bearer ${inToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('rejects create without media url', async () => {
    await createAdminUser({
      email: 'gallery@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('gallery@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .post('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ mediaType: 'image', mediaUrl: '' });

    expect(res.status).toBe(422);
  });
});

describe('Public gallery items', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns only active items ordered for the site', async () => {
    await createAdminUser({
      email: 'gallery@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('gallery@skindx.test', 'StrongPass1!xx');

    await api()
      .post('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...imagePayload, order: 2 });

    await api()
      .post('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...videoPayload, order: 1 });

    const inactive = await api()
      .post('/api/v1/admin/sites/IN/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...imagePayload,
        mediaUrl: 'https://cdn.example.com/hidden.jpg',
        mediaPublicId: 'gallery/hidden',
        active: false,
        order: 0,
      });
    expect(inactive.status).toBe(201);

    const res = await api().get('/api/v1/sites/IN/gallery');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].mediaType).toBe('video');
    expect(res.body.data[1].mediaType).toBe('image');
    expect(res.body.data.every((item: { active: boolean }) => item.active)).toBe(true);
  });
});
