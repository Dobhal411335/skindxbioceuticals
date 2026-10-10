import request from 'supertest';
import { createApp } from '@/app';
import { hashPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { createAdminUser, ensureSites, resetDatabase } from '../setup/db';

const app = createApp();
const api = () => request(app);

describe('Admin authentication', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('logs in an active administrator', async () => {
    await createAdminUser({
      email: 'admin@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });

    const res = await api().post('/api/v1/auth/admin/login').send({
      email: 'admin@skindx.test',
      password: 'StrongPass1!xx',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rejects invalid credentials', async () => {
    await createAdminUser({
      email: 'admin@skindx.test',
      password: 'StrongPass1!xx',
    });

    const res = await api().post('/api/v1/auth/admin/login').send({
      email: 'admin@skindx.test',
      password: 'wrong-password',
    });

    expect(res.status).toBe(401);
  });

  it('rejects customer accounts from admin login', async () => {
    await prisma.user.create({
      data: {
        email: 'customer@skindx.test',
        passwordHash: await hashPassword('StrongPass1!xx'),
        role: 'CUSTOMER',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    const res = await api().post('/api/v1/auth/admin/login').send({
      email: 'customer@skindx.test',
      password: 'StrongPass1!xx',
    });

    expect(res.status).toBe(401);
  });

  it('returns authorized sites from /auth/me', async () => {
    await createAdminUser({
      email: 'scoped@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });

    const login = await api().post('/api/v1/auth/admin/login').send({
      email: 'scoped@skindx.test',
      password: 'StrongPass1!xx',
    });

    const res = await api()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.sites).toHaveLength(1);
    expect(res.body.data.sites[0].code).toBe('IN');
  });
});
