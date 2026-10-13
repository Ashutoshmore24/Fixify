import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Department } from '../src/modules/departments/department.model';
import { Laboratory } from '../src/modules/laboratories/laboratory.model';
import { User } from '../src/modules/auth/auth.model';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Staff Provisioning Security Boundary Tests', () => {
  const app = createApp();

  let compDept: any;
  let studentUser: any;
  let assistantUser: any;
  let adminUser: any;
  let lab5401: any;

  let studentToken: string;
  let assistantToken: string;
  let adminToken: string;

  beforeEach(async () => {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
      isActive: true,
    });

    lab5401 = await Laboratory.create({
      name: 'Web Development Lab',
      code: 'LAB-5401',
      roomNumber: '5401',
      building: 'Computer Engineering Building',
      department: compDept._id,
      assistants: [],
      isActive: true,
    });

    studentUser = await User.create({
      name: 'Rahul Deshmukh',
      email: 'rahul.deshmukh@pccoepune.org',
      role: 'STUDENT',
      department: compDept._id,
      profileComplete: true,
      approvalStatus: 'APPROVED',
      isActive: true,
    });

    assistantUser = await User.create({
      name: 'Mrs. Shradha Gade',
      email: 'shradha.gade@pccoepune.org',
      role: 'LAB_ASSISTANT',
      department: compDept._id,
      assignedLabs: [lab5401._id],
      profileComplete: true,
      approvalStatus: 'APPROVED',
      isActive: true,
    });

    adminUser = await User.create({
      name: 'Prof. Rajesh Kulkarni',
      email: 'admin@pccoepune.org',
      role: 'ADMIN',
      department: compDept._id,
      profileComplete: true,
      approvalStatus: 'APPROVED',
      isActive: true,
    });

    studentToken = AuthService.generateToken(studentUser);
    assistantToken = AuthService.generateToken(assistantUser);
    adminToken = AuthService.generateToken(adminUser);
  });

  // 1. Unauthenticated Access Tests
  it('rejects unauthenticated user accessing GET /api/v1/admin/provision-staff with 401', async () => {
    const res = await request(app).get('/api/v1/admin/provision-staff');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects unauthenticated user accessing direct GET /api/v1/provision-staff with 401', async () => {
    const res = await request(app).get('/api/v1/provision-staff');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects unauthenticated user calling POST /api/v1/admin/provision-staff with 401', async () => {
    const res = await request(app)
      .post('/api/v1/admin/provision-staff')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        name: 'Hacker',
        email: 'hacker@pccoepune.org',
        role: 'ADMIN',
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // 2. Student Role Authorization Tests
  it('denies Student calling GET /api/v1/admin/provision-staff with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/provision-staff')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(['FORBIDDEN', 'FORBIDDEN_ROLE']).toContain(res.body.error.code);
  });

  it('denies Student directly calling POST /api/v1/provision-staff with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/provision-staff')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        name: 'Escalated Student',
        email: 'escalate@pccoepune.org',
        role: 'ADMIN',
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(['FORBIDDEN', 'FORBIDDEN_ROLE']).toContain(res.body.error.code);
  });

  // 3. Lab Assistant Role Authorization Tests
  it('denies Lab Assistant calling GET /api/v1/admin/provision-staff with 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/provision-staff')
      .set('Authorization', `Bearer ${assistantToken}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(['FORBIDDEN', 'FORBIDDEN_ROLE']).toContain(res.body.error.code);
  });

  it('denies Lab Assistant calling POST /api/v1/admin/provision-staff with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/admin/provision-staff')
      .set('Authorization', `Bearer ${assistantToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        name: 'New Assistant',
        email: 'new.assistant@pccoepune.org',
        role: 'LAB_ASSISTANT',
      });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(['FORBIDDEN', 'FORBIDDEN_ROLE']).toContain(res.body.error.code);
  });

  // 4. Role Escalation Prevention via Public Registration
  it('rejects attempt to self-assign ADMIN or LAB_ASSISTANT role in register-profile', async () => {
    const freshUser = await User.create({
      name: 'Fresh Student',
      email: 'fresh@pccoepune.org',
      role: 'STUDENT',
      profileComplete: false,
      approvalStatus: 'APPROVED',
      isActive: true,
    });
    const freshToken = AuthService.generateToken(freshUser);

    const res = await request(app)
      .post('/api/v1/auth/register-profile')
      .set('Authorization', `Bearer ${freshToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        role: 'ADMIN',
        firstName: 'Fresh',
        lastName: 'Student',
      });

    expect([400, 403, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);

    // Verify role was NOT escalated in DB
    const refreshed = await User.findById(freshUser._id);
    expect(refreshed?.role).toBe('STUDENT');
  });

  // 5. Authenticated Administrator Allowed Tests
  it('allows authenticated Administrator to query GET /api/v1/admin/provision-staff', async () => {
    const res = await request(app)
      .get('/api/v1/admin/provision-staff')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('staff');
    expect(res.body.data).toHaveProperty('laboratories');
    expect(res.body.data).toHaveProperty('departments');
    expect(Array.isArray(res.body.data.staff)).toBe(true);
  });

  it('allows authenticated Administrator to provision a new Lab Assistant account', async () => {
    const newStaffPayload = {
      name: 'Mr. Nitin Kurwar',
      email: 'nitin.kurwar@pccoepune.org',
      role: 'LAB_ASSISTANT',
      password: 'Kurwar@5402#Pccoe',
      department: compDept._id.toString(),
      assignedLabs: [lab5401._id.toString()],
    };

    const res = await request(app)
      .post('/api/v1/admin/provision-staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send(newStaffPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('nitin.kurwar@pccoepune.org');
    expect(res.body.data.user.role).toBe('LAB_ASSISTANT');

    // Verify database record
    const createdUser = await User.findOne({ email: 'nitin.kurwar@pccoepune.org' });
    expect(createdUser).not.toBeNull();
    expect(createdUser?.role).toBe('LAB_ASSISTANT');
    expect(createdUser?.assignedLabs.map((id: any) => id.toString())).toContain(lab5401._id.toString());
  });

  it('rejects invalid or unauthorized role values in provision-staff payload', async () => {
    const invalidPayload = {
      name: 'Invalid Role Staff',
      email: 'invalid.role@pccoepune.org',
      role: 'SUPER_USER_ROOT',
    };

    const res = await request(app)
      .post('/api/v1/admin/provision-staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send(invalidPayload);

    expect([400, 422]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });
});
