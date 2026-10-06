export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'ESCALATED'
  | 'AWAITING_PARTS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED';

export type TicketCategory = 'HARDWARE' | 'SOFTWARE' | 'NETWORK' | 'ELECTRICAL' | 'OTHER';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export const INACTIVE_STATUSES: TicketStatus[] = ['CLOSED', 'REJECTED', 'CANCELLED'];

export const SAFETY_KEYWORDS = [
  'spark',
  'smoke',
  'fire',
  'burning',
  'shock',
  'smell',
  'explosion',
  'heat',
  'blast',
  'short circuit',
];

export const VALID_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['ASSIGNED', 'ESCALATED', 'CANCELLED', 'REJECTED'],
  ASSIGNED: ['ACCEPTED', 'ESCALATED', 'CANCELLED', 'REJECTED'],
  ACCEPTED: ['IN_PROGRESS', 'ESCALATED', 'CANCELLED'],
  IN_PROGRESS: ['ESCALATED', 'RESOLVED', 'CLOSED', 'CANCELLED'],
  ESCALATED: ['IN_PROGRESS', 'AWAITING_PARTS', 'CLOSED', 'RESOLVED'],
  AWAITING_PARTS: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
};
