import { describe, it, expect } from 'vitest';
import { TicketStateMachine } from '../src/modules/tickets/ticket.state-machine';
import { VALID_STATUS_TRANSITIONS, TicketStatus } from '../src/modules/tickets/ticket.constants';

describe('Ticket State Machine & Lifecycle Transitions', () => {
  it('allows all defined valid transitions', () => {
    for (const [from, allowed] of Object.entries(VALID_STATUS_TRANSITIONS)) {
      for (const to of allowed) {
        expect(() =>
          TicketStateMachine.validateTransition(from as TicketStatus, to as TicketStatus)
        ).not.toThrow();
      }
    }
  });

  it('allows auto-escalation or escalation from OPEN, ASSIGNED, ACCEPTED, and IN_PROGRESS', () => {
    expect(() => TicketStateMachine.validateTransition('OPEN', 'ESCALATED')).not.toThrow();
    expect(() => TicketStateMachine.validateTransition('ASSIGNED', 'ESCALATED')).not.toThrow();
    expect(() => TicketStateMachine.validateTransition('ACCEPTED', 'ESCALATED')).not.toThrow();
    expect(() => TicketStateMachine.validateTransition('IN_PROGRESS', 'ESCALATED')).not.toThrow();
  });

  it('rejects illegal status transitions', () => {
    // Cannot skip directly from OPEN to RESOLVED
    expect(() => TicketStateMachine.validateTransition('OPEN', 'RESOLVED')).toThrow(
      /Invalid status transition/
    );

    // Terminal state CLOSED cannot transition anywhere
    expect(() => TicketStateMachine.validateTransition('CLOSED', 'IN_PROGRESS')).toThrow(
      /Invalid status transition/
    );

    // Terminal state CANCELLED cannot transition anywhere
    expect(() => TicketStateMachine.validateTransition('CANCELLED', 'ASSIGNED')).toThrow(
      /Invalid status transition/
    );
  });

  it('correctly categorizes active vs inactive statuses', () => {
    expect(TicketStateMachine.isActiveStatus('OPEN')).toBe(true);
    expect(TicketStateMachine.isActiveStatus('ASSIGNED')).toBe(true);
    expect(TicketStateMachine.isActiveStatus('ACCEPTED')).toBe(true);
    expect(TicketStateMachine.isActiveStatus('IN_PROGRESS')).toBe(true);
    expect(TicketStateMachine.isActiveStatus('ESCALATED')).toBe(true);
    expect(TicketStateMachine.isActiveStatus('AWAITING_PARTS')).toBe(true);
    expect(TicketStateMachine.isActiveStatus('RESOLVED')).toBe(true);

    // Inactive statuses
    expect(TicketStateMachine.isActiveStatus('CLOSED')).toBe(false);
    expect(TicketStateMachine.isActiveStatus('REJECTED')).toBe(false);
    expect(TicketStateMachine.isActiveStatus('CANCELLED')).toBe(false);
  });
});
