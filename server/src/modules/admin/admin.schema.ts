import { z } from 'zod';

export const userRoleEnum = z.enum([
  'STUDENT',
  'FACULTY',
  'LAB_ASSISTANT',
  'DEPT_AUTHORITY',
  'HOD',
  'ADMIN',
]);

export const computerStatusEnum = z.enum([
  'ACTIVE',
  'UNDER_MAINTENANCE',
  'RETIRED',
  'OPERATIONAL',
  'DECOMMISSIONED',
]);

// 1. User Management Schemas
export const changeUserRoleSchema = z.object({
  role: userRoleEnum,
  reason: z.string().min(3, 'A reason for role change is required').max(500),
  department: z.string().optional().nullable(),
  assignedLabs: z.array(z.string()).optional(),
});

export const adminUpdateUserSchema = z.object({
  department: z.string().optional().nullable(),
  prn: z.string().optional().nullable(),
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  reason: z.string().min(3, 'A reason for updating institutional fields is required').max(500),
});

export const changeUserStatusSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().min(3, 'A reason for status change is required').max(500),
});

export const facultyApprovalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(500).optional(),
});

export const deactivationDecisionSchema = z.object({
  note: z.string().max(500).optional(),
});

// 2. Department Schemas
export const createDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name is required').trim(),
  code: z
    .string()
    .min(2, 'Code is required')
    .max(10)
    .trim()
    .toUpperCase(),
  hod: z.string().optional().nullable(),
  authorities: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).trim().optional(),
  code: z.string().min(2).max(10).trim().toUpperCase().optional(),
  hod: z.string().optional().nullable(),
  authorities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// 3. Laboratory Schemas
export const createLaboratorySchema = z.object({
  name: z.string().min(2, 'Lab name is required').trim(),
  code: z.string().min(2, 'Display code is required').trim().toUpperCase(),
  building: z.string().min(2, 'Building / Room is required').trim(),
  department: z.string().min(1, 'Department is required'),
  assistants: z.array(z.string()).optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateLaboratorySchema = z.object({
  name: z.string().min(2).trim().optional(),
  code: z.string().min(2).trim().toUpperCase().optional(),
  building: z.string().min(2).trim().optional(),
  department: z.string().optional(),
  assistants: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

// 4. Computer Schemas
export const createComputerSchema = z.object({
  assetTag: z.string().min(2, 'Asset Tag is required').trim().toUpperCase(),
  lab: z.string().min(1, 'Laboratory is required'),
  label: z.string().min(1, 'Label / Number is required').trim(),
  processor: z.string().trim().optional().default('Intel Core i5'),
  ram: z.string().trim().optional().default('8 GB DDR4'),
  storage: z.string().trim().optional().default('256 GB SSD'),
  purchaseDate: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
  warrantyExpiry: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
  vendor: z.string().trim().optional().default(''),
  status: computerStatusEnum.optional().default('ACTIVE'),
  notes: z.string().trim().optional().default(''),
});

export const updateComputerSchema = z.object({
  assetTag: z.string().min(2).trim().toUpperCase().optional(),
  lab: z.string().optional(),
  label: z.string().min(1).trim().optional(),
  processor: z.string().trim().optional(),
  ram: z.string().trim().optional(),
  storage: z.string().trim().optional(),
  purchaseDate: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
  warrantyExpiry: z.string().datetime().optional().nullable().or(z.string().optional().nullable()),
  vendor: z.string().trim().optional(),
  status: computerStatusEnum.optional(),
  notes: z.string().trim().optional(),
});

export const bulkStatusComputerSchema = z.object({
  ids: z.array(z.string()).min(1, 'At least one computer ID is required'),
  status: computerStatusEnum,
});

export const csvRowSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required'),
  labCode: z.string().min(1, 'Laboratory code is required'),
  label: z.string().min(1, 'Label / PC Number is required'),
  processor: z.string().optional().default('Intel Core i5'),
  ram: z.string().optional().default('8 GB DDR4'),
  storage: z.string().optional().default('256 GB SSD'),
  purchaseDate: z.string().optional().default(''),
  warrantyExpiry: z.string().optional().default(''),
  vendor: z.string().optional().default(''),
  status: z.string().optional().default('ACTIVE'),
  notes: z.string().optional().default(''),
});

export const bulkCsvImportPreviewSchema = z.object({
  rows: z.array(z.record(z.string())).max(1000, 'Maximum 1000 rows permitted per bulk import'),
});

export const bulkCsvImportConfirmSchema = z.object({
  validRows: z.array(
    z.object({
      assetTag: z.string(),
      labId: z.string(),
      label: z.string(),
      processor: z.string().optional(),
      ram: z.string().optional(),
      storage: z.string().optional(),
      purchaseDate: z.string().optional().nullable(),
      warrantyExpiry: z.string().optional().nullable(),
      vendor: z.string().optional(),
      status: computerStatusEnum.optional().default('ACTIVE'),
      notes: z.string().optional(),
    })
  ).min(1, 'No valid rows to import'),
});

// 5. Settings Schemas
export const updateSettingsSchema = z.object({
  escalation_timeout_hours: z
    .number({ invalid_type_error: 'Escalation timeout must be an integer' })
    .int('Must be a whole number')
    .min(1, 'Minimum timeout is 1 hour')
    .max(168, 'Maximum timeout is 168 hours (7 days)')
    .optional(),
  low_stock_default_threshold: z
    .number({ invalid_type_error: 'Low stock threshold must be an integer' })
    .int('Must be a whole number')
    .min(0, 'Threshold cannot be negative')
    .optional(),
});

// 6. Audit Log Query Schema
export const auditLogQuerySchema = z.object({
  actor: z.string().optional(),
  action: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
