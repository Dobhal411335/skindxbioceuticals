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

const sectionPayload = {
  title: 'Shop',
  url: '/shop',
  active: true,
  order: 1,
  subSections: [
    { title: 'Serums', url: '/shop/serums', active: true, order: 1 },
    { title: 'Hidden', url: '/shop/hidden', active: false, order: 2 },
  ],
};

describe('Admin navbar sections', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/navbar-sections');
    expect(res.status).toBe(401);
  });

  it('returns an empty list when no sections exist', async () => {
    await createAdminUser({
      email: 'nav@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('nav@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/navbar-sections')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('creates, updates, patches, and deletes a section', async () => {
    await createAdminUser({
      email: 'nav@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('nav@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .post('/api/v1/admin/sites/IN/navbar-sections')
      .set('Authorization', `Bearer ${token}`)
      .send(sectionPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.title).toBe('Shop');
    expect(createRes.body.data.subSections).toHaveLength(2);
    const sectionId = createRes.body.data.id as string;

    const updateRes = await api()
      .put(`/api/v1/admin/sites/IN/navbar-sections/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...sectionPayload,
        title: 'Shop All',
        subSections: [{ title: 'All', url: '/shop', active: true, order: 1 }],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Shop All');
    expect(updateRes.body.data.subSections).toHaveLength(1);

    const patchRes = await api()
      .patch(`/api/v1/admin/sites/IN/navbar-sections/${sectionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.active).toBe(false);

    const deleteRes = await api()
      .delete(`/api/v1/admin/sites/IN/navbar-sections/${sectionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteRes.status).toBe(200);

    const listRes = await api()
      .get('/api/v1/admin/sites/IN/navbar-sections')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.body.data).toEqual([]);
  });

  it('isolates IN and COM navbar data and blocks cross-site access', async () => {
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
      .post('/api/v1/admin/sites/IN/navbar-sections')
      .set('Authorization', `Bearer ${bothToken}`)
      .send({ ...sectionPayload, title: 'IN Shop' });

    await api()
      .post('/api/v1/admin/sites/COM/navbar-sections')
      .set('Authorization', `Bearer ${bothToken}`)
      .send({ ...sectionPayload, title: 'COM About', url: '/about' });

    const inList = await api()
      .get('/api/v1/admin/sites/IN/navbar-sections')
      .set('Authorization', `Bearer ${bothToken}`);
    const comList = await api()
      .get('/api/v1/admin/sites/COM/navbar-sections')
      .set('Authorization', `Bearer ${bothToken}`);

    expect(inList.body.data).toHaveLength(1);
    expect(inList.body.data[0].title).toBe('IN Shop');
    expect(comList.body.data).toHaveLength(1);
    expect(comList.body.data[0].title).toBe('COM About');

    const forbidden = await api()
      .get('/api/v1/admin/sites/COM/navbar-sections')
      .set('Authorization', `Bearer ${inToken}`);
    expect(forbidden.status).toBe(403);
  });

  it('rejects create without a title', async () => {
    await createAdminUser({
      email: 'nav@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('nav@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .post('/api/v1/admin/sites/IN/navbar-sections')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', url: '/shop' });

    expect(res.status).toBe(422);
  });
});

describe('Public navbar sections', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns only active sections and active sub-sections', async () => {
    await createAdminUser({
      email: 'nav@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('nav@skindx.test', 'StrongPass1!xx');

    await api()
      .post('/api/v1/admin/sites/IN/navbar-sections')
      .set('Authorization', `Bearer ${token}`)
      .send(sectionPayload);

    await api()
      .post('/api/v1/admin/sites/IN/navbar-sections')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Hidden Section',
        url: '/hidden',
        active: false,
        order: 2,
        subSections: [],
      });

    const res = await api().get('/api/v1/sites/IN/navbar-sections');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Shop');
    expect(res.body.data[0].subSections).toHaveLength(1);
    expect(res.body.data[0].subSections[0].title).toBe('Serums');
  });
});
