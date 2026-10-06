import { TicketStatus, VALID_STATUS_TRANSITIONS, INACTIVE_STATUSES } from './ticket.constants';
import { BadRequestError } from '../../common/errors/app-error';

export class TicketStateMachine {
  /**
   * Validates if a transition from currentStatus to nextStatus is allowed.
   */
  static validateTransition(currentStatus: TicketStatus, nextStatus: TicketStatus): void {
    if (currentStatus === nextStatus) {
      return;
    }

    const allowed = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(nextStatus)) {
      throw new BadRequestError(
        `Invalid status transition from "${currentStatus}" to "${nextStatus}". Allowed next statuses: [${(allowed || []).join(', ')}]`
      );
    }
  }

  /**
   * Determines if a status represents an active ticket.
   */
  static isActiveStatus(status: TicketStatus): boolean {
    return !INACTIVE_STATUSES.includes(status);
  }
}
