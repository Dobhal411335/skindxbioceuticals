import request from 'supertest';
import { createApp } from '@/app';
import { env } from '@/config/env';

describe('public site origin lock', () => {
  const app = createApp();

  it('rejects a .com origin that requests the IN site', async () => {
    const response = await request(app)
      .get('/api/v1/sites/IN/company-basic-info')
      .set('Origin', new URL(env.SITE_COM_URL).origin);

    expect(response.status).toBe(403);
  });

  it('rejects a request with no origin and the wrong fetch secret', async () => {
    const response = await request(app)
      .get('/api/v1/sites/COM/company-basic-info')
      .set('x-site-fetch-secret', 'wrong-site-fetch-secret-value');

    expect(response.status).toBe(403);
  });
});
