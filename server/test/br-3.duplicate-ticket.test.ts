import { describe, it, expect, beforeEach } from 'vitest';
import { Department } from '../src/modules/departments/department.model';
import { Laboratory } from '../src/modules/laboratories/laboratory.model';
import { Computer } from '../src/modules/computers/computer.model';
import { User } from '../src/modules/auth/auth.model';
import { Ticket } from '../src/modules/tickets/ticket.model';
import { TicketService } from '../src/modules/tickets/ticket.service';

describe('BR-3: Duplicate Ticket Prevention (Partial Unique Index { computer: 1, isActive: true })', () => {
  let student1: any;
  let student2: any;
  let compDept: any;
  let lab: any;
  let computer: any;

  beforeEach(async () => {
    // Ensure index is created
    await Ticket.createIndexes();

    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
    });

    lab = await Laboratory.create({
      name: 'Lab 101',
      code: 'LAB-101',
      building: 'IT Building',
      department: compDept._id,
      assistants: [],
    });

    computer = await Computer.create({
      assetTag: 'COMP-L101-PC05',
      lab: lab._id,
      label: 'PC-05',
    });

    student1 = await User.create({
      name: 'Student One',
      email: 'student1@pccoe.org',
      role: 'STUDENT',
    });

    student2 = await User.create({
      name: 'Student Two',
      email: 'student2@pccoe.org',
      role: 'STUDENT',
    });
  });

  it('prevents sequential second active complaint on the same computer', async () => {
    const ticket1 = await TicketService.createTicket({
      computer: computer._id.toString(),
      lab: lab._id.toString(),
      category: 'HARDWARE',
      description: 'First complaint: Mouse not working',
      user: {
        id: student1._id.toString(),
        email: student1.email,
        role: student1.role,
        name: student1.name,
      },
    });

    expect(ticket1.isActive).toBe(true);

    // Attempt sequential 2nd ticket while 1st is still active
    await expect(
      TicketService.createTicket({
        computer: computer._id.toString(),
        lab: lab._id.toString(),
        category: 'HARDWARE',
        description: 'Second complaint: Mouse still broken',
        user: {
          id: student2._id.toString(),
          email: student2.email,
          role: student2.role,
          name: student2.name,
        },
      })
    ).rejects.toThrow(/BR-3 Violation/);
  });

  it('handles concurrent double submit: exactly one ticket is created and the second is rejected', async () => {
    const p1 = TicketService.createTicket({
      computer: computer._id.toString(),
      lab: lab._id.toString(),
      category: 'HARDWARE',
      description: 'Concurrent submit from User A',
      user: {
        id: student1._id.toString(),
        email: student1.email,
        role: student1.role,
        name: student1.name,
      },
    });

    const p2 = TicketService.createTicket({
      computer: computer._id.toString(),
      lab: lab._id.toString(),
      category: 'HARDWARE',
      description: 'Concurrent submit from User B',
      user: {
        id: student2._id.toString(),
        email: student2.email,
        role: student2.role,
        name: student2.name,
      },
    });

    const results = await Promise.allSettled([p1, p2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const activeTicketsCount = await Ticket.countDocuments({
      computer: computer._id,
      isActive: true,
    });
    expect(activeTicketsCount).toBe(1);
  });

  it('allows a new ticket on the same computer after previous ticket is CLOSED (isActive: false)', async () => {
    const ticket1 = await TicketService.createTicket({
      computer: computer._id.toString(),
      lab: lab._id.toString(),
      category: 'SOFTWARE',
      description: 'First complaint: Needs software update',
      user: {
        id: student1._id.toString(),
        email: student1.email,
        role: student1.role,
        name: student1.name,
      },
    });

    // Close the ticket
    ticket1.status = 'CLOSED';
    ticket1.testedOk = true;
    ticket1.resolutionNotes = 'Updated OS and drivers';
    await ticket1.save();

    expect(ticket1.isActive).toBe(false);

    // New complaint can now be created
    const ticket2 = await TicketService.createTicket({
      computer: computer._id.toString(),
      lab: lab._id.toString(),
      category: 'HARDWARE',
      description: 'Subsequent complaint after repair: Cable loose',
      user: {
        id: student2._id.toString(),
        email: student2.email,
        role: student2.role,
        name: student2.name,
      },
    });

    expect(ticket2).toBeDefined();
    expect(ticket2.isActive).toBe(true);
    expect(ticket2._id.toString()).not.toBe(ticket1._id.toString());
  });
});
