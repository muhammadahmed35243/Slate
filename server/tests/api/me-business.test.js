import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestUser, deleteTestUser } from '../helpers/users.js';

jest.setTimeout(30000);

let owner;
let outsider;
let businessId;
const as = (u) => ({ Authorization: `Bearer ${u.token}` });

beforeAll(async () => {
  owner = await createTestUser('owner');
  outsider = await createTestUser('outsider');
});

afterAll(async () => {
  await deleteTestUser(owner?.user);
  await deleteTestUser(outsider?.user);
});

describe('/api/me', () => {
  test('GET returns profile with empty memberships', async () => {
    const res = await request(app).get('/api/me').set(as(owner));
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(owner.user.id);
    expect(res.body.full_name).toBe('Test owner');
    expect(res.body.memberships).toEqual([]);
  });

  test('PATCH updates full_name', async () => {
    const res = await request(app).patch('/api/me').set(as(owner)).send({ full_name: 'Sara Owner' });
    expect(res.status).toBe(200);
    expect(res.body.full_name).toBe('Sara Owner');
  });

  test('PATCH rejects unknown fields', async () => {
    const res = await request(app).patch('/api/me').set(as(owner)).send({ email: 'x@y.z' });
    expect(res.status).toBe(400);
  });
});

describe('/api/businesses', () => {
  test('POST validates body', async () => {
    const res = await request(app).post('/api/businesses').set(as(owner)).send({ name: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  test('POST creates business with widget key', async () => {
    const res = await request(app)
      .post('/api/businesses')
      .set(as(owner))
      .send({
        name: 'Sunrise Dental',
        category: 'Dental clinic',
        hours: { mon: [['09:00', '17:00']] },
      });
    expect(res.status).toBe(201);
    expect(res.body.widget_key).toMatch(/^wk_[0-9a-f]{24}$/);
    expect(res.body.owner_id).toBe(owner.user.id);
    businessId = res.body.id;
  });

  test('GET lists it with role owner, and /me shows the membership', async () => {
    const list = await request(app).get('/api/businesses').set(as(owner));
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].role).toBe('owner');
    expect(list.body[0].business.name).toBe('Sunrise Dental');

    const me = await request(app).get('/api/me').set(as(owner));
    expect(me.body.memberships).toHaveLength(1);
  });

  test('GET /:id returns business, free plan, my_role', async () => {
    const res = await request(app).get(`/api/businesses/${businessId}`).set(as(owner));
    expect(res.status).toBe(200);
    expect(res.body.my_role).toBe('owner');
    expect(res.body.subscription.plan_name).toBe('free');
  });

  test('non-member gets 404 (no data leak)', async () => {
    const res = await request(app).get(`/api/businesses/${businessId}`).set(as(outsider));
    expect(res.status).toBe(404);
  });

  test('non-member cannot PATCH', async () => {
    const res = await request(app)
      .patch(`/api/businesses/${businessId}`)
      .set(as(outsider))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  test('invalid id → 400', async () => {
    const res = await request(app).get('/api/businesses/not-a-uuid').set(as(owner));
    expect(res.status).toBe(400);
  });

  test('PATCH validates hours', async () => {
    const res = await request(app)
      .patch(`/api/businesses/${businessId}`)
      .set(as(owner))
      .send({ hours: { mon: [['18:00', '09:00']] } });
    expect(res.status).toBe(400);
  });

  test('PATCH updates profile', async () => {
    const res = await request(app)
      .patch(`/api/businesses/${businessId}`)
      .set(as(owner))
      .send({ phone: '+92 300 1234567', hours: { mon: [['09:00', '13:00'], ['14:00', '18:00']] } });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+92 300 1234567');
    expect(res.body.hours.mon).toHaveLength(2);
  });

  test('owner cannot deactivate account while owning a business', async () => {
    const res = await request(app).delete('/api/me').set(as(owner));
    expect(res.status).toBe(409);
  });

  test('DELETE archives, then it is gone', async () => {
    const del = await request(app).delete(`/api/businesses/${businessId}`).set(as(owner));
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/businesses/${businessId}`).set(as(owner));
    expect(get.status).toBe(404);
    const list = await request(app).get('/api/businesses').set(as(owner));
    expect(list.body).toHaveLength(0);
  });
});
