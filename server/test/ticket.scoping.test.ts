import { describe, it, expect, beforeEach } from 'vitest';
import { Department } from '../src/modules/departments/department.model';
import { Laboratory } from '../src/modules/laboratories/laboratory.model';
import { Computer } from '../src/modules/computers/computer.model';
import { User } from '../src/modules/auth/auth.model';
import { TicketService } from '../src/modules/tickets/ticket.service';

describe('Role Scoping & Authorization: Assistant Lab Scoping & Student Isolation', () => {
  let compDept: any;
  let lab101: any;
  let lab102: any;
  let pc101: any;
  let pc102: any;
  let assistantLab1: any;
  let student1: any;
  let student2: any;
  let ticketInLab1: any;
  let ticketInLab2: any;

  beforeEach(async () => {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
    });

    assistantLab1 = await User.create({
      name: 'Assistant For Lab 1',
      email: 'asst1@pccoe.org',
      role: 'LAB_ASSISTANT',
      assignedLabs: [],
      isActive: true,
    });

    lab101 = await Laboratory.create({
      name: 'Lab 101',
      code: 'LAB-101',
      building: 'IT Building',
      department: compDept._id,
      assistants: [assistantLab1._id],
      isActive: true,
    });

    assistantLab1.assignedLabs = [lab101._id];
    await assistantLab1.save();

    lab102 = await Laboratory.create({
      name: 'Lab 102',
      code: 'LAB-102',
      building: 'IT Building',
      department: compDept._id,
      assistants: [],
      isActive: true,
    });

    pc101 = await Computer.create({
      assetTag: 'PC-101-01',
      lab: lab101._id,
      label: 'PC-01',
    });

    pc102 = await Computer.create({
      assetTag: 'PC-102-01',
      lab: lab102._id,
      label: 'PC-01',
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

    // Student 1 reports in Lab 101
    ticketInLab1 = await TicketService.createTicket({
      computer: pc101._id.toString(),
      lab: lab101._id.toString(),
      category: 'HARDWARE',
      description: 'Lab 101 keyboard failure',
      user: {
        id: student1._id.toString(),
        email: student1.email,
        role: student1.role,
        name: student1.name,
      },
    });

    // Student 2 reports in Lab 102
    ticketInLab2 = await TicketService.createTicket({
      computer: pc102._id.toString(),
      lab: lab102._id.toString(),
      category: 'NETWORK',
      description: 'Lab 102 network cable disconnected',
      user: {
        id: student2._id.toString(),
        email: student2.email,
        role: student2.role,
        name: student2.name,
      },
    });
  });

  describe('Assistant Lab Scoping', () => {
    it('allows assistant to view and update tickets from their assigned lab (Lab 101)', async () => {
      const ticket = await TicketService.getTicketById(ticketInLab1._id.toString(), {
        id: assistantLab1._id.toString(),
        email: assistantLab1.email,
        role: assistantLab1.role,
        name: assistantLab1.name,
      });

      expect(ticket).toBeDefined();
      expect(ticket._id.toString()).toBe(ticketInLab1._id.toString());

      // Assistant accepts the ticket
      const updated = await TicketService.transitionStatus({
        ticketId: ticketInLab1._id.toString(),
        nextStatus: 'ACCEPTED',
        user: {
          id: assistantLab1._id.toString(),
          email: assistantLab1.email,
          role: assistantLab1.role,
          name: assistantLab1.name,
        },
      });

      expect(updated.status).toBe('ACCEPTED');
    });

    it('denies assistant from viewing or updating tickets outside their assigned lab (Lab 102)', async () => {
      // 1. Cannot view detail
      await expect(
        TicketService.getTicketById(ticketInLab2._id.toString(), {
          id: assistantLab1._id.toString(),
          email: assistantLab1.email,
          role: assistantLab1.role,
          name: assistantLab1.name,
        })
      ).rejects.toThrow(/Ticket does not belong to your assigned laboratories/);

      // 2. Cannot transition status
      await expect(
        TicketService.transitionStatus({
          ticketId: ticketInLab2._id.toString(),
          nextStatus: 'ACCEPTED',
          user: {
            id: assistantLab1._id.toString(),
            email: assistantLab1.email,
            role: assistantLab1.role,
            name: assistantLab1.name,
          },
        })
      ).rejects.toThrow(/You are not assigned to Laboratory/);
    });

    it('filters tickets list so assistant only sees tickets belonging to their lab', async () => {
      const tickets = await TicketService.getTickets(
        {
          id: assistantLab1._id.toString(),
          email: assistantLab1.email,
          role: assistantLab1.role,
          name: assistantLab1.name,
        },
        {}
      );

      const ticketIds = tickets.map((t) => t._id.toString());
      expect(ticketIds).toContain(ticketInLab1._id.toString());
      expect(ticketIds).not.toContain(ticketInLab2._id.toString());
    });
  });

  describe('Student Isolation', () => {
    it('restricts student ticket listing strictly to their own reported tickets', async () => {
      const student1Tickets = await TicketService.getTickets(
        {
          id: student1._id.toString(),
          email: student1.email,
          role: student1.role,
          name: student1.name,
        },
        {}
      );

      expect(student1Tickets.length).toBe(1);
      expect(student1Tickets[0]!._id.toString()).toBe(ticketInLab1._id.toString());

      const student2Tickets = await TicketService.getTickets(
        {
          id: student2._id.toString(),
          email: student2.email,
          role: student2.role,
          name: student2.name,
        },
        {}
      );

      expect(student2Tickets.length).toBe(1);
      expect(student2Tickets[0]!._id.toString()).toBe(ticketInLab2._id.toString());
    });

    it('prevents a student from accessing another student ticket by ID', async () => {
      // Student 1 tries to access Student 2's ticket
      await expect(
        TicketService.getTicketById(ticketInLab2._id.toString(), {
          id: student1._id.toString(),
          email: student1.email,
          role: student1.role,
          name: student1.name,
        })
      ).rejects.toThrow(/Access denied: You are not authorized to view this ticket/);
    });
  });
});
