import { Request, Response, NextFunction } from 'express';
import { QrService } from './qr.service';
import { sendSuccess } from '../../common/utils/api-response';
import { env } from '../../common/config/env';

export class QrController {
  public static async generatePlacard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { labCode, labName, building } = req.body;
      const placard = await QrService.createPlacard(
        env.CLIENT_URL,
        labCode,
        labName,
        building
      );
      sendSuccess(res, placard, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async parseUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { url } = req.query;
      const labCode = QrService.extractLabCodeFromUrl(String(url));
      sendSuccess(res, { labCode });
    } catch (error) {
      next(error);
    }
  }
}
