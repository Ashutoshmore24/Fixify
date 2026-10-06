import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { AuthService } from '../src/modules/auth/auth.service';
import { User } from '../src/modules/auth/auth.model';

describe('BR-10 Decoupled Auth Module & RBAC', () => {
  const app = createApp();

  it('validates allowed institutional domains and rejects unauthorized domains', () => {
    expect(AuthService.isDomainAllowed('student@pccoe.org')).toBe(true);
    expect(AuthService.isDomainAllowed('faculty@student.pccoe.org')).toBe(true);
    expect(AuthService.isDomainAllowed('hacker@unauthorized-domain.com')).toBe(false);
  });

  it('provisions ADMIN role for configured ADMIN_EMAIL upon login', async () => {
    const res = await request(app)
      .post('/api/v1/auth/dev-login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: 'admin@pccoe.org',
        name: 'Super Admin',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('provisions FACULTY role when email contains faculty keyword', async () => {
    const res = await request(app)
      .post('/api/v1/auth/dev-login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: 'prof.smith.faculty@pccoe.org',
        name: 'Prof Smith',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('FACULTY');
  });

  it('provisions STUDENT role by default for regular students', async () => {
    const res = await request(app)
      .post('/api/v1/auth/dev-login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: 'student.2024@pccoe.org',
        name: 'John Student',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('STUDENT');
  });

  it('authenticates session and retrieves user profile via GET /api/v1/auth/me', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/dev-login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: 'student.test@pccoe.org',
        name: 'Jane Student',
      });

    const cookie = (loginRes.headers['set-cookie'] || []) as string[];

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe('student.test@pccoe.org');
  });

  it('clears auth cookie upon logout', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/dev-login')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        email: 'user.logout@pccoe.org',
      });

    const cookie = (loginRes.headers['set-cookie'] || []) as string[];

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
  });

  it('denies inactive or soft-deleted users', async () => {
    const user = new User({
      name: 'Deactivated User',
      email: 'deactivated@pccoe.org',
      role: 'STUDENT',
      isActive: false,
    });
    await user.save();

    const token = AuthService.generateToken(user);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`fixify_token=${token}`]);

    expect(res.status).toBe(404);
  });

  it('strictly rejects lookalike domains and subdomains not in allowed list', () => {
    expect(AuthService.isDomainAllowed('hacker@pccoe.org.evil.com')).toBe(false);
    expect(AuthService.isDomainAllowed('hacker@evilpccoe.org')).toBe(false);
    expect(AuthService.isDomainAllowed('hacker@fake-pccoe.org')).toBe(false);
    expect(AuthService.isDomainAllowed('hacker@notpccoe.org')).toBe(false);
    expect(AuthService.isDomainAllowed('student@pccoe.org')).toBe(true);
  });

  it('rejects unverified Google email in loginWithGoogle', async () => {
    const mockOAuthClient = {
      verifyIdToken: async () => ({
        getPayload: () => ({
          email: 'unverified@pccoe.org',
          name: 'Unverified User',
          email_verified: false,
        }),
      }),
    };

    AuthService.setOAuth2Client(mockOAuthClient as never);

    await expect(
      AuthService.loginWithGoogle('mock-id-token')
    ).rejects.toThrow(/not verified/);
  });

  it('rejects expired or invalid Google token', async () => {
    const mockOAuthClient = {
      verifyIdToken: async () => {
        throw new Error('Token expired');
      },
    };

    AuthService.setOAuth2Client(mockOAuthClient as never);

    await expect(
      AuthService.loginWithGoogle('expired-token')
    ).rejects.toThrow(/Invalid or expired Google authentication token/);
  });

  it('enforces absolute session max lifetime and rejects tokens exceeding SESSION_MAX_HOURS', async () => {
    const user = new User({
      name: 'Session Test User',
      email: 'session.test@pccoe.org',
      role: 'STUDENT',
      isActive: true,
    });
    await user.save();

    // Generate token with sessionStartedAt 9 hours in the past (default max is 8 hours)
    const nineHoursAgo = Date.now() - 9 * 3600 * 1000;
    const expiredToken = AuthService.generateToken(user, nineHoursAgo);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [`fixify_token=${expiredToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('MAX_SESSION_EXPIRED');
  });

  it('proves dev-login endpoint is disabled and returns 404 when NODE_ENV is production', async () => {
    const originalEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = 'production';
      // Re-create app under production environment
      const prodApp = createApp();

      const res = await request(prodApp)
        .post('/api/v1/auth/dev-login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'admin@pccoe.org' });

      if (res.status !== 404) {
        console.error('PROD DEV-LOGIN RESPONSE:', res.status, res.body);
      }

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
