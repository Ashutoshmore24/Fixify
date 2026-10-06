export type UserRole =
  | 'STUDENT'
  | 'FACULTY'
  | 'LAB_ASSISTANT'
  | 'DEPT_AUTHORITY'
  | 'HOD'
  | 'ADMIN';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  picture?: string;
  role: UserRole;
  department?: string | { _id: string; name: string; code: string } | null;
  assignedLabs?: string[] | { _id: string; name: string; code: string }[];
}

export interface Laboratory {
  _id: string;
  name: string;
  code: string;
  building: string;
  department: string | { _id: string; name: string; code: string };
  assistants: User[];
  isActive: boolean;
}

export interface Computer {
  _id: string;
  assetTag: string;
  lab: string;
  label: string;
  processor: string;
  ram: string;
  storage: string;
  status: 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'DECOMMISSIONED';
  isActive: boolean;
  activeTicket?: {
    _id: string;
    ticketId: string;
    status: string;
  } | null;
}

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

export interface TicketTimelineEntry {
  status: TicketStatus;
  actor: {
    id: string;
    name: string;
    role: string;
  };
  timestamp: string;
  note?: string;
}

export interface Ticket {
  _id: string;
  ticketId: string;
  computer: Computer;
  lab: Laboratory;
  department: { _id: string; name: string; code: string };
  reportedBy: { _id: string; name: string; email: string };
  assignedTo?: { _id: string; name: string; email: string } | null;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  images: string[];
  status: TicketStatus;
  isActive: boolean;
  timeline: TicketTimelineEntry[];
  resolutionNotes?: string | null;
  testedOk?: boolean | null;
  closedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  user: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  read: boolean;
  ticketId?: string | null;
  createdAt: string;
}
