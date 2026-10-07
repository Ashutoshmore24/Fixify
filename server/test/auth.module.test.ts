import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { AuthService } from '../src/modules/auth/auth.service';
import { User } from '../src/modules/auth/auth.model';
import { UnauthorizedError } from '../src/common/errors/app-error';

describe('BR-10 Firebase Auth Module, RBAC & Profile Completion', () => {
  const app = createApp();

  beforeEach(() => {
    // Reset custom verifier before each test
    AuthService.setTokenVerifier(null);
  });

  it('validates allowed institutional domains and rejects unauthorized domains', () => {
    expect(AuthService.isDomainAllowed('student@pccoe.org')).toBe(true);
    expect(AuthService.isDomainAllowed('faculty@student.pccoe.org')).toBe(true);
    expect(AuthService.isDomainAllowed('hacker@unauthorized-domain.com')).toBe(false);
  });

  it('strictly rejects lookalike domains and subdomains not in allowed list', () => {
    expect(AuthService.isDomainAllowed('hacker@pccoe.org.evil.com')).toBe(false);
    expect(AuthService.isDomainAllowed('hacker@evilpccoe.org')).toBe(false);
    expect(AuthService.isDomainAllowed('hacker@fake-pccoe.org')).toBe(false);
    expect(AuthService.isDomainAllowed('hacker@notpccoe.org')).toBe(false);
    expect(AuthService.isDomainAllowed('student@pccoe.org')).toBe(true);
  });

  it('rejects login with unauthorized domain via POST /api/v1/auth/session (domain rejection)', async () => {
    AuthService.setTokenVerifier(async () => ({
      uid: 'fb-user-evil-1',
      email: 'attacker@evil-domain.com',
      email_verified: true,
      name: 'Evil User',
    }));

    const res = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'valid-token-unauthorized-domain' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('UNAUTHORIZED_DOMAIN');
  });

  it('rejects unverified Firebase email via POST /api/v1/auth/session (unverified email rejection)', async () => {
    AuthService.setTokenVerifier(async () => ({
      uid: 'fb-user-unverified-1',
      email: 'student.unverified@pccoe.org',
      email_verified: false,
      name: 'Unverified Student',
    }));

    const res = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'unverified-email-token' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('UNVERIFIED_EMAIL');
  });

  it('rejects expired or revoked Firebase token (expired/revoked token)', async () => {
    // 1. Expired token
    AuthService.setTokenVerifier(async () => {
      throw new UnauthorizedError('Authentication token has expired.', 'TOKEN_EXPIRED');
    });

    const expiredRes = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'expired-token' });

    expect(expiredRes.status).toBe(401);
    expect(expiredRes.body.error.code).toBe('TOKEN_EXPIRED');

    // 2. Revoked token
    AuthService.setTokenVerifier(async () => {
      throw new UnauthorizedError('Authentication token has been revoked.', 'TOKEN_REVOKED');
    });

    const revokedRes = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'revoked-token' });

    expect(revokedRes.status).toBe(401);
    expect(revokedRes.body.error.code).toBe('TOKEN_REVOKED');
  });

  it('forces new user/Google user without profile to complete profile (profileComplete gating)', async () => {
    AuthService.setTokenVerifier(async () => ({
      uid: 'google-new-user-123',
      email: 'new.student@pccoe.org',
      email_verified: true,
      name: 'New Google Student',
    }));

    // 1. Initial session creation
    const sessionRes = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'google-id-token' });

    expect(sessionRes.status).toBe(200);
    expect(sessionRes.body.data.profileComplete).toBe(false);
    const sessionCookie = (sessionRes.headers['set-cookie'] || []) as unknown as string[];

    // 2. Accessing tickets endpoint must be blocked with 403 PROFILE_INCOMPLETE
    const ticketsRes = await request(app)
      .get('/api/v1/tickets')
      .set('Cookie', sessionCookie);

    expect(ticketsRes.status).toBe(403);
    expect(ticketsRes.body.error.code).toBe('PROFILE_INCOMPLETE');

    // 3. User can still access GET /api/v1/auth/me
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.profileComplete).toBe(false);

    // 4. Complete student profile
    const profileRes = await request(app)
      .post('/api/v1/auth/register-profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', sessionCookie)
      .send({
        role: 'STUDENT',
        firstName: 'New',
        lastName: 'Student',
        course: 'B.Tech Computer Engineering',
        year: 'TE',
        division: '1',
        prn: '12022099',
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.profileComplete).toBe(true);
    expect(profileRes.body.data.user.prn).toBe('12022099');
    const rawSetCookies = (profileRes.headers['set-cookie'] || []) as unknown as string[];
    const updatedCookie = Array.isArray(rawSetCookies) ? [rawSetCookies[rawSetCookies.length - 1] as string] : [String(rawSetCookies)];

    // 5. Protected resources are now accessible!
    const ticketsAllowedRes = await request(app)
      .get('/api/v1/tickets')
      .set('Cookie', updatedCookie);

    expect(ticketsAllowedRes.status).toBe(200);
  });

  it('rejects role escalation attempt via signup/profile payload', async () => {
    AuthService.setTokenVerifier(async () => ({
      uid: 'escalation-user-1',
      email: 'hacker.student@pccoe.org',
      email_verified: true,
      name: 'Sneaky User',
    }));

    const sessionRes = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'token-escalate' });

    const cookie = sessionRes.headers['set-cookie'] as unknown as string[];

    // Attempt to register with ADMIN role
    const escalateRes = await request(app)
      .post('/api/v1/auth/register-profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookie)
      .send({
        role: 'ADMIN',
        firstName: 'Fake',
        lastName: 'Admin',
      });

    // Zod or controller rejects role escalation
    expect(escalateRes.status).toBeGreaterThanOrEqual(400);
  });

  it('rejects duplicate PRN during student profile registration', async () => {
    // 1. Register first student with PRN 12022001
    const user1 = new User({
      name: 'Existing Student',
      email: 'existing.student@pccoe.org',
      role: 'STUDENT',
      prn: '12022001',
      profileComplete: true,
      approvalStatus: 'APPROVED',
      isActive: true,
    });
    await user1.save();

    // 2. Second student signs in
    AuthService.setTokenVerifier(async () => ({
      uid: 'duplicate-prn-user-2',
      email: 'second.student@pccoe.org',
      email_verified: true,
      name: 'Second Student',
    }));

    const sessionRes = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'token-second' });

    const cookie = sessionRes.headers['set-cookie'] as unknown as string[];

    // 3. Second student tries to claim the same PRN 12022001
    const duplicateRes = await request(app)
      .post('/api/v1/auth/register-profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookie)
      .send({
        role: 'STUDENT',
        firstName: 'Second',
        lastName: 'Student',
        course: 'B.Tech IT',
        year: 'SE',
        division: '2',
        prn: '12022001',
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('DUPLICATE_PRN');
  });

  it('auto-approves faculty with faculty domain and marks others as PENDING_APPROVAL', async () => {
    // Faculty with faculty pattern email
    AuthService.setTokenVerifier(async () => ({
      uid: 'faculty-approved-uid',
      email: 'prof.sharma.faculty@pccoe.org',
      email_verified: true,
      name: 'Prof Sharma',
    }));

    const facSession = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'token-faculty' });

    const facCookie = facSession.headers['set-cookie'] as unknown as string[];

    const facProfile = await request(app)
      .post('/api/v1/auth/register-profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', facCookie)
      .send({
        role: 'FACULTY',
        firstName: 'Sharma',
        lastName: 'Professor',
        employeeId: 'EMP-9901',
      });

    expect(facProfile.status).toBe(200);
    expect(facProfile.body.data.approvalStatus).toBe('APPROVED');

    // Faculty without faculty email pattern: PENDING_APPROVAL
    AuthService.setTokenVerifier(async () => ({
      uid: 'faculty-pending-uid',
      email: 'regular.name@pccoe.org',
      email_verified: true,
      name: 'Regular Faculty Name',
    }));

    const pendingSession = await request(app)
      .post('/api/v1/auth/session')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ idToken: 'token-pending' });

    const pendingCookie = pendingSession.headers['set-cookie'] as unknown as string[];

    const pendingProfile = await request(app)
      .post('/api/v1/auth/register-profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', pendingCookie)
      .send({
        role: 'FACULTY',
        firstName: 'Regular',
        lastName: 'Faculty',
        employeeId: 'EMP-9902',
      });

    expect(pendingProfile.status).toBe(200);
    expect(pendingProfile.body.data.approvalStatus).toBe('PENDING_APPROVAL');
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
      const prodApp = createApp();

      const res = await request(prodApp)
        .post('/api/v1/auth/dev-login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'admin@pccoe.org' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
