import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name cannot be empty').max(50).optional(),
  lastName: z.string().trim().min(1, 'Last name cannot be empty').max(50).optional(),
  phone: z
    .string()
    .trim()
    .max(20, 'Phone number must be at most 20 characters')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .trim()
    .max(160, 'Bio cannot exceed 160 characters')
    .optional()
    .or(z.literal('')),
  course: z.string().trim().optional(),
  year: z.enum(['FE', 'SE', 'TE', 'BE', 'ME_1', 'ME_2', 'PHD']).optional(),
  division: z.string().trim().max(5).optional(),
}).passthrough(); // Allow extra keys in payload so server logic can explicitly verify and reject/ignore attempts to modify restricted fields

export const deactivationRequestSchema = z.object({
  reason: z
    .string({ required_error: 'Reason for deactivation is required' })
    .trim()
    .min(5, 'Please provide a reason with at least 5 characters')
    .max(1000, 'Reason cannot exceed 1000 characters'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DeactivationRequestInput = z.infer<typeof deactivationRequestSchema>;
