import { describe, it, expect, beforeEach } from 'vitest';
import { Department } from '../src/modules/departments/department.model';
import { Laboratory } from '../src/modules/laboratories/laboratory.model';
import { Computer } from '../src/modules/computers/computer.model';
import { User } from '../src/modules/auth/auth.model';
import { TicketService } from '../src/modules/tickets/ticket.service';

describe('BR-2: Each Ticket References Exactly One Computer in the Specified Laboratory', () => {
  let student: any;
  let compDept: any;
  let lab1: any;
  let lab2: any;
  let pcInLab1: any;
  let pcInLab2: any;

  beforeEach(async () => {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
    });

    lab1 = await Laboratory.create({
      name: 'Lab 101',
      code: 'LAB-101',
      building: 'IT Building',
      department: compDept._id,
      assistants: [],
    });

    lab2 = await Laboratory.create({
      name: 'Lab 102',
      code: 'LAB-102',
      building: 'IT Building',
      department: compDept._id,
      assistants: [],
    });

    pcInLab1 = await Computer.create({
      assetTag: 'COMP-L101-PC01',
      lab: lab1._id,
      label: 'PC-01',
    });

    pcInLab2 = await Computer.create({
      assetTag: 'COMP-L102-PC01',
      lab: lab2._id,
      label: 'PC-01',
    });

    student = await User.create({
      name: 'Test Student',
      email: 'student@pccoe.org',
      role: 'STUDENT',
    });
  });

  it('successfully creates ticket when computer belongs to the specified laboratory', async () => {
    const ticket = await TicketService.createTicket({
      computer: pcInLab1._id.toString(),
      lab: lab1._id.toString(),
      category: 'HARDWARE',
      description: 'Monitor is flickering constantly during boot',
      user: {
        id: student._id.toString(),
        email: student.email,
        role: student.role,
        name: student.name,
      },
    });

    expect(ticket).toBeDefined();
    expect(ticket.computer.toString()).toBe(pcInLab1._id.toString());
    expect(ticket.lab.toString()).toBe(lab1._id.toString());
    expect(ticket.department.toString()).toBe(compDept._id.toString());
    expect(ticket.ticketId).toMatch(/^FIX-\d{4}-\d{6}$/);
  });

  it('rejects ticket creation if computer does not belong to the specified laboratory', async () => {
    // Attempting to report pcInLab2 under lab1
    await expect(
      TicketService.createTicket({
        computer: pcInLab2._id.toString(),
        lab: lab1._id.toString(),
        category: 'HARDWARE',
        description: 'Trying to report PC from Lab 102 inside Lab 101',
        user: {
          id: student._id.toString(),
          email: student.email,
          role: student.role,
          name: student.name,
        },
      })
    ).rejects.toThrow(/does not belong to Laboratory/);
  });
});
