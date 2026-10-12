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
  sections: [
    {
      title: 'General',
      active: true,
      order: 1,
      items: [
        {
          question: 'What are your business hours?',
          answer: 'Monday to Saturday, 10:00–18:00 IST.',
          showOnLanding: true,
          active: true,
          order: 1,
        },
        {
          question: 'Do you offer medical advice?',
          answer: 'No. Support channels do not diagnose, treat, or prescribe.',
          showOnLanding: false,
          active: true,
          order: 2,
        },
      ],
    },
    {
      title: 'Shipping',
      active: true,
      order: 2,
      items: [
        {
          question: 'Where do you ship?',
          answer: 'Domestic India shipping is prepared for checkout.',
          showOnLanding: false,
          active: false,
          order: 1,
        },
      ],
    },
  ],
};

describe('Admin FAQ config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('rejects unauthenticated access', async () => {
    const res = await api().get('/api/v1/admin/sites/IN/faq');
    expect(res.status).toBe(401);
  });

  it('returns empty defaults when no sections exist', async () => {
    await createAdminUser({
      email: 'faq@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('faq@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/IN/faq')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.siteCode).toBe('IN');
    expect(res.body.data.sections).toEqual([]);
  });

  it('upserts nested sections/items and replaces on second save', async () => {
    await createAdminUser({
      email: 'faq@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('faq@skindx.test', 'StrongPass1!xx');

    const createRes = await api()
      .put('/api/v1/admin/sites/IN/faq')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    expect(createRes.status).toBe(200);
    expect(createRes.body.data.sections).toHaveLength(2);
    expect(createRes.body.data.sections[0].items).toHaveLength(2);
    expect(createRes.body.data.sections[0].items[0].showOnLanding).toBe(true);

    const updateRes = await api()
      .put('/api/v1/admin/sites/IN/faq')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sections: [
          {
            title: 'Orders',
            active: true,
            order: 1,
            items: [
              {
                question: 'How do I place an order?',
                answer: 'Add products to cart and continue to checkout.',
                showOnLanding: true,
                active: true,
                order: 1,
              },
            ],
          },
        ],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.sections).toHaveLength(1);
    expect(updateRes.body.data.sections[0].title).toBe('Orders');
    expect(updateRes.body.data.sections[0].items).toHaveLength(1);
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
      .put('/api/v1/admin/sites/IN/faq')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sections: [{ title: 'IN General', active: true, order: 1, items: [] }],
      });

    await api()
      .put('/api/v1/admin/sites/COM/faq')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sections: [{ title: 'COM General', active: true, order: 1, items: [] }],
      });

    const inRes = await api()
      .get('/api/v1/admin/sites/IN/faq')
      .set('Authorization', `Bearer ${token}`);
    const comRes = await api()
      .get('/api/v1/admin/sites/COM/faq')
      .set('Authorization', `Bearer ${token}`);

    expect(inRes.body.data.sections[0].title).toBe('IN General');
    expect(comRes.body.data.sections[0].title).toBe('COM General');
    expect(inRes.body.data.sections[0].id).not.toBe(comRes.body.data.sections[0].id);
  });

  it('blocks IN-only admin from COM FAQ', async () => {
    await createAdminUser({
      email: 'in-only@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('in-only@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .get('/api/v1/admin/sites/COM/faq')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('rejects a question that exceeds the max length', async () => {
    await createAdminUser({
      email: 'faq@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('faq@skindx.test', 'StrongPass1!xx');

    const res = await api()
      .put('/api/v1/admin/sites/IN/faq')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sections: [
          {
            title: 'Broken',
            active: true,
            order: 1,
            items: [
              {
                question: 'Q'.repeat(301),
                answer: 'Answer is present',
                showOnLanding: false,
              },
            ],
          },
        ],
      });

    expect(res.status).toBe(422);
  });
});

describe('Public FAQ config', () => {
  beforeEach(async () => {
    await resetDatabase();
    await ensureSites();
  });

  it('returns active nested items only for an active site', async () => {
    await createAdminUser({
      email: 'faq@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('faq@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/faq')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/faq');

    expect(res.status).toBe(200);
    expect(res.body.data.sections).toHaveLength(2);
    expect(res.body.data.sections[0].items).toHaveLength(2);
    expect(res.body.data.sections[1].items).toHaveLength(0);
  });

  it('filters showOnLanding items when landing=true', async () => {
    await createAdminUser({
      email: 'faq@skindx.test',
      password: 'StrongPass1!xx',
      role: 'ADMIN',
      siteCodes: ['IN'],
    });
    const token = await loginAs('faq@skindx.test', 'StrongPass1!xx');

    await api()
      .put('/api/v1/admin/sites/IN/faq')
      .set('Authorization', `Bearer ${token}`)
      .send(basePayload);

    const res = await api().get('/api/v1/sites/IN/faq?landing=true');

    expect(res.status).toBe(200);
    expect(res.body.data.sections).toHaveLength(1);
    expect(res.body.data.sections[0].items).toHaveLength(1);
    expect(res.body.data.sections[0].items[0].question).toBe(
      'What are your business hours?',
    );
  });

  it('returns empty defaults when no FAQ is configured', async () => {
    const res = await api().get('/api/v1/sites/IN/faq');
    expect(res.status).toBe(200);
    expect(res.body.data.sections).toEqual([]);
  });
});
