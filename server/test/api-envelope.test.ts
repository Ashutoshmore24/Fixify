import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('API Envelope & Error Handling', () => {
  const app = createApp();

  it('returns standard success envelope on /health', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'healthy');
    expect(res.body.data).toHaveProperty('app', 'Fixify API');
  });

  it('returns standard error envelope on 404 Not Found', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint was not found on this server',
      },
    });
  });

  it('returns 422 VALIDATION_ERROR on malformed request bodies', async () => {
    const res = await request(app)
      .post('/api/v1/auth/dev-login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toBeDefined();
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });
});
