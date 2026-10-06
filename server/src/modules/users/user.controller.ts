import { Request, Response, NextFunction } from 'express';
import { User } from '../auth/auth.model';
import { NotFoundError } from '../../common/errors/app-error';
import { sendSuccess } from '../../common/utils/api-response';
import { AuditService } from '../audit/audit.service';

export class UserController {
  static async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role, department, assignedLabs } = req.body;

      const user = await User.findById(id);
      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      const previousRole = user.role;
      user.role = role;
      if (department !== undefined) {
        user.department = department || null;
      }
      if (assignedLabs !== undefined) {
        user.assignedLabs = assignedLabs;
      }

      await user.save();

      // Write Audit Log
      await AuditService.logEvent({
        actor: req.user!.id,
        action: 'USER_ROLE_UPDATED',
        entityType: 'User',
        entityId: user._id.toString(),
        before: { role: previousRole },
        after: {
          role,
          department,
          assignedLabs,
        },
        ip: req.ip,
      });

      sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const department = req.query.department as string | undefined;
      const filter: Record<string, unknown> = { isActive: true };

      if (role) filter.role = role;
      if (department) filter.department = department;

      const users = await User.find(filter)
        .select('-__v')
        .populate('department', 'name code')
        .populate('assignedLabs', 'name code')
        .sort({ name: 1 });

      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  }
}
