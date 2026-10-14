import { config } from 'dotenv';
import path from 'path';
import dns from 'dns';
import fs from 'fs';
import { z } from 'zod';

// Load environment file
export const serverRoot = fs.existsSync(path.resolve(__dirname, '../../../package.json'))
  ? path.resolve(__dirname, '../../..')
  : path.resolve(__dirname, '../../../..');
config({ path: path.join(serverRoot, '.env') });

const PUBLIC_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'icloud.com',
  'aol.com',
  'mail.com',
  'protonmail.com',
  'zoho.com',
];

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    AUTH_MODE: z.enum(['firebase', 'local']).default('firebase'),
    ALLOW_PUBLIC_EMAIL_DOMAINS: z.enum(['true', 'false']).default('false').transform(value => value === 'true'),
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
    EDGE_PROXY_SECRET: z.string().default(''),
    PORT: z.coerce.number().default(5000),
    SERVER_URL: z.string().default(process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000'),
    CLIENT_URL: z.string().default('http://localhost:5173'),
    MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/fixify'),
    DNS_SERVERS: z.string().default(''),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters in non-prod'),
    JWT_EXPIRES_IN: z.string().default('15m'),
    COOKIE_SECRET: z.string().default('fixify-default-cookie-secret-key-salt-32chars'),
    GOOGLE_CLIENT_ID: z.string().default('test-google-client-id.apps.googleusercontent.com'),
    GOOGLE_CLIENT_SECRET: z.string().default('test-google-client-secret'),
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional().default(''),
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional().default(''),
    PRN_REGEX: z.string().default('^[A-Za-z0-9]{8,12}$'),
    ALLOWED_EMAIL_DOMAINS: z.string().default('pccoepune.org,gmail.com'),
    ADMIN_EMAIL: z.string().email().default('admin@pccoepune.org'),
    ESCALATION_TIMEOUT_HOURS: z.coerce.number().default(24),
    DEFAULT_LOW_STOCK_THRESHOLD: z.coerce.number().default(5),
    SESSION_MAX_HOURS: z.coerce.number().default(8),
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_API_KEY: z.string().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().default(''),
    SMTP_HOST: z.string().optional().default('smtp.gmail.com'),
    SMTP_PORT: z.coerce.number().optional().default(587),
    SMTP_USER: z.string().optional().default(''),
    SMTP_PASS: z.string().optional().default(''),
    EMAIL_FROM: z.string().optional().default('Fixify Alerts <notifications@fixify.campus.edu>'),
    RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().default(1000),
    RATE_LIMIT_UNAUTH_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_UNAUTH_MAX: z.coerce.number().default(300),
  })
  .superRefine((data, ctx) => {
    // Strict production security validations
    if (data.NODE_ENV === 'production') {
      if (data.AUTH_MODE === 'local') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['AUTH_MODE'], message: 'Local password mode is only available for development and tests.' });
      }
      // 1. JWT secret length and placeholder refusal
      if (data.JWT_SECRET.length < 32) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'In production, JWT_SECRET must be at least 32 characters long.',
        });
      }
      if (
        data.JWT_SECRET.toLowerCase().includes('replace_with') ||
        data.JWT_SECRET.toLowerCase().includes('secret')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'In production, JWT_SECRET cannot contain placeholder words like "secret" or "replace_with".',
        });
      }

      // 2. Public email domain refusal in production
      const domains = data.ALLOWED_EMAIL_DOMAINS.split(',').map((d) => d.trim().toLowerCase());
      const publicDomainFound = domains.find((d) => PUBLIC_EMAIL_DOMAINS.includes(d));
      if (publicDomainFound && !data.ALLOW_PUBLIC_EMAIL_DOMAINS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ALLOWED_EMAIL_DOMAINS'],
          message: `In production, public email domain "${publicDomainFound}" is strictly prohibited. Only institutional domains are allowed.`,
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema> & {
  allowedDomainsList: string[];
};

export const parseEnv = (override?: Record<string, unknown>): EnvConfig => {
  const raw = {
    ...process.env,
    ...(override || {}),
  };
  const parsed = envSchema.parse(raw);
  const allowedDomainsList = parsed.ALLOWED_EMAIL_DOMAINS.split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);

  return {
    ...parsed,
    allowedDomainsList,
  };
};

export const env = parseEnv();
if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(',').map(server => server.trim()).filter(Boolean));
