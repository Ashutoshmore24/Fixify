import { Setting, ISetting } from './setting.model';
import { env } from '../../common/config/env';
import { AuditService } from '../audit/audit.service';
import { Types } from 'mongoose';

export class SettingsService {
  /**
   * Retrieves a setting value with fallback if not found in database.
   */
  public static async getSetting<T>(key: string, fallback: T): Promise<T> {
    try {
      const doc = await Setting.findOne({ key });
      if (doc && doc.value !== undefined && doc.value !== null) {
        return doc.value as T;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Sets or updates a setting value, creating an audit log entry.
   */
  public static async setSetting(
    key: string,
    value: unknown,
    actorId?: string | Types.ObjectId,
    ip?: string
  ): Promise<ISetting> {
    const previousDoc = await Setting.findOne({ key });
    const beforeValue = previousDoc ? previousDoc.value : null;

    const updated = await Setting.findOneAndUpdate(
      { key },
      {
        $set: {
          value,
          updatedBy: actorId ? new Types.ObjectId(String(actorId)) : null,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Audit log the setting change
    await AuditService.logEvent({
      actor: actorId || null,
      action: 'SETTING_UPDATED',
      entityType: 'Setting',
      entityId: key,
      before: { [key]: beforeValue },
      after: { [key]: value },
      ip,
    });

    return updated;
  }

  /**
   * Retrieves escalation timeout hours setting with env fallback (BR-6 / ASSUMPTIONS.md).
   */
  public static async getEscalationTimeoutHours(): Promise<number> {
    const val = await this.getSetting<number>('escalation_timeout_hours', env.ESCALATION_TIMEOUT_HOURS || 24);
    const num = Number(val);
    return isNaN(num) || num < 1 ? 24 : num;
  }

  /**
   * Retrieves low stock default threshold setting with default fallback of 5.
   */
  public static async getLowStockThreshold(): Promise<number> {
    const val = await this.getSetting<number>('low_stock_default_threshold', 5);
    const num = Number(val);
    return isNaN(num) || num < 0 ? 5 : num;
  }

  /**
   * Returns all system settings for admin view.
   */
  public static async getAllSettings(): Promise<{
    escalation_timeout_hours: number;
    low_stock_default_threshold: number;
    allowed_email_domains: string[];
  }> {
    const [escalationHours, lowStockThreshold] = await Promise.all([
      this.getEscalationTimeoutHours(),
      this.getLowStockThreshold(),
    ]);

    return {
      escalation_timeout_hours: escalationHours,
      low_stock_default_threshold: lowStockThreshold,
      allowed_email_domains: env.allowedDomainsList,
    };
  }
}
