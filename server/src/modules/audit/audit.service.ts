import { Types } from 'mongoose';
import { AuditLog, IAuditLog } from './audit.model';
import { logger } from '../../common/utils/logger';
import '../auth/auth.model';

export interface CreateAuditLogParams {
  actor?: Types.ObjectId | string | null;
  action: string;
  entityType: string;
  entityId?: Types.ObjectId | string | null;
  before?: unknown;
  after?: unknown;
  ip?: string;
}

export interface AuditQueryFilters {
  actor?: string;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class AuditService {
  /**
   * Appends an immutable audit event (BR-9).
   */
  public static async logEvent(params: CreateAuditLogParams): Promise<IAuditLog> {
    try {
      const record = new AuditLog({
        actor: params.actor ? new Types.ObjectId(String(params.actor)) : null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        before: params.before || null,
        after: params.after || null,
        ip: params.ip || null,
        at: new Date(),
      });

      return await record.save();
    } catch (error) {
      // Audit logging must be resilient and not crash main operation if fails
      logger.error(error, `Failed to record audit log for action: ${params.action}`);
      throw error;
    }
  }

  /**
   * Read-only query for AuditLogs with pagination and filtering (Admin only).
   */
  public static async queryLogs(filters: AuditQueryFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (filters.actor) {
      query.actor = new Types.ObjectId(filters.actor);
    }
    if (filters.action) {
      query.action = filters.action;
    }
    if (filters.entityType) {
      query.entityType = filters.entityType;
    }
    if (filters.startDate || filters.endDate) {
      query.at = {};
      if (filters.startDate) {
        (query.at as Record<string, unknown>).$gte = filters.startDate;
      }
      if (filters.endDate) {
        (query.at as Record<string, unknown>).$lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      items: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
