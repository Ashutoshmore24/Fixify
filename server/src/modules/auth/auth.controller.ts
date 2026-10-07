import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { setAuthCookie, clearAuthCookie } from './auth.middleware';
import { sendSuccess } from '../../common/utils/api-response';
import { User } from './auth.model';
import { NotFoundError, UnauthorizedError } from '../../common/errors/app-error';
import { AuditService } from '../audit/audit.service';

export class AuthController {
  /**
   * Session authentication endpoint: accepts Firebase ID token and issues JWT session cookie.
   */
  public static async sessionLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;
      const { user, token, profileComplete, approvalStatus } =
        await AuthService.loginWithFirebase(idToken);

      setAuthCookie(res, token);

      // Record audit log entry (BR-9)
      await AuditService.logEvent({
        actor: user._id,
        action: 'USER_LOGIN_FIREBASE',
        entityType: 'USER',
        entityId: user._id,
        after: { email: user.email, role: user.role, profileComplete, approvalStatus },
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
          firstName: user.firstName,
          lastName: user.lastName,
          course: user.course,
          year: user.year,
          division: user.division,
          prn: user.prn,
          employeeId: user.employeeId,
          profileComplete: user.profileComplete,
          approvalStatus: user.approvalStatus,
        },
        token,
        profileComplete,
        approvalStatus,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Backwards compatible endpoint for google login.
   */
  public static async googleLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
    return AuthController.sessionLogin(req, res, next);
  }

  /**
   * Completes registration profile after Firebase account creation and email verification.
   */
  public static async registerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required to register profile');
      }

      const { user, token } = await AuthService.registerProfile(req.user.id, req.body);

      setAuthCookie(res, token);

      await AuditService.logEvent({
        actor: user._id,
        action: 'USER_REGISTER_PROFILE',
        entityType: 'USER',
        entityId: user._id,
        after: {
          email: user.email,
          role: user.role,
          profileComplete: user.profileComplete,
          approvalStatus: user.approvalStatus,
          prn: user.prn,
        },
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
          firstName: user.firstName,
          lastName: user.lastName,
          course: user.course,
          year: user.year,
          division: user.division,
          prn: user.prn,
          employeeId: user.employeeId,
          profileComplete: user.profileComplete,
          approvalStatus: user.approvalStatus,
        },
        token,
        profileComplete: user.profileComplete,
        approvalStatus: user.approvalStatus,
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
          firstName: user.firstName,
          lastName: user.lastName,
          course: user.course,
          year: user.year,
          division: user.division,
          prn: user.prn,
          employeeId: user.employeeId,
          profileComplete: user.profileComplete,
          approvalStatus: user.approvalStatus,
        },
        token,
        profileComplete: true,
        approvalStatus: 'APPROVED',
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
