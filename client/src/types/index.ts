export type UserRole =
  | 'STUDENT'
  | 'FACULTY'
  | 'LAB_ASSISTANT'
  | 'DEPT_AUTHORITY'
  | 'HOD'
  | 'ADMIN';

export type ApprovalStatus = 'APPROVED' | 'PENDING_APPROVAL' | 'REJECTED';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  picture?: string;
  avatar?: { url: string; publicId: string } | null;
  banner?: { url: string; publicId: string } | null;
  phone?: string;
  bio?: string;
  role: UserRole;
  department?: string | { _id: string; name: string; code: string } | null;
  assignedLabs?: string[] | { _id: string; name: string; code: string }[];
  firebaseUid?: string;
  firstName?: string;
  lastName?: string;
  course?: string;
  year?: 'FE' | 'SE' | 'TE' | 'BE' | 'ME_1' | 'ME_2' | 'PHD' | string;
  division?: string;
  prn?: string;
  employeeId?: string;
  profileComplete?: boolean;
  approvalStatus?: ApprovalStatus;
}

export interface PublicProfileCard {
  _id: string;
  name: string;
  role: UserRole;
  avatar?: { url: string; publicId: string } | null;
  picture?: string;
  banner?: { url: string; publicId: string } | null;
  department?: { _id: string; name: string; code: string } | null;
  assignedLabs?: Array<{ _id: string; name: string; code: string }>;
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
