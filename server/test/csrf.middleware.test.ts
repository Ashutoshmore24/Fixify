import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Same-site CSRF Protection Middleware', () => {
  const app = createApp();

  it('allows safe read-only GET requests without custom CSRF headers', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
  });

  it('blocks state-changing POST requests without verification header', async () => {
    const res = await request(app)
      .post('/api/v1/qr/generate')
      .send({ labCode: 'LAB-101' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CSRF_VALIDATION_FAILED');
  });

  it('permits state-changing POST requests with X-Requested-With header', async () => {
    const res = await request(app)
      .post('/api/v1/qr/generate')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ labCode: 'LAB-101' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('permits state-changing POST requests with X-CSRF-Token header', async () => {
    const res = await request(app)
      .post('/api/v1/qr/generate')
      .set('X-CSRF-Token', 'custom-csrf-token')
      .send({ labCode: 'LAB-102' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
