export type UserRole =
  | 'STUDENT'
  | 'FACULTY'
  | 'LAB_ASSISTANT'
  | 'DEPT_AUTHORITY'
  | 'HOD'
  | 'ADMIN';

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

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: UserRole;
  department?: string;
  assignedLabs?: string[];
  isActive: boolean;
}

export interface Laboratory {
  id: string;
  name: string;
  code: string;
  building: string;
  department: string;
  assistants: string[];
  isActive: boolean;
  qrGeneratedAt?: string;
}

export interface Computer {
  id: string;
  assetTag: string;
  lab: string;
  label: string;
  processor: string;
  ram: string;
  storage: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  vendor?: string;
  status: 'ACTIVE' | 'UNDER_MAINTENANCE' | 'RETIRED';
}

export interface Ticket {
  id: string;
  ticketId: string;
  computer: Computer | string;
  lab: Laboratory | string;
  reportedBy: User | string;
  category: string;
  description: string;
  images: string[];
  priority: TicketPriority;
  status: TicketStatus;
  isActive: boolean;
  assignedTo?: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
