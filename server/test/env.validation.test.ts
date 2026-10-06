import { describe, it, expect } from 'vitest';
import { parseEnv } from '../src/common/config/env';

describe('Environment Configuration & Security Validation', () => {
  it('parses valid environment config in development mode', () => {
    const config = parseEnv({
      NODE_ENV: 'development',
      JWT_SECRET: 'development_secret_32_characters_long_min',
      ALLOWED_EMAIL_DOMAINS: 'pccoe.org,student.pccoe.org,gmail.com',
    });

    expect(config.NODE_ENV).toBe('development');
    expect(config.allowedDomainsList).toContain('pccoe.org');
    expect(config.allowedDomainsList).toContain('gmail.com');
  });

  it('fails startup in production if JWT_SECRET is shorter than 32 characters', () => {
    expect(() => {
      parseEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'too_short',
        ALLOWED_EMAIL_DOMAINS: 'pccoe.org',
      });
    }).toThrow(/at least 32 characters/);
  });

  it('fails startup in production if JWT_SECRET contains placeholder text', () => {
    expect(() => {
      parseEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'replace_with_a_secure_random_key_of_32_chars',
        ALLOWED_EMAIL_DOMAINS: 'pccoe.org',
      });
    }).toThrow(/placeholder/);
  });

  it('fails startup in production if public email domain is configured in ALLOWED_EMAIL_DOMAINS', () => {
    expect(() => {
      parseEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a_very_secure_high_entropy_production_jwt_key_12345',
        ALLOWED_EMAIL_DOMAINS: 'pccoe.org,gmail.com',
      });
    }).toThrow(/public email domain .*gmail\.com.* is strictly prohibited/);
  });

  it('succeeds in production with secure keys and institutional domains only', () => {
    const config = parseEnv({
      NODE_ENV: 'production',
      JWT_SECRET: 'a_very_secure_high_entropy_production_jwt_key_12345',
      ALLOWED_EMAIL_DOMAINS: 'pccoe.org,student.pccoe.org,faculty.pccoe.org',
      ADMIN_EMAIL: 'admin@pccoe.org',
    });

    expect(config.NODE_ENV).toBe('production');
    expect(config.allowedDomainsList).toEqual([
      'pccoe.org',
      'student.pccoe.org',
      'faculty.pccoe.org',
    ]);
  });
});
