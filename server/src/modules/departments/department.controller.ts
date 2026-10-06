import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from './department.service';
import { sendSuccess } from '../../common/utils/api-response';

export class DepartmentController {
  static async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const departments = await DepartmentService.getAll();
      sendSuccess(res, departments);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const department = await DepartmentService.getById(req.params.id as string);
      sendSuccess(res, department);
    } catch (error) {
      next(error);
    }
  }
}
