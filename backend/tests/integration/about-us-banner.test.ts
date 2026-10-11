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
  promoLabel: 'Featured offers',
  promoHeading: 'Curated selections worth a closer look',
  promoSubheading: 'Explore seasonal highlights while stocks last.',
  promoButtonLabel: 'Shop now',
  promoButtonUrl: '/shop',
  aboutCards: [
    {
      imageUrl: 'https://cdn.example.com/about.jpg',
      imagePublicId: 'about/card-1',
      label: 'About us',
      heading: 'Science-led care with a calm, premium finish',
      description: 'Clear product presentation and quality-minded formulations.',
      buttonLabel: 'Read more about us',
      buttonUrl: '/about',
      active: true,
    },
    {
      imageUrl: 'https://cdn.example.com/about-hidden.jpg',
      imagePublicId: 'about/card-2',
      label: 'Hidden',
      heading: 'Hidden card',
      description: 'Should not appear publicly.',
      buttonLabel: 'Hidden',
      buttonUrl: '/hidden',
      active: false,
    },
  ],
  highlightItems: [
    {
      imageUrl: 'https://cdn.example.com/hi-1.jpg',
      imagePublicId: 'about/hi-1',
      heading: 'How to read an ingredients list with clarity',
      buttonLabel: 'Read more',
      buttonUrl: '/blog/reading-ingredients',
      active: true,
    },
  ],
  textSlides: [
    {
      heading: 'Crafting clarity in every formula, every day',
      subheading: 'Educational notes and brand updates.',
      active: true,
    },
    {
      heading: 'Hidden slide',
      subheading: 'Inactive',
      active: false,
    },
  ],
};

describe('Admin about us banner config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/about-us-banner');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no record exists', async () => {
    await createAdminUser({
      email: 'aboutbanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('aboutbanner@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/about-us-banner')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.promoHeading).toBe('');
    expect(res.body.data.aboutCards).toEqual([]);
    expect(res.body.data.highlightItems).toEqual([]);
    expect(res.body.data.textSlides).toEqual([]);
  });

  it('upserts all sections and replaces on second save', async () => {
    await createAdminUser({
      email: 'aboutbanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('aboutbanner@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/about-us-banner')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.id).toBeTruthy();
    expect(createRes.body.data.promoHeading).toBe(basePayload.promoHeading);
    expect(createRes.body.data.aboutCards).toHaveLength(2);
    expect(createRes.body.data.highlightItems).toHaveLength(1);
    expect(createRes.body.data.textSlides).toHaveLength(2);

    const replaceRes = await api()
      .put('/api/v1/admin/sites/IN/about-us-banner')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        promoHeading: 'Updated heading',
        aboutCards: [
          {
            imageUrl: 'https://cdn.example.com/about-only.jpg',
            imagePublicId: 'about/only',
            label: 'About us',
            heading: 'Only card',
            description: 'Single card after replace.',
            buttonLabel: 'Read more',
            buttonUrl: '/about',
            active: true,
          },
        ],
        highlightItems: [],
        textSlides: [
          {
            heading: 'Only slide',
            subheading: 'Replaced slides.',
            active: true,
          },
        ],
      });

    expect(replaceRes.status).toBe(200);
    expect(replaceRes.body.data.promoHeading).toBe('Updated heading');
    expect(replaceRes.body.data.aboutCards).toHaveLength(1);
    expect(replaceRes.body.data.aboutCards[0].heading).toBe('Only card');
    expect(replaceRes.body.data.highlightItems).toEqual([]);
    expect(replaceRes.body.data.textSlides).toHaveLength(1);
  });

  it('isolates IN and COM configs and blocks cross-site access', async () => {
    await createAdminUser({
      email: 'about-in@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    await createAdminUser({
      email: 'about-com@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['COM'],
    });
    const inToken = await loginAs('about-in@skindx.test', 'StrongPass1!xx');
    const comToken = await loginAs('about-com@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/about-us-banner')
      .set('Authorization', `Bearer ${inToken}`)
      .send({ ...basePayload, promoHeading: 'IN heading' });

    await api()
      .put('/api/v1/admin/sites/COM/about-us-banner')
      .set('Authorization', `Bearer ${comToken}`)
      .send({ ...basePayload, promoHeading: 'COM heading' });

    const inGet = await api()
      .get('/api/v1/admin/sites/IN/about-us-banner')
      .set('Authorization', `Bearer ${inToken}`);
    const comGet = await api()
      .get('/api/v1/admin/sites/COM/about-us-banner')
      .set('Authorization', `Bearer ${comToken}`);

    expect(inGet.body.data.promoHeading).toBe('IN heading');
    expect(comGet.body.data.promoHeading).toBe('COM heading');

    const denied = await api()
      .get('/api/v1/admin/sites/COM/about-us-banner')
      .set('Authorization', `Bearer ${inToken}`);
    expect(denied.status).toBe(403);
  });

  it('rejects invalid button URLs', async () => {
    await createAdminUser({
      email: 'aboutbanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('aboutbanner@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .put('/api/v1/admin/sites/IN/about-us-banner')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...basePayload,
        promoButtonUrl: 'javascript:alert(1)',
      });

    expect(res.status).toBe(422);
  });
});

describe('Public about us banner config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns active nested items only', async () => {
    await createAdminUser({
      email: 'aboutbanner@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('aboutbanner@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/about-us-banner')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/about-us-banner');
    expect(res.status).toBe(200);
    expect(res.body.data.promoHeading).toBe(basePayload.promoHeading);
    expect(res.body.data.aboutCards).toHaveLength(1);
    expect(res.body.data.aboutCards[0].heading).toContain('Science-led');
    expect(res.body.data.highlightItems).toHaveLength(1);
    expect(res.body.data.textSlides).toHaveLength(1);
    expect(res.body.data.textSlides[0].heading).toContain('Crafting clarity');
  });

  it('returns empty defaults when no config exists', async () => {
    const res = await api().get('/api/v1/sites/IN/about-us-banner');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBeNull();
    expect(res.body.data.aboutCards).toEqual([]);
  });
});
