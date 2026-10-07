import { z } from 'zod';

export const sessionLoginSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
});

export const googleLoginSchema = sessionLoginSchema;

export const registerProfileSchema = z
  .object({
    role: z.enum(['STUDENT', 'FACULTY'], {
      errorMap: () => ({ message: 'Public registration allows only STUDENT or FACULTY' }),
    }),
    firstName: z.string().min(1, 'First name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    course: z.string().optional(),
    year: z.string().optional(),
    division: z.string().optional(),
    prn: z.string().optional(),
    department: z.string().optional(),
    employeeId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'STUDENT') {
      if (!data.course || !data.course.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['course'],
          message: 'Course is required for student registration',
        });
      }
      if (!data.year || !data.year.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['year'],
          message: 'Year of study is required for student registration',
        });
      }
      if (!data.division || !data.division.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['division'],
          message: 'Division is required for student registration',
        });
      }
      if (!data.prn || !data.prn.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['prn'],
          message: 'PRN is required for student registration',
        });
      }
    }
  });

export const devLoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  name: z.string().optional().default('Test User'),
  role: z
    .enum(['STUDENT', 'FACULTY', 'LAB_ASSISTANT', 'DEPT_AUTHORITY', 'HOD', 'ADMIN'])
    .optional(),
});

export type SessionLoginInput = z.infer<typeof sessionLoginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
export type RegisterProfileInput = z.infer<typeof registerProfileSchema>;
export type DevLoginInput = z.infer<typeof devLoginSchema>;
