import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { Department } from '../src/modules/departments/department.model';
import { Laboratory } from '../src/modules/laboratories/laboratory.model';
import { Computer } from '../src/modules/computers/computer.model';
import { User } from '../src/modules/auth/auth.model';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Phase 2 Vertical Slice End-to-End API Integration', () => {
  const app = createApp();

  let student: any;
  let assistant: any;
  let admin: any;
  let compDept: any;
  let lab101: any;
  let pc1: any;

  let studentToken: string;
  let assistantToken: string;
  let adminToken: string;

  beforeEach(async () => {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
    });

    student = await User.create({
      name: 'Student Rahul',
      email: 'rahul@pccoe.org',
      role: 'STUDENT',
      department: compDept._id,
    });

    assistant = await User.create({
      name: 'Assistant Sharma',
      email: 'sharma@pccoe.org',
      role: 'LAB_ASSISTANT',
      department: compDept._id,
      assignedLabs: [],
    });

    admin = await User.create({
      name: 'System Admin',
      email: 'admin@pccoe.org',
      role: 'ADMIN',
    });

    lab101 = await Laboratory.create({
      name: 'Advanced Computing Lab',
      code: 'LAB-101',
      building: 'IT Building 1st Floor',
      department: compDept._id,
      assistants: [assistant._id],
    });

    assistant.assignedLabs = [lab101._id];
    await assistant.save();

    pc1 = await Computer.create({
      assetTag: 'COMP-L101-PC01',
      lab: lab101._id,
      label: 'PC-01',
      processor: 'Intel Core i7-12700',
      ram: '16 GB DDR4',
      storage: '512 GB NVMe SSD',
      status: 'OPERATIONAL',
    });

    studentToken = AuthService.generateToken(student);
    assistantToken = AuthService.generateToken(assistant);
    adminToken = AuthService.generateToken(admin);
  });

  it('runs complete vertical slice lifecycle: login → report → assistant accepts/starts/resolves → notifications', async () => {
    // 1. Resolve scanned QR lab
    const labRes = await request(app)
      .get(`/api/v1/laboratories/by-code/LAB-101`)
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(labRes.status).toBe(200);
    expect(labRes.body.data.code).toBe('LAB-101');

    // 2. Query computers in the lab
    const computersRes = await request(app)
      .get(`/api/v1/computers?lab=${lab101._id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(computersRes.status).toBe(200);
    expect(computersRes.body.data.length).toBe(1);
    expect(computersRes.body.data[0].label).toBe('PC-01');

    // 3. Student reports complaint on PC-01
    const createRes = await request(app)
      .post('/api/v1/tickets')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        computer: pc1._id.toString(),
        lab: lab101._id.toString(),
        category: 'HARDWARE',
        description: 'Keyboard spacebar physically broken and stuck',
      });

    expect(createRes.status).toBe(201);
    const createdTicket = createRes.body.data;
    expect(createdTicket.ticketId).toMatch(/^FIX-\d{4}-\d{6}$/);
    expect(createdTicket.status).toBe('ASSIGNED'); // BR-4 auto-assigned to Assistant Sharma
    expect(createdTicket.assignedTo.toString()).toBe(assistant._id.toString());

    // 4. Assistant views assigned tickets
    const asstTicketsRes = await request(app)
      .get('/api/v1/tickets')
      .set('Authorization', `Bearer ${assistantToken}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(asstTicketsRes.status).toBe(200);
    expect(asstTicketsRes.body.data.length).toBe(1);
    expect(asstTicketsRes.body.data[0]._id).toBe(createdTicket._id);

    // 5. Assistant accepts ticket
    const acceptRes = await request(app)
      .patch(`/api/v1/tickets/${createdTicket._id}/status`)
      .set('Authorization', `Bearer ${assistantToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        status: 'ACCEPTED',
        note: 'Assigned technician acknowledged receipt',
      });

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.status).toBe('ACCEPTED');

    // 6. Assistant starts repair
    const startRes = await request(app)
      .patch(`/api/v1/tickets/${createdTicket._id}/status`)
      .set('Authorization', `Bearer ${assistantToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        status: 'IN_PROGRESS',
        note: 'Replacing keyboard unit',
      });

    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('IN_PROGRESS');

    // 7. Assistant adds work note
    const noteRes = await request(app)
      .post(`/api/v1/tickets/${createdTicket._id}/notes`)
      .set('Authorization', `Bearer ${assistantToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        note: 'Fetched replacement mechanical keyboard from IT stores',
      });

    expect(noteRes.status).toBe(200);

    // 8. Assistant resolves and closes with BR-8
    const closeRes = await request(app)
      .patch(`/api/v1/tickets/${createdTicket._id}/status`)
      .set('Authorization', `Bearer ${assistantToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        status: 'CLOSED',
        testedOk: true,
        resolutionNotes: 'Replaced keyboard and verified key input response in terminal',
      });

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('CLOSED');
    expect(closeRes.body.data.isActive).toBe(false);
    expect(closeRes.body.data.testedOk).toBe(true);

    // 9. Student checks notifications
    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`)
      .set('X-Requested-With', 'XMLHttpRequest');

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.data.length).toBeGreaterThan(0);

    // 10. Admin role management: Admin changes a user role
    const roleRes = await request(app)
      .patch(`/api/v1/users/${student._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({
        role: 'FACULTY',
      });

    expect(roleRes.status).toBe(200);
    expect(roleRes.body.data.role).toBe('FACULTY');
  });
});
