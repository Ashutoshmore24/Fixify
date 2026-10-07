import { Request, Response, NextFunction } from 'express';
import { CloudinaryService } from '../../common/services/cloudinary.service';
import { sendSuccess } from '../../common/utils/api-response';
import { BadRequestError } from '../../common/errors/app-error';

export class UploadController {
  /**
   * Uploads up to 3 images for complaint tickets to Cloudinary
   */
  static async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw new BadRequestError('At least one image file is required');
      }

      const results = await CloudinaryService.uploadMultiple(files, {
        folder: 'fixify/tickets',
        tags: ['fixify', 'complaint-ticket'],
      });

      sendSuccess(
        res,
        {
          images: results,
          urls: results.map((r) => r.secureUrl),
        },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Uploads a single image to Cloudinary
   */
  static async uploadSingle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file as Express.Multer.File;
      if (!file) {
        throw new BadRequestError('An image file is required');
      }

      const result = await CloudinaryService.uploadBuffer(
        file.buffer,
        file.originalname,
        file.mimetype,
        {
          folder: 'fixify/uploads',
          tags: ['fixify', 'single-upload'],
        }
      );

      sendSuccess(res, result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes an image from Cloudinary by its public ID
   */
  static async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publicId = (req.body?.publicId as string) || (req.query?.publicId as string);
      if (!publicId) {
        throw new BadRequestError('publicId is required');
      }

      const success = await CloudinaryService.deleteImage(publicId);
      sendSuccess(res, { deleted: success, publicId });
    } catch (error) {
      next(error);
    }
  }
}
