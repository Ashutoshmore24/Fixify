import fs from 'node:fs';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

const siteUrl = process.argv[2];
if (!siteUrl || !siteUrl.startsWith('https://')) throw new Error('Usage: node scripts/prepare-hosting-env.mjs https://your-site.workers.dev');
const local = dotenv.parse(fs.readFileSync('server/.env'));
const firebase = JSON.parse(fs.readFileSync('server/serviceAccountKey.json', 'utf8'));
const existing = fs.existsSync('deploy/render.env') ? dotenv.parse(fs.readFileSync('deploy/render.env')) : {};
const randomKey = () => crypto.randomBytes(32).toString('hex');
const settings = {
  NODE_ENV: 'production', AUTH_MODE: 'firebase', NODE_VERSION: '24', TRUST_PROXY_HOPS: '1',
  CLIENT_URL: new URL(siteUrl).origin,
  MONGODB_URI: local.MONGODB_URI,
  JWT_SECRET: existing.JWT_SECRET || randomKey(), COOKIE_SECRET: existing.COOKIE_SECRET || randomKey(),
  EDGE_PROXY_SECRET: existing.EDGE_PROXY_SECRET || randomKey(),
  ALLOW_PUBLIC_EMAIL_DOMAINS: 'true', ALLOWED_EMAIL_DOMAINS: local.ALLOWED_EMAIL_DOMAINS,
  ADMIN_EMAIL: local.ADMIN_EMAIL, PRN_REGEX: local.PRN_REGEX,
  FIREBASE_SERVICE_ACCOUNT_JSON: JSON.stringify(firebase),
  CLOUDINARY_CLOUD_NAME: local.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: local.CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET: local.CLOUDINARY_API_SECRET,
  PUPPETEER_SKIP_DOWNLOAD: 'true',
};
// Single quotes preserve the JSON private key's escaped newlines when dotenv reads it.
fs.writeFileSync('deploy/render.env', Object.entries(settings).map(([key, value]) => {
  if (value === undefined || value.includes("'")) throw new Error(`Missing or unsupported value for ${key}`);
  return `${key}='${value}'`;
}).join('\n') + '\n');
console.log('Created Git-ignored deploy/render.env with production settings. No secrets printed.');
