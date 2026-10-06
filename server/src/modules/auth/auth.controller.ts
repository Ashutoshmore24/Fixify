import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { setAuthCookie, clearAuthCookie } from './auth.middleware';
import { sendSuccess } from '../../common/utils/api-response';
import { User } from './auth.model';
import { NotFoundError } from '../../common/errors/app-error';
import { AuditService } from '../audit/audit.service';

export class AuthController {
  public static async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const { user, token } = await AuthService.loginWithGoogle(idToken);

      setAuthCookie(res, token);

      // Record audit log entry (BR-9)
      await AuditService.logEvent({
        actor: user._id,
        action: 'USER_LOGIN_GOOGLE',
        entityType: 'USER',
        entityId: user._id,
        after: { email: user.email, role: user.role },
        ip: req.ip,
      });

      sendSuccess(res, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          role: user.role,
          department: user.department,
          assignedLabs: user.assignedLabs,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async devLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, name, role } = req.body;
      const { user, token } = await AuthService.devLogin(email, name, role);

      setAuthCookie(res, token);

      await AuditService.logEvent({
        actor: user._id,
        action: 'USER_LOGIN_DEV',
        entityType: 'USER',
        entityId: user._id,
        after: { email: user.email, role: user.role },
        ip: req.ip,
      });

      sendSuccess(res, {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          role: user.role,
          department: user.department,
          assignedLabs: user.assignedLabs,
        },
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await AuditService.logEvent({
          actor: req.user.id,
          action: 'USER_LOGOUT',
          entityType: 'USER',
          entityId: req.user.id,
          ip: req.ip,
        });
      }

      clearAuthCookie(res);
      sendSuccess(res, { message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new NotFoundError('User context not found');
      }

      const user = await User.findById(req.user.id).select('-__v');
      if (!user || !user.isActive || user.deletedAt) {
        throw new NotFoundError('User profile not found or inactive');
      }

      sendSuccess(res, { user });
    } catch (error) {
      next(error);
    }
  }
}
