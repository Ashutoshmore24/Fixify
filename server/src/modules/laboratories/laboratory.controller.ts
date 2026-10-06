import { Request, Response, NextFunction } from 'express';
import { LaboratoryService } from './laboratory.service';
import { sendSuccess } from '../../common/utils/api-response';

export class LaboratoryController {
  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departmentId = req.query.department as string | undefined;
      const labs = await LaboratoryService.getAll(departmentId);
      sendSuccess(res, labs);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lab = await LaboratoryService.getById(req.params.id as string);
      sendSuccess(res, lab);
    } catch (error) {
      next(error);
    }
  }

  static async getByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lab = await LaboratoryService.getByCode(req.params.code as string);
      sendSuccess(res, lab);
    } catch (error) {
      next(error);
    }
  }
}
