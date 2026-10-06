import { describe, it, expect, beforeEach } from 'vitest';
import { Department } from '../src/modules/departments/department.model';
import { Laboratory } from '../src/modules/laboratories/laboratory.model';
import { Computer } from '../src/modules/computers/computer.model';
import { User } from '../src/modules/auth/auth.model';
import { TicketService } from '../src/modules/tickets/ticket.service';

describe('BR-8: Ticket Closure Verification (testedOk === true & non-empty resolutionNotes)', () => {
  let assistant: any;
  let compDept: any;
  let lab: any;
  let computer: any;
  let student: any;
  let ticket: any;

  beforeEach(async () => {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
    });

    assistant = await User.create({
      name: 'Assistant Ramesh',
      email: 'ramesh@pccoe.org',
      role: 'LAB_ASSISTANT',
      assignedLabs: [],
      isActive: true,
    });

    lab = await Laboratory.create({
      name: 'Hardware Lab',
      code: 'LAB-HW',
      building: 'IT Building',
      department: compDept._id,
      assistants: [assistant._id],
      isActive: true,
    });

    assistant.assignedLabs = [lab._id];
    await assistant.save();

    computer = await Computer.create({
      assetTag: 'PC-HW-01',
      lab: lab._id,
      label: 'PC-01',
    });

    student = await User.create({
      name: 'Student User',
      email: 'student@pccoe.org',
      role: 'STUDENT',
    });

    // Create ticket in ASSIGNED status
    ticket = await TicketService.createTicket({
      computer: computer._id.toString(),
      lab: lab._id.toString(),
      category: 'HARDWARE',
      description: 'Power supply fan failing',
      user: {
        id: student._id.toString(),
        email: student.email,
        role: student.role,
        name: student.name,
      },
    });

    // Move to ACCEPTED then IN_PROGRESS
    await TicketService.transitionStatus({
      ticketId: ticket._id.toString(),
      nextStatus: 'ACCEPTED',
      user: {
        id: assistant._id.toString(),
        email: assistant.email,
        role: assistant.role,
        name: assistant.name,
      },
    });

    await TicketService.transitionStatus({
      ticketId: ticket._id.toString(),
      nextStatus: 'IN_PROGRESS',
      user: {
        id: assistant._id.toString(),
        email: assistant.email,
        role: assistant.role,
        name: assistant.name,
      },
    });

    await TicketService.transitionStatus({
      ticketId: ticket._id.toString(),
      nextStatus: 'RESOLVED',
      user: {
        id: assistant._id.toString(),
        email: assistant.email,
        role: assistant.role,
        name: assistant.name,
      },
    });
  });

  it('rejects closing ticket when testedOk is missing or false', async () => {
    await expect(
      TicketService.transitionStatus({
        ticketId: ticket._id.toString(),
        nextStatus: 'CLOSED',
        testedOk: false,
        resolutionNotes: 'Fan replaced successfully',
        user: {
          id: assistant._id.toString(),
          email: assistant.email,
          role: assistant.role,
          name: assistant.name,
        },
      })
    ).rejects.toThrow(/BR-8 Violation.*testedOk/);
  });

  it('rejects closing ticket when resolutionNotes is empty or only whitespace', async () => {
    await expect(
      TicketService.transitionStatus({
        ticketId: ticket._id.toString(),
        nextStatus: 'CLOSED',
        testedOk: true,
        resolutionNotes: '   ',
        user: {
          id: assistant._id.toString(),
          email: assistant.email,
          role: assistant.role,
          name: assistant.name,
        },
      })
    ).rejects.toThrow(/BR-8 Violation.*resolution notes/);
  });

  it('successfully closes ticket when testedOk is true and resolutionNotes is provided', async () => {
    const closedTicket = await TicketService.transitionStatus({
      ticketId: ticket._id.toString(),
      nextStatus: 'CLOSED',
      testedOk: true,
      resolutionNotes: 'Replaced SMPS fan and verified steady voltage and thermal readings under load.',
      user: {
        id: assistant._id.toString(),
        email: assistant.email,
        role: assistant.role,
        name: assistant.name,
      },
    });

    expect(closedTicket.status).toBe('CLOSED');
    expect(closedTicket.isActive).toBe(false);
    expect(closedTicket.testedOk).toBe(true);
    expect(closedTicket.resolutionNotes).toBe(
      'Replaced SMPS fan and verified steady voltage and thermal readings under load.'
    );
    expect(closedTicket.closedAt).toBeInstanceOf(Date);
  });
});
