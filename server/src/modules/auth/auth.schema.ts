import { z } from 'zod';

export const googleLoginSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export const devLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().optional().default('Test User'),
  role: z
    .enum(['STUDENT', 'FACULTY', 'LAB_ASSISTANT', 'DEPT_AUTHORITY', 'HOD', 'ADMIN'])
    .optional(),
});

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type DevLoginInput = z.infer<typeof devLoginSchema>;
