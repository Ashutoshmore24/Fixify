import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { env } from '../src/common/config/env';

describe('CORS Exact Origin Allowlist Security', () => {
  const app = createApp();

  it('permits requests from the exact configured CLIENT_URL origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', env.CLIENT_URL);

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(env.CLIENT_URL);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('denies requests from unauthorized origins', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://unauthorized-origin.com');

    // Express CORS middleware passes error to error handler when callback(new Error(...)) is called
    expect(res.status).toBe(500);
    expect(res.body.error.message).toMatch(/CORS blocked/);
  });
});
