import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { AuthService } from '../src/modules/auth/auth.service';
import { User } from '../src/modules/auth/auth.model';

describe('User-Keyed & Campus-Safe Rate Limiter', () => {
  const app = createApp();

  it('runs rate limiter with unauthenticated IP key when not logged in', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    // Standard headers present
    expect(res.headers['ratelimit-limit']).toBeDefined();
  });

  it('keys rate limiter by authenticated user ID when session token is provided', async () => {
    const user = new User({
      name: 'Rate Limit User',
      email: 'ratelimit.user@pccoe.org',
      role: 'STUDENT',
      isActive: true,
    });
    await user.save();
    const token = AuthService.generateToken(user);

    const res = await request(app)
      .get('/api/v1/health')
      .set('Cookie', [`fixify_token=${token}`]);

    expect(res.status).toBe(200);
    // Rate limit header reflects higher authenticated quota
    const limit = Number(res.headers['ratelimit-limit']);
    expect(limit).toBeGreaterThanOrEqual(1000);
  });
});
