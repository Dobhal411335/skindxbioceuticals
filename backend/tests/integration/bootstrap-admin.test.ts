import request from 'supertest';
import { createApp } from '@/app';
import { env } from '@/config/env';
import { createAdminUser, ensureSites, resetDatabase } from '../setup/db';

const app = createApp();
const api = () => request(app);

const configuredBootstrapSecret = env.ADMIN_BOOTSTRAP_SECRET;
if (!configuredBootstrapSecret) {
  throw new Error('ADMIN_BOOTSTRAP_SECRET must be set for bootstrap-admin tests');
}

const validBody = {
  email: 'first.admin@skindx.test',
  password: 'StrongPass1!xx',
  firstName: 'First',
  lastName: 'Admin',
  bootstrapSecret: configuredBootstrapSecret,
};

describe('POST /api/v1/auth/bootstrap-admin', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects bootstrap when ADMIN_BOOTSTRAP_SECRET is not configured', async () => {
    const previous = env.ADMIN_BOOTSTRAP_SECRET;
    env.ADMIN_BOOTSTRAP_SECRET = undefined;

    try {
      const res = await api().post('/api/v1/auth/bootstrap-admin').send(validBody);
      expect(res.status).toBe(401);
    } finally {
      env.ADMIN_BOOTSTRAP_SECRET = previous;
    }
  });

  it('creates the first administrator when none exist', async () => {
    const res = await api().post('/api/v1/auth/bootstrap-admin').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validBody.email);
    expect(res.body.data.user.role).toBe('SUPER_ADMIN');
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
  });

  it('rejects an invalid bootstrap secret', async () => {
    const res = await api()
      .post('/api/v1/auth/bootstrap-admin')
      .send({ ...validBody, bootstrapSecret: 'wrong-secret-wrong-secret-wrong!!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects bootstrap when an administrator already exists', async () => {
    await createAdminUser({
      email: 'existing@skindx.test',
      password: 'StrongPass1!xx',
      role: 'SUPER_ADMIN',
    });

    const res = await api()
      .post('/api/v1/auth/bootstrap-admin')
      .send({
        ...validBody,
        email: 'another@skindx.test',
      });

    expect(res.status).toBe(409);
  });

  it('allows only one success under concurrent bootstrap attempts', async () => {
    const attempts = Array.from({ length: 5 }, (_, index) =>
      api()
        .post('/api/v1/auth/bootstrap-admin')
        .send({
          ...validBody,
          email: `concurrent${index}@skindx.test`,
        }),
    );

    const results = await Promise.all(attempts);
    const successes = results.filter((result) => result.status === 201);
    const conflicts = results.filter((result) => result.status === 409);

    expect(successes).toHaveLength(1);
    expect(conflicts.length).toBeGreaterThanOrEqual(4);
  });
});
