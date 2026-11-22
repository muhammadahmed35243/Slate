import request from 'supertest';
import app from '../../src/app.js';

describe('auth guard', () => {
  test('GET /api/me without token → 401', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('GET /api/businesses with bad token → 401', async () => {
    const res = await request(app).get('/api/businesses').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  test('unknown route → 404 JSON', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
