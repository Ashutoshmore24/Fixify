import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { sendSuccess } from '../../common/utils/api-response';

export class ProfileController {
  /**
   * GET /api/v1/profile/me - full own profile
   */
  static async getOwnProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await ProfileService.getOwnProfile(req.user!.id);
      sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/profile/me - editable fields only
   */
  static async updateOwnProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ProfileService.updateOwnProfile(req.user!.id, req.body, req.ip);
      sendSuccess(res, updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/me/avatar - multipart avatar upload
   */
  static async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const avatar = await ProfileService.uploadAvatar(req.user!.id, req.file!, req.ip);
      sendSuccess(res, avatar, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/profile/me/avatar - removes avatar
   */
  static async deleteAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProfileService.deleteAvatar(req.user!.id, req.ip);
      sendSuccess(res, { message: 'Avatar removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/me/banner - multipart banner upload
   */
  static async uploadBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const banner = await ProfileService.uploadBanner(req.user!.id, req.file!, req.ip);
      sendSuccess(res, banner, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/profile/me/banner - removes banner
   */
  static async deleteBanner(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ProfileService.deleteBanner(req.user!.id, req.ip);
      sendSuccess(res, { message: 'Banner removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/profile/me/deactivation-request - creates deactivation request
   */
  static async createDeactivationRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const request = await ProfileService.createDeactivationRequest(
        req.user!.id,
        req.body.reason,
        req.ip
      );
      sendSuccess(res, request, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/profile/:id/public - limited card only
   */
  static async getPublicProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const card = await ProfileService.getPublicProfile(req.params.id as string);
      sendSuccess(res, card);
    } catch (error) {
      next(error);
    }
  }
}
