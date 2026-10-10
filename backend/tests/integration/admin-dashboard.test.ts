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

describe('Admin sites and dashboard', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('lists only authorized sites', async () => {
    await createAdminUser({
      email: 'in-only@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });

    const token = await loginAs('in-only@skindx.test', 'StrongPass1!xx');
    const res = await api().get('/api/v1/admin/sites').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.map((site: { code: string }) => site.code)).toEqual(['IN']);
  });

  it('returns IN dashboard zeros for an empty site', async () => {
    await createAdminUser({
      email: 'in-admin@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });

    const token = await loginAs('in-admin@skindx.test', 'StrongPass1!xx');
    const res = await api()
      .get('/api/v1/admin/sites/IN/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.totals.orders).toBe(0);
    expect(res.body.data.totals.revenue).toBe(0);
  });

  it('blocks IN-only admin from COM dashboard', async () => {
    await createAdminUser({
      email: 'in-only@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });

    const token = await loginAs('in-only@skindx.test', 'StrongPass1!xx');
    const res = await api()
      .get('/api/v1/admin/sites/COM/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows SUPER_ADMIN to read COM dashboard', async () => {
    await createAdminUser({
      email: 'super@skindx.test',
      password: 'StrongPass1!xx',
      role: 'SUPER_ADMIN',
      siteCodes: ['IN', 'COM'],
    });

    const token = await loginAs('super@skindx.test', 'StrongPass1!xx');
    const res = await api()
      .get('/api/v1/admin/sites/COM/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.siteCode).toBe('COM');
    expect(res.body.data.totals.enquiries).toBe(0);
  });

  it('rejects unauthenticated dashboard access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/dashboard');
    expect(res.status).toBe(401);
  });
});
