import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validateRequest } from '../../common/middleware/validate.middleware';
import {
  changeUserRoleSchema,
  adminUpdateUserSchema,
  changeUserStatusSchema,
  facultyApprovalSchema,
  deactivationDecisionSchema,
  createDepartmentSchema,
  updateDepartmentSchema,
  createLaboratorySchema,
  updateLaboratorySchema,
  createComputerSchema,
  updateComputerSchema,
  bulkStatusComputerSchema,
  bulkCsvImportPreviewSchema,
  bulkCsvImportConfirmSchema,
  updateSettingsSchema,
  auditLogQuerySchema,
} from './admin.schema';

const router = Router();

// Strict Security Enforcement: All admin routes require valid authentication and ADMIN role
router.use(authenticate);
router.use(requireRole(['ADMIN']));

// 1. Dashboard Overview
router.get('/dashboard', AdminController.getDashboardStats);

// 2. User Management
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetail);
router.patch(
  '/users/:id/role',
  validateRequest({ body: changeUserRoleSchema }),
  AdminController.changeUserRole
);
router.patch(
  '/users/:id',
  validateRequest({ body: adminUpdateUserSchema }),
  AdminController.updateUserFields
);
router.patch(
  '/users/:id/status',
  validateRequest({ body: changeUserStatusSchema }),
  AdminController.changeUserStatus
);
router.delete('/users/:id', AdminController.deleteUser);
router.patch(
  '/users/:id/faculty-approval',
  validateRequest({ body: facultyApprovalSchema }),
  AdminController.decideFacultyApproval
);

// Deactivation Requests
router.get('/deactivations', AdminController.getDeactivationRequests);
router.post(
  '/deactivations/:id/approve',
  validateRequest({ body: deactivationDecisionSchema }),
  AdminController.approveDeactivation
);
router.post(
  '/deactivations/:id/reject',
  validateRequest({ body: deactivationDecisionSchema }),
  AdminController.rejectDeactivation
);

// 3. Departments
router.get('/departments', AdminController.getDepartments);
router.post(
  '/departments',
  validateRequest({ body: createDepartmentSchema }),
  AdminController.createDepartment
);
router.put(
  '/departments/:id',
  validateRequest({ body: updateDepartmentSchema }),
  AdminController.updateDepartment
);
router.delete('/departments/:id', AdminController.deleteDepartment);

// 4. Laboratories
router.get('/labs', AdminController.getLaboratories);
router.post(
  '/labs',
  validateRequest({ body: createLaboratorySchema }),
  AdminController.createLaboratory
);
router.put(
  '/labs/:id',
  validateRequest({ body: updateLaboratorySchema }),
  AdminController.updateLaboratory
);
router.post('/labs/:id/regenerate-qr', AdminController.regenerateLabCode);
router.delete('/labs/:id', AdminController.deleteLaboratory);
router.get('/labs/:id/qr', AdminController.getLabQrData);
router.get('/labs/:id/placard-pdf', AdminController.downloadLabPlacardPdf);
router.get('/labs/placards/all-pdf', AdminController.downloadAllLabsPlacardsPdf);

// 5. Computers & Assets
router.get('/computers', AdminController.getComputers);
router.get('/computers/import/template', AdminController.getImportTemplate);
router.post(
  '/computers/import/preview',
  validateRequest({ body: bulkCsvImportPreviewSchema }),
  AdminController.previewCsvImport
);
router.post(
  '/computers/import/confirm',
  validateRequest({ body: bulkCsvImportConfirmSchema }),
  AdminController.confirmCsvImport
);
router.patch(
  '/computers/bulk-status',
  validateRequest({ body: bulkStatusComputerSchema }),
  AdminController.bulkStatusChange
);
router.get('/computers/:id', AdminController.getComputerDetail);
router.post(
  '/computers',
  validateRequest({ body: createComputerSchema }),
  AdminController.createComputer
);
router.put(
  '/computers/:id',
  validateRequest({ body: updateComputerSchema }),
  AdminController.updateComputer
);
router.delete('/computers/:id', AdminController.deleteComputer);

// 6. Settings
router.get('/settings', AdminController.getSettings);
router.patch(
  '/settings',
  validateRequest({ body: updateSettingsSchema }),
  AdminController.updateSettings
);

// 7. Audit Log Viewer (Read-only)
router.get(
  '/audit',
  validateRequest({ query: auditLogQuerySchema }),
  AdminController.getAuditLogs
);

export const adminRoutes = router;
