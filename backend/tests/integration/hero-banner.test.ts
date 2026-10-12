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

const fullWidthSlide = {
  layoutType: 'FULL_WIDTH',
  order: 0,
  active: true,
  desktopImageUrl: 'https://cdn.example.com/desktop.jpg',
  desktopImagePublicId: 'hero/desktop',
  mobileImageUrl: 'https://cdn.example.com/mobile.jpg',
  mobileImagePublicId: 'hero/mobile',
  buttonUrl: '/shop',
};

const splitSlide = {
  layoutType: 'SPLIT_DUAL',
  order: 1,
  active: true,
  miniHeading: 'Set your style',
  mainHeading: 'SkinDx Bioc',
  description: 'Clear information and calm design.',
  buttonLabel: 'Shop products',
  buttonUrl: '/shop',
  button2Label: 'Explore range',
  button2Url: '/categories',
  leftImageUrl: 'https://cdn.example.com/left.jpg',
  leftImagePublicId: 'hero/left',
  rightImageUrl: 'https://cdn.example.com/right.jpg',
  rightImagePublicId: 'hero/right',
};

const multiSlide = {
  layoutType: 'MULTI_IMAGE',
  order: 2,
  active: false,
  mainHeading: 'our associate brand',
  description: 'We bridge quality and creativity.',
  buttonLabel: 'Explore More',
  buttonUrl: '/about',
  gridImages: [
    { imageUrl: 'https://cdn.example.com/g1.jpg', imagePublicId: 'hero/g1', alt: 'A' },
    { imageUrl: 'https://cdn.example.com/g2.jpg', imagePublicId: 'hero/g2', alt: 'B' },
    { imageUrl: 'https://cdn.example.com/g3.jpg', imagePublicId: 'hero/g3', alt: 'C' },
    { imageUrl: 'https://cdn.example.com/g4.jpg', imagePublicId: 'hero/g4', alt: 'D' },
  ],
};

describe('Admin hero banners config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/hero-banners');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no slides exist', async () => {
    await createAdminUser({
      email: 'herobanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('herobanner@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/hero-banners')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.slides).toEqual([]);
  });

  it('upserts mixed variants and replaces on second save', async () => {
    await createAdminUser({
      email: 'herobanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('herobanner@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/hero-banners')
      .set('Authorization', `Bearer ${token}`)
      .send({ slides: [fullWidthSlide, splitSlide, multiSlide] });

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.slides).toHaveLength(3);
    expect(createRes.body.data.slides[0].layoutType).toBe('FULL_WIDTH');
    expect(createRes.body.data.slides[1].layoutType).toBe('SPLIT_DUAL');
    expect(createRes.body.data.slides[2].gridImages).toHaveLength(4);

    const replaceRes = await api()
      .put('/api/v1/admin/sites/IN/hero-banners')
      .set('Authorization', `Bearer ${token}`)
      .send({ slides: [fullWidthSlide] });

    expect(replaceRes.status).toBe(200);
    expect(replaceRes.body.data.slides).toHaveLength(1);
  });

  it('rejects multi-image slides with fewer than 4 grid images', async () => {
    await createAdminUser({
      email: 'herobanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('herobanner@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .put('/api/v1/admin/sites/IN/hero-banners')
      .set('Authorization', `Bearer ${token}`)
      .send({
        slides: [
          {
            ...multiSlide,
            active: true,
            gridImages: multiSlide.gridImages.slice(0, 2),
          },
        ],
      });

    expect(res.status).toBe(422);
  });

  it('blocks admins without site access', async () => {
    await createAdminUser({
      email: 'comonly@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['COM'],
    });
    const token = await loginAs('comonly@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/hero-banners')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

describe('Public hero banners', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns only active slides ordered', async () => {
    await createAdminUser({
      email: 'herobanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('herobanner@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/hero-banners')
      .set('Authorization', `Bearer ${token}`)
      .send({ slides: [fullWidthSlide, splitSlide, multiSlide] });

    const res = await api().get('/api/v1/sites/IN/hero-banners');
    expect(res.status).toBe(200);
    expect(res.body.data.slides).toHaveLength(2);
    expect(res.body.data.slides.map((s: { layoutType: string }) => s.layoutType)).toEqual([
      'FULL_WIDTH',
      'SPLIT_DUAL',
    ]);
  });
});
