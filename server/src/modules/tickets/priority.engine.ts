import { TicketCategory, TicketPriority, SAFETY_KEYWORDS } from './ticket.constants';

export class PriorityEngine {
  /**
   * Evaluates category and text content against electrical hazard rules and safety keywords.
   * REQ-1.9: Electrical hazards or safety keywords automatically trigger CRITICAL priority.
   */
  static determinePriority(
    category: TicketCategory,
    description: string,
    requestedPriority?: TicketPriority
  ): { priority: TicketPriority; isSafetyHazard: boolean } {
    const lowerDesc = description.toLowerCase();
    const hasSafetyKeyword = SAFETY_KEYWORDS.some((kw) => lowerDesc.includes(kw));

    if (category === 'ELECTRICAL' || hasSafetyKeyword) {
      return { priority: 'CRITICAL', isSafetyHazard: true };
    }

    if (requestedPriority) {
      return { priority: requestedPriority, isSafetyHazard: false };
    }

    switch (category) {
      case 'HARDWARE':
      case 'NETWORK':
        return { priority: 'HIGH', isSafetyHazard: false };
      case 'SOFTWARE':
        return { priority: 'MEDIUM', isSafetyHazard: false };
      case 'OTHER':
      default:
        return { priority: 'LOW', isSafetyHazard: false };
    }
  }
}
