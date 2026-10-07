import { z } from 'zod';

export const updateRoleSchema = z.object({
  role: z.enum(['STUDENT', 'FACULTY', 'LAB_ASSISTANT', 'DEPT_AUTHORITY', 'HOD', 'ADMIN']),
  department: z.string().optional(),
  assignedLabs: z.array(z.string()).optional(),
  approvalStatus: z.enum(['APPROVED', 'PENDING_APPROVAL', 'REJECTED']).optional(),
});
