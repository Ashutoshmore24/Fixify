import { beforeAll, afterAll, afterEach } from 'vitest';
import { startTestDb, stopTestDb, clearTestDb } from './helpers/db.helper';

// Ensure test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_long_enough_for_testing_12345';
process.env.JWT_EXPIRES_IN = '15m';
process.env.COOKIE_SECRET = 'test_cookie_secret_at_least_32_characters';
process.env.ALLOWED_EMAIL_DOMAINS = 'pccoe.org,student.pccoe.org,faculty.pccoe.org,gmail.com';
process.env.ADMIN_EMAIL = 'admin@pccoe.org';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.SERVER_URL = 'http://localhost:5000';

// Use local mongod binary if available to avoid 500MB network download
if (process.platform === 'win32') {
  const localMongo = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
  if (require('fs').existsSync(localMongo)) {
    process.env.MONGOMS_SYSTEM_BINARY = localMongo;
  }
}

beforeAll(async () => {
  await startTestDb();
}, 60000);

afterEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await stopTestDb();
}, 30000);
