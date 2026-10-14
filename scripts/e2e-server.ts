import fs from 'fs';
import http from 'http';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

async function start() {
  const localMongo = 'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe';
  if (process.platform === 'win32' && fs.existsSync(localMongo)) process.env.MONGOMS_SYSTEM_BINARY = localMongo;
  const database = await MongoMemoryReplSet.create({ instanceOpts: [{ port: 29000 + process.pid % 1000 }], replSet: { count: 1, storageEngine: 'wiredTiger' } });
  Object.assign(process.env, { NODE_ENV: 'test', AUTH_MODE: 'local', MONGODB_URI: database.getUri(),
    PORT: '15001', CLIENT_URL: 'http://localhost:15174', SERVER_URL: 'http://localhost:15001',
    JWT_SECRET: 'e2e-fixture-only-session-signing-key', CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '', SMTP_USER: '', SMTP_PASS: '',
    ALLOWED_EMAIL_DOMAINS: 'pccoe.org', ADMIN_EMAIL: 'admin@pccoe.org' });
  const { connectDatabase, disconnectDatabase } = await import('../server/src/common/database/connection');
  const { createApp } = await import('../server/src/app');
  const { initSocketServer } = await import('../server/src/common/socket/socket.server');
  const { User } = await import('../server/src/modules/auth/auth.model');
  const { Department } = await import('../server/src/modules/departments/department.model');
  const { Laboratory } = await import('../server/src/modules/laboratories/laboratory.model');
  const { Computer } = await import('../server/src/modules/computers/computer.model');
  const { hashPassword } = await import('../server/src/modules/auth/password');
  await connectDatabase();
  const department = await Department.create({ name: 'Computer Engineering', code: 'COMP' });
  const passwordHash = await hashPassword('Fixture-password-123!');
  const assistant = await User.create({ name: 'Test Assistant', email: 'assistant@pccoe.org', role: 'LAB_ASSISTANT', department: department._id, passwordHash, profileComplete: true });
  const lab = await Laboratory.create({ name: 'Web Development Lab', code: 'LAB-5401', roomNumber: '5401', building: 'Test Building', department: department._id, assistants: [assistant._id] });
  assistant.assignedLabs = [lab._id]; await assistant.save();
  await User.create({ name: 'Test Student', email: 'student@pccoe.org', role: 'STUDENT', department: department._id, passwordHash, profileComplete: true });
  await User.create({ name: 'Test Admin', email: 'admin@pccoe.org', role: 'ADMIN', passwordHash, profileComplete: true });
  await Computer.create({ assetTag: 'TEST-PC-01', label: 'PC-01', lab: lab._id });
  const server = http.createServer(createApp());
  initSocketServer(server);
  server.listen(15001, () => console.log('Isolated E2E API ready on port 15001'));
  const stop = async () => { server.close(); await disconnectDatabase(); await database.stop(); process.exit(0); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
}
start().catch(error => { console.error(error); process.exit(1); });
