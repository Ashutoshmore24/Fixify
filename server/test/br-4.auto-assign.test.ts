import { describe, it, expect, beforeEach } from 'vitest';
import { Department } from '../src/modules/departments/department.model';
import { Laboratory } from '../src/modules/laboratories/laboratory.model';
import { Computer } from '../src/modules/computers/computer.model';
import { User } from '../src/modules/auth/auth.model';
import { TicketService } from '../src/modules/tickets/ticket.service';

describe('BR-4: Auto-Assignment Engine (Least Tickets Strategy & Fallback)', () => {
  let compDept: any;
  let labWithNoAssistant: any;
  let labWithAssistants: any;
  let assistantA: any;
  let assistantB: any;
  let pc1: any;
  let pc2: any;
  let pc3: any;
  let student: any;

  beforeEach(async () => {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
    });

    assistantA = await User.create({
      name: 'Assistant Alpha',
      email: 'alpha@pccoe.org',
      role: 'LAB_ASSISTANT',
      isActive: true,
    });

    assistantB = await User.create({
      name: 'Assistant Beta',
      email: 'beta@pccoe.org',
      role: 'LAB_ASSISTANT',
      isActive: true,
    });

    labWithNoAssistant = await Laboratory.create({
      name: 'Unmanned Lab',
      code: 'LAB-UNMANNED',
      building: 'IT Building',
      department: compDept._id,
      assistants: [],
      isActive: true,
    });

    labWithAssistants = await Laboratory.create({
      name: 'Main Lab',
      code: 'LAB-MAIN',
      building: 'IT Building',
      department: compDept._id,
      assistants: [assistantA._id, assistantB._id],
      isActive: true,
    });

    pc1 = await Computer.create({
      assetTag: 'PC-MAIN-01',
      lab: labWithAssistants._id,
      label: 'PC-01',
    });

    pc2 = await Computer.create({
      assetTag: 'PC-MAIN-02',
      lab: labWithAssistants._id,
      label: 'PC-02',
    });

    pc3 = await Computer.create({
      assetTag: 'PC-UNMANNED-01',
      lab: labWithNoAssistant._id,
      label: 'PC-01',
    });

    student = await User.create({
      name: 'Student User',
      email: 'student@pccoe.org',
      role: 'STUDENT',
    });
  });

  it('sets status to OPEN with null assignedTo when no assistant is assigned to the lab', async () => {
    const ticket = await TicketService.createTicket({
      computer: pc3._id.toString(),
      lab: labWithNoAssistant._id.toString(),
      category: 'SOFTWARE',
      description: 'Need software install in unmanned lab',
      user: {
        id: student._id.toString(),
        email: student.email,
        role: student.role,
        name: student.name,
      },
    });

    expect(ticket.status).toBe('OPEN');
    expect(ticket.assignedTo).toBeNull();
  });

  it('auto-assigns to the assistant with the least active tickets in the lab', async () => {
    // 1. First ticket: both have 0 tickets, goes to one of them (e.g. Assistant A)
    const t1 = await TicketService.createTicket({
      computer: pc1._id.toString(),
      lab: labWithAssistants._id.toString(),
      category: 'HARDWARE',
      description: 'First PC broken key',
      user: {
        id: student._id.toString(),
        email: student.email,
        role: student.role,
        name: student.name,
      },
    });

    expect(t1.status).toBe('ASSIGNED');
    expect(t1.assignedTo).toBeDefined();

    // The assigned assistant now has 1 active ticket.
    const assignedFirst = t1.assignedTo!.toString();
    const otherAssistant =
      assignedFirst === assistantA._id.toString() ? assistantB._id.toString() : assistantA._id.toString();

    // 2. Second ticket: should go to the other assistant who has 0 active tickets!
    const t2 = await TicketService.createTicket({
      computer: pc2._id.toString(),
      lab: labWithAssistants._id.toString(),
      category: 'NETWORK',
      description: 'Second PC network issue',
      user: {
        id: student._id.toString(),
        email: student.email,
        role: student.role,
        name: student.name,
      },
    });

    expect(t2.status).toBe('ASSIGNED');
    expect(t2.assignedTo!.toString()).toBe(otherAssistant);
  });
});
