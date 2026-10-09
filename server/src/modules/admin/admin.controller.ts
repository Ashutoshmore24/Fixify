import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { sendSuccess } from '../../common/utils/api-response';

export class AdminController {
  // 1. Dashboard
  public static async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await AdminService.getDashboardStats();
      sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  // 2. User Management
  public static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, role, status, department, sortBy, sortOrder, page, limit } = req.query;
      const result = await AdminService.getUsers({
        search: search as string,
        role: role as string,
        status: status as string,
        department: department as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async getUserDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getUserDetail(id!);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async changeUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role, reason, department, assignedLabs } = req.body;
      const user = await AdminService.changeUserRole(
        req.user!.id,
        id!,
        role,
        reason,
        department,
        assignedLabs,
        req.ip
      );
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  public static async updateUserFields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await AdminService.updateUserFields(req.user!.id, id!, req.body, req.ip);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  public static async changeUserStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { isActive, reason } = req.body;
      const user = await AdminService.changeUserStatus(req.user!.id, id!, isActive, reason, req.ip);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.deleteUser(req.user!.id, id!, req.ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async decideFacultyApproval(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { action, note } = req.body;
      const user = await AdminService.decideFacultyApproval(req.user!.id, id!, action, note, req.ip);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  }

  public static async getDeactivationRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const requests = await AdminService.getDeactivationRequests(status as string);
      sendSuccess(res, requests);
    } catch (err) {
      next(err);
    }
  }

  public static async approveDeactivation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const result = await AdminService.approveDeactivation(req.user!.id, id!, note, req.ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async rejectDeactivation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const result = await AdminService.rejectDeactivation(req.user!.id, id!, note, req.ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 3. Departments
  public static async getDepartments(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await AdminService.getDepartments();
      sendSuccess(res, departments);
    } catch (err) {
      next(err);
    }
  }

  public static async createDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await AdminService.createDepartment(req.user!.id, req.body, req.ip);
      sendSuccess(res, department, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updateDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const department = await AdminService.updateDepartment(req.user!.id, id!, req.body, req.ip);
      sendSuccess(res, department);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteDepartment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.deleteDepartment(req.user!.id, id!, req.ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 4. Laboratories
  public static async getLaboratories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const labs = await AdminService.getLaboratories();
      sendSuccess(res, labs);
    } catch (err) {
      next(err);
    }
  }

  public static async createLaboratory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lab = await AdminService.createLaboratory(req.user!.id, req.body, req.ip);
      sendSuccess(res, lab, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updateLaboratory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const lab = await AdminService.updateLaboratory(req.user!.id, id!, req.body, req.ip);
      sendSuccess(res, lab);
    } catch (err) {
      next(err);
    }
  }

  public static async regenerateLabCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.regenerateLabCode(req.user!.id, id!, req.ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteLaboratory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.deleteLaboratory(req.user!.id, id!, req.ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async getLabQrData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const qrData = await AdminService.getLabQrData(id!);
      sendSuccess(res, qrData);
    } catch (err) {
      next(err);
    }
  }

  public static async downloadLabPlacardPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { buffer, filename } = await AdminService.getLabPlacardPdf(id!);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) {
      next(err);
    }
  }

  public static async downloadAllLabsPlacardsPdf(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { buffer, filename } = await AdminService.getAllLabsPlacardsPdf();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (err) {
      next(err);
    }
  }

  // 5. Computers & Assets
  public static async getComputers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, lab, status, warrantyExpired, sortBy, sortOrder, page, limit } = req.query;
      const result = await AdminService.getComputers({
        search: search as string,
        lab: lab as string,
        status: status as string,
        warrantyExpired: warrantyExpired === 'true' || warrantyExpired === '1',
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async getComputerDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.getComputerDetail(id!);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async createComputer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const computer = await AdminService.createComputer(req.user!.id, req.body, req.ip);
      sendSuccess(res, computer, 201);
    } catch (err) {
      next(err);
    }
  }

  public static async updateComputer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const computer = await AdminService.updateComputer(req.user!.id, id!, req.body, req.ip);
      sendSuccess(res, computer);
    } catch (err) {
      next(err);
    }
  }

  public static async deleteComputer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await AdminService.deleteComputer(req.user!.id, id!, req.ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async bulkStatusChange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids, status } = req.body;
      const result = await AdminService.bulkStatusChange(req.user!.id, ids, status, req.ip);
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  public static async getImportTemplate(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const csv =
        'assetTag,labCode,label,processor,ram,storage,purchaseDate,warrantyExpiry,vendor,status,notes\n' +
        'COMP-L101-PC01,LAB-101,PC-01,Intel Core i7-12700,16 GB DDR4,512 GB NVMe SSD,2024-01-15,2027-01-15,Dell,ACTIVE,Main lab PC\n' +
        'COMP-L101-PC02,LAB-101,PC-02,Intel Core i7-12700,16 GB DDR4,512 GB NVMe SSD,2024-01-15,2027-01-15,Dell,ACTIVE,Workstation PC\n';

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="computers-import-template.csv"');
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  public static async previewCsvImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rows } = req.body;
      const preview = await AdminService.previewCsvImport(rows);
      sendSuccess(res, preview);
    } catch (err) {
      next(err);
    }
  }

  public static async confirmCsvImport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { validRows } = req.body;
      const result = await AdminService.confirmCsvImport(req.user!.id, validRows, req.ip);
      sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  // 6. Settings
  public static async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await AdminService.getSettings();
      sendSuccess(res, settings);
    } catch (err) {
      next(err);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await AdminService.updateSettings(req.user!.id, req.body, req.ip);
      sendSuccess(res, settings);
    } catch (err) {
      next(err);
    }
  }

  // 7. Audit Log Viewer
  public static async getAuditLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { actor, action, entityType, entityId, startDate, endDate, page, limit } = req.query;
      const result = await AdminService.getAuditLogs({
        actor: actor as string,
        action: action as string,
        entityType: entityType as string,
        entityId: entityId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}
