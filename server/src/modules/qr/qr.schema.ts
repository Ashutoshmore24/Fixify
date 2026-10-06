import { z } from 'zod';

export const generateQrSchema = z.object({
  labCode: z.string().min(1, 'Laboratory code is required').trim(),
  labName: z.string().optional(),
  building: z.string().optional(),
});

export const parseQrUrlSchema = z.object({
  url: z.string().url('A valid URL must be provided'),
});

export type GenerateQrInput = z.infer<typeof generateQrSchema>;
export type ParseQrUrlInput = z.infer<typeof parseQrUrlSchema>;
