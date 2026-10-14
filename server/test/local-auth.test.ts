import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { env } from '../src/common/config/env';
import { User } from '../src/modules/auth/auth.model';
import { hashPassword, verifyPassword } from '../src/modules/auth/password';

describe('Local password authentication', () => {
  const app = createApp();
  const password = 'Local-test-password-123!';
  beforeEach(() => { env.AUTH_MODE = 'local'; });
  afterEach(() => { env.AUTH_MODE = 'firebase'; });
  const login = (email: string, suppliedPassword = password) => request(app).post('/api/v1/auth/password')
    .set('X-Requested-With', 'XMLHttpRequest').send({ email, password: suppliedPassword });

  it('salts password hashes and rejects incorrect passwords', async () => {
    const first = await hashPassword(password);
    expect(await hashPassword(password)).not.toBe(first);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword('incorrect', first)).toBe(false);
  });

  it('issues a session for a seeded staff account without exposing its hash', async () => {
    await User.create({ name: 'Local Assistant', email: 'assistant@pccoe.org', role: 'LAB_ASSISTANT', profileComplete: true, passwordHash: await hashPassword(password) });
    expect((await login('assistant@pccoe.org', 'wrong')).status).toBe(401);
    const response = await login('assistant@pccoe.org');
    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe('LAB_ASSISTANT');
    expect(response.body.data.user.passwordHash).toBeUndefined();
    const me = await request(app).get('/api/v1/auth/me').set('Cookie', response.headers['set-cookie'] || '');
    expect(me.status).toBe(200);
    expect(me.body.data.user.passwordHash).toBeUndefined();
  });

  it('rejects inactive accounts and disables the route in Firebase mode', async () => {
    await User.create({ name: 'Inactive', email: 'inactive@pccoe.org', isActive: false, passwordHash: await hashPassword(password) });
    expect((await login('inactive@pccoe.org')).status).toBe(403);
    env.AUTH_MODE = 'firebase';
    expect((await login('inactive@pccoe.org')).status).toBe(404);
  });

  it('registers students and blocks privileged public registration', async () => {
    const profile = { firstName: 'Local', lastName: 'Student', role: 'STUDENT', prn: 'LOCAL1234', course: 'Computer Engineering', year: 'TE', division: 'A' };
    const register = (role: string) => request(app).post('/api/v1/auth/local-register')
      .set('X-Requested-With', 'XMLHttpRequest').send({ email: 'student@pccoe.org', password, profile: { ...profile, role } });
    expect((await register('ADMIN')).status).toBe(422);
    expect((await register('STUDENT')).status).toBe(201);
    expect((await login('student@pccoe.org')).body.data.user.profileComplete).toBe(true);
    expect((await register('STUDENT')).status).toBe(409);
  });
});
