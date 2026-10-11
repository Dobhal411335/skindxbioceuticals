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
  companyName: 'SkinDx Bioc',
  companyDomainName: 'skindxbioceuticals.in',
  contactNumbers: ['9876543210'],
  whatsappNumber: '9876543210',
  mainLogo: { url: 'https://cdn.example.com/main.png', publicId: 'branding/main' },
  footerLogo: { url: '', publicId: '' },
  mobileUiLogo: { url: '', publicId: '' },
  emails: ['hello@skindxbioceuticals.in'],
  officeAddresses: ['Mumbai HQ'],
  googleAddress: '',
  googleUrl: '',
  googleLink: '',
  facebookLink: '',
  instagramLink: '',
  youtubeLink: '',
  googleMapLink: '',
  googleTrackingTag: '',
  titleTagForMainLandingPage: 'SkinDx Home',
  keywords: ['skincare'],
};

describe('Admin company basic info', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/company-basic-info');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no record exists', async () => {
    await createAdminUser({
      email: 'company@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('company@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/company-basic-info')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.companyName).toBe('');
  });

  it('upserts and returns the same row on second save', async () => {
    await createAdminUser({
      email: 'company@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('company@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/company-basic-info')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.id).toBeTruthy();
    expect(createRes.body.data.companyName).toBe('SkinDx Bioc');

    const updateRes = await api()
      .put('/api/v1/admin/sites/IN/company-basic-info')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        companyName: 'SkinDx Updated',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.id).toBe(createRes.body.data.id);
    expect(updateRes.body.data.companyName).toBe('SkinDx Updated');

    const getRes = await api()
      .get('/api/v1/admin/sites/IN/company-basic-info')
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.body.data.companyName).toBe('SkinDx Updated');
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
      .put('/api/v1/admin/sites/IN/company-basic-info')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...basePayload, companyName: 'IN Company' });

    await api()
      .put('/api/v1/admin/sites/COM/company-basic-info')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        companyName: 'COM Company',
        companyDomainName: 'skindxbioceuticals.com',
      });

    const inRes = await api()
      .get('/api/v1/admin/sites/IN/company-basic-info')
      .set('Authorization', `Bearer ${token}`);
    const comRes = await api()
      .get('/api/v1/admin/sites/COM/company-basic-info')
      .set('Authorization', `Bearer ${token}`);

    expect(inRes.body.data.companyName).toBe('IN Company');
    expect(comRes.body.data.companyName).toBe('COM Company');
    expect(inRes.body.data.id).not.toBe(comRes.body.data.id);
  });

  it('blocks IN-only admin from COM company info', async () => {
    await createAdminUser({
      email: 'in-only@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('in-only@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/COM/company-basic-info')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('allows public GET without authentication', async () => {
    await createAdminUser({
      email: 'company-public@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('company-public@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/company-basic-info')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/company-basic-info');
    expect(res.status).toBe(200);
    expect(res.body.data.companyName).toBe('SkinDx Bioc');
    expect(res.body.data.siteCode).toBe('IN');
  });

  it('rejects invalid contact numbers', async () => {
    await createAdminUser({
      email: 'company@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('company@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .put('/api/v1/admin/sites/IN/company-basic-info')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        contactNumbers: ['123'],
      });

    expect(res.status).toBe(422);
  });
});
