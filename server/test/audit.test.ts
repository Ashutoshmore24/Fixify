import { describe, it, expect } from 'vitest';
import { Types } from 'mongoose';
import { AuditLog } from '../src/modules/audit/audit.model';
import { AuditService } from '../src/modules/audit/audit.service';

describe('BR-9 Append-Only Audit Logging', () => {
  it('successfully appends an immutable audit event', async () => {
    const actorId = new Types.ObjectId();
    const log = await AuditService.logEvent({
      actor: actorId,
      action: 'TICKET_STATUS_UPDATED',
      entityType: 'TICKET',
      entityId: new Types.ObjectId(),
      before: { status: 'OPEN' },
      after: { status: 'ASSIGNED' },
      ip: '127.0.0.1',
    });

    expect(log._id).toBeDefined();
    expect(log.action).toBe('TICKET_STATUS_UPDATED');
    expect(log.actor?.toString()).toBe(actorId.toString());
    expect(log.at).toBeInstanceOf(Date);
  });

  it('rejects all update operations on AuditLog documents (BR-9 enforcement)', async () => {
    const log = await AuditService.logEvent({
      action: 'SYSTEM_BOOT',
      entityType: 'SYSTEM',
    });

    // 1. updateOne
    await expect(
      AuditLog.updateOne({ _id: log._id }, { action: 'MUTATED' })
    ).rejects.toThrow(/BR-9 Violation/);

    // 2. updateMany
    await expect(
      AuditLog.updateMany({ _id: log._id }, { action: 'MUTATED' })
    ).rejects.toThrow(/BR-9 Violation/);

    // 3. findOneAndUpdate
    await expect(
      AuditLog.findOneAndUpdate({ _id: log._id }, { action: 'MUTATED' })
    ).rejects.toThrow(/BR-9 Violation/);

    // 4. replaceOne
    await expect(
      AuditLog.replaceOne({ _id: log._id }, { action: 'MUTATED', entityType: 'SYSTEM' })
    ).rejects.toThrow(/BR-9 Violation/);

    // 5. findOneAndReplace
    await expect(
      AuditLog.findOneAndReplace({ _id: log._id }, { action: 'MUTATED', entityType: 'SYSTEM' })
    ).rejects.toThrow(/BR-9 Violation/);

    // 6. doc.save() on existing doc
    const fetched = await AuditLog.findById(log._id);
    expect(fetched).toBeDefined();
    if (fetched) {
      fetched.action = 'MUTATED_VIA_SAVE';
      await expect(fetched.save()).rejects.toThrow(/BR-9 Violation/);
    }
  });

  it('rejects all delete operations on AuditLog documents (BR-9 enforcement)', async () => {
    const log = await AuditService.logEvent({
      action: 'ADMIN_DELETE_ATTEMPT',
      entityType: 'SYSTEM',
    });

    // 1. deleteOne
    await expect(AuditLog.deleteOne({ _id: log._id })).rejects.toThrow(/BR-9 Violation/);

    // 2. deleteMany
    await expect(AuditLog.deleteMany({ _id: log._id })).rejects.toThrow(/BR-9 Violation/);

    // 3. findOneAndDelete
    await expect(AuditLog.findOneAndDelete({ _id: log._id })).rejects.toThrow(/BR-9 Violation/);
  });

  it('filters and paginates audit log queries', async () => {
    await AuditService.logEvent({ action: 'ACTION_A', entityType: 'USER' });
    await AuditService.logEvent({ action: 'ACTION_B', entityType: 'TICKET' });
    await AuditService.logEvent({ action: 'ACTION_A', entityType: 'USER' });

    const result = await AuditService.queryLogs({ action: 'ACTION_A' });
    expect(result.items.length).toBe(2);
    expect(result.pagination.total).toBe(2);
  });
});
