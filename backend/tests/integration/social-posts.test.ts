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

const instagramPayload = {
  postType: 'instagram',
  imageUrl: 'https://cdn.example.com/insta.jpg',
  imagePublicId: 'social/insta',
  postUrl: 'https://www.instagram.com/p/abc123/',
  active: true,
  order: 1,
};

const facebookPayload = {
  postType: 'facebook',
  imageUrl: 'https://cdn.example.com/fb.jpg',
  imagePublicId: 'social/fb',
  postUrl: 'https://www.facebook.com/posts/xyz',
  active: true,
  order: 1,
};

describe('Admin social posts', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/social-posts');
    expect(res.status).toBe(401);
  });

  it('returns an empty list when no posts exist', async () => {
    await createAdminUser({
      email: 'social@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('social@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('creates, updates, patches, filters by postType, and deletes', async () => {
    await createAdminUser({
      email: 'social@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('social@skindx.test', 'StrongPass1!xx');

    const createInsta = await api()
      .post('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${token}`)
      .send(instagramPayload);

    expect(createInsta.status).toBe(201);
    expect(createInsta.body.data.postType).toBe('instagram');
    const postId = createInsta.body.data.id as string;

    await api()
      .post('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${token}`)
      .send(facebookPayload);

    const instaList = await api()
      .get('/api/v1/admin/sites/IN/social-posts?postType=instagram')
      .set('Authorization', `Bearer ${token}`);
    expect(instaList.status).toBe(200);
    expect(instaList.body.data).toHaveLength(1);
    expect(instaList.body.data[0].postType).toBe('instagram');

    const updateRes = await api()
      .put(`/api/v1/admin/sites/IN/social-posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...instagramPayload,
        postUrl: 'https://www.instagram.com/p/updated/',
        order: 2,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.postUrl).toBe('https://www.instagram.com/p/updated/');
    expect(updateRes.body.data.order).toBe(2);

    const patchRes = await api()
      .patch(`/api/v1/admin/sites/IN/social-posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.active).toBe(false);

    const deleteRes = await api()
      .delete(`/api/v1/admin/sites/IN/social-posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const listRes = await api()
      .get('/api/v1/admin/sites/IN/social-posts?postType=instagram')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.body.data).toEqual([]);
  });

  it('isolates IN and COM social posts and blocks cross-site access', async () => {
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
      .post('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${bothToken}`)
      .send({ ...instagramPayload, postUrl: 'https://www.instagram.com/p/in/' });

    await api()
      .post('/api/v1/admin/sites/COM/social-posts')
      .set('Authorization', `Bearer ${bothToken}`)
      .send({ ...facebookPayload, postUrl: 'https://www.facebook.com/posts/com' });

    const inList = await api()
      .get('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${bothToken}`);
    const comList = await api()
      .get('/api/v1/admin/sites/COM/social-posts')
      .set('Authorization', `Bearer ${bothToken}`);

    expect(inList.body.data).toHaveLength(1);
    expect(inList.body.data[0].postType).toBe('instagram');
    expect(comList.body.data).toHaveLength(1);
    expect(comList.body.data[0].postType).toBe('facebook');

    const forbidden = await api()
      .get('/api/v1/admin/sites/COM/social-posts')
      .set('Authorization', `Bearer ${inToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('rejects create without image or url', async () => {
    await createAdminUser({
      email: 'social@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('social@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .post('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ postType: 'instagram', imageUrl: '', postUrl: '' });

    expect(res.status).toBe(422);
  });
});

describe('Public social posts', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns only active posts ordered for the site', async () => {
    await createAdminUser({
      email: 'social@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('social@skindx.test', 'StrongPass1!xx');

    await api()
      .post('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...instagramPayload, order: 2 });

    await api()
      .post('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...facebookPayload, order: 1 });

    const inactive = await api()
      .post('/api/v1/admin/sites/IN/social-posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...instagramPayload,
        postUrl: 'https://www.instagram.com/p/hidden/',
        active: false,
        order: 0,
      });
    expect(inactive.status).toBe(201);

    const res = await api().get('/api/v1/sites/IN/social-posts');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].postType).toBe('facebook');
    expect(res.body.data[1].postType).toBe('instagram');
    expect(res.body.data.every((post: { active: boolean }) => post.active)).toBe(
      true,
    );
  });
});
