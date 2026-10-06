import { z } from 'zod';

export const createTicketSchema = z.object({
  computer: z.string().min(1, 'Computer ID is required'),
  lab: z.string().min(1, 'Laboratory ID is required'),
  category: z.enum(['HARDWARE', 'SOFTWARE', 'NETWORK', 'ELECTRICAL', 'OTHER']),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  images: z.array(z.string()).max(3, 'Maximum 3 images allowed').optional(),
});

export const transitionStatusSchema = z.object({
  status: z.enum([
    'OPEN',
    'ASSIGNED',
    'ACCEPTED',
    'IN_PROGRESS',
    'ESCALATED',
    'AWAITING_PARTS',
    'RESOLVED',
    'CLOSED',
    'REJECTED',
    'CANCELLED',
  ]),
  note: z.string().optional(),
  resolutionNotes: z.string().optional(),
  testedOk: z.boolean().optional(),
});

export const addNoteSchema = z.object({
  note: z.string().min(1, 'Note cannot be empty'),
});
