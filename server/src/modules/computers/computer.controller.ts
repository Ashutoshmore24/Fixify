import { Request, Response, NextFunction } from 'express';
import { ComputerService } from './computer.service';
import { sendSuccess } from '../../common/utils/api-response';

export class ComputerController {
  static async getByLab(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const labId = req.query.lab as string;
      if (!labId) {
        sendSuccess(res, []);
        return;
      }
      const computers = await ComputerService.getByLab(labId);
      sendSuccess(res, computers);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const computer = await ComputerService.getById(req.params.id as string);
      sendSuccess(res, computer);
    } catch (error) {
      next(error);
    }
  }
}
