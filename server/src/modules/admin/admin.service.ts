import { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { User, UserRole } from '../auth/auth.model';
import { Department } from '../departments/department.model';
import { Laboratory } from '../laboratories/laboratory.model';
import { Computer, ComputerStatus } from '../computers/computer.model';
import { Ticket } from '../tickets/ticket.model';
import { DeactivationRequest } from '../profile/deactivation-request.model';
import { AuditService, AuditQueryFilters } from '../audit/audit.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationService } from '../notifications/notification.service';
import { revokeFirebaseUserSessions } from '../auth/firebase-admin';
import { QrService } from '../qr/qr.service';
import { generatePlacardsPdf, PlacardLabInfo } from '../qr/pdf.generator';
import { env } from '../../common/config/env';
import {
  BadRequestError,
  NotFoundError,
  ConflictError,
} from '../../common/errors/app-error';

export class AdminService {
  // =========================================================================
  // 1. DASHBOARD OVERVIEW METRICS
  // =========================================================================
  public static async getDashboardStats() {
    const [
      usersByRoleRaw,
      totalLabs,
      computersByStatusRaw,
      openTicketsCount,
      pendingFacultyCount,
      pendingDeactivationsCount,
      labsList,
      computersList,
    ] = await Promise.all([
      User.aggregate([
        { $match: { deletedAt: null, isActive: true } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Laboratory.countDocuments({ deletedAt: null }),
      Computer.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Ticket.countDocuments({
        isActive: true,
        status: { $in: ['OPEN', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ESCALATED', 'AWAITING_PARTS'] },
      }),
      User.countDocuments({
        role: 'FACULTY',
        approvalStatus: 'PENDING_APPROVAL',
        deletedAt: null,
      }),
      DeactivationRequest.countDocuments({ status: 'PENDING' }),
      Laboratory.find({ deletedAt: null }).populate('department', 'name code').lean(),
      Computer.find({ deletedAt: null })
        .populate('lab', 'name code')
        .select('assetTag label lab warrantyExpiry status')
        .lean(),
    ]);

    // Format users by role
    const usersByRole: Record<string, number> = {
      STUDENT: 0,
      FACULTY: 0,
      LAB_ASSISTANT: 0,
      DEPT_AUTHORITY: 0,
      HOD: 0,
      ADMIN: 0,
    };
    for (const r of usersByRoleRaw) {
      if (r._id && usersByRole[r._id] !== undefined) {
        usersByRole[r._id] = r.count;
      }
    }

    // Format computers by status (map OPERATIONAL -> ACTIVE, DECOMMISSIONED -> RETIRED)
    const computersByStatus: Record<string, number> = {
      ACTIVE: 0,
      UNDER_MAINTENANCE: 0,
      RETIRED: 0,
    };
    for (const c of computersByStatusRaw) {
      if (c._id === 'OPERATIONAL' || c._id === 'ACTIVE') {
        computersByStatus.ACTIVE += c.count;
      } else if (c._id === 'UNDER_MAINTENANCE') {
        computersByStatus.UNDER_MAINTENANCE += c.count;
      } else if (c._id === 'DECOMMISSIONED' || c._id === 'RETIRED') {
        computersByStatus.RETIRED += c.count;
      }
    }

    // Warning Lists
    // 1. Labs without assistant
    const labsWithoutAssistant = labsList
      .filter((lab) => !lab.assistants || lab.assistants.length === 0)
      .map((lab) => ({
        _id: lab._id,
        name: lab.name,
        code: lab.code,
        building: lab.building,
        department: lab.department,
      }));

    // 2. Computers with expired warranty
    const now = new Date();
    const computersWithExpiredWarranty = computersList
      .filter((pc) => pc.warrantyExpiry && new Date(pc.warrantyExpiry) < now)
      .map((pc) => ({
        _id: pc._id,
        assetTag: pc.assetTag,
        label: pc.label,
        lab: pc.lab,
        warrantyExpiry: pc.warrantyExpiry,
        status: pc.status,
      }));

    // 3. Labs with no computers
    const labComputerCounts = new Map<string, number>();
    for (const pc of computersList) {
      if (pc.lab) {
        const labId = typeof pc.lab === 'object' ? (pc.lab as { _id: Types.ObjectId })._id.toString() : String(pc.lab);
        labComputerCounts.set(labId, (labComputerCounts.get(labId) || 0) + 1);
      }
    }
    const labsWithNoComputers = labsList
      .filter((lab) => (labComputerCounts.get(lab._id.toString()) || 0) === 0)
      .map((lab) => ({
        _id: lab._id,
        name: lab.name,
        code: lab.code,
        building: lab.building,
        department: lab.department,
      }));

    return {
      usersByRole,
      totalLabs,
      computersByStatus,
      openTicketsCount,
      pendingFacultyCount,
      pendingDeactivationsCount,
      warnings: {
        labsWithoutAssistant,
        computersWithExpiredWarranty,
        labsWithNoComputers,
      },
    };
  }

  // =========================================================================
  // 2. USER MANAGEMENT
  // =========================================================================
  public static async getUsers(filters: {
    search?: string;
    role?: string;
    status?: string;
    department?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { deletedAt: null };

    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.status) {
      if (filters.status === 'ACTIVE') query.isActive = true;
      if (filters.status === 'DEACTIVATED') query.isActive = false;
    }

    if (filters.department) {
      query.department = new Types.ObjectId(filters.department);
    }

    if (filters.search) {
      const term = filters.search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [{ name: regex }, { email: regex }, { prn: regex }, { employeeId: regex }];
    }

    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('department', 'name code')
        .populate('assignedLabs', 'name code building')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getUserDetail(userId: string) {
    const user = await User.findById(userId)
      .populate('department', 'name code')
      .populate('assignedLabs', 'name code building')
      .lean();

    if (!user) {
      throw new NotFoundError(`User not found`);
    }

    // Recent tickets count and tickets
    const [ticketsCount, recentTickets] = await Promise.all([
      Ticket.countDocuments({
        $or: [{ reportedBy: user._id }, { assignedTo: user._id }],
      }),
      Ticket.find({
        $or: [{ reportedBy: user._id }, { assignedTo: user._id }],
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('computer', 'assetTag label')
        .populate('lab', 'name code')
        .lean(),
    ]);

    return {
      user,
      ticketsCount,
      recentTickets,
    };
  }

  public static async changeUserRole(
    actorId: string,
    targetUserId: string,
    newRole: UserRole,
    reason: string,
    departmentId?: string | null,
    assignedLabs?: string[],
    ip?: string
  ) {
    // Guard 1: Admin cannot demote themselves
    if (actorId === targetUserId && newRole !== 'ADMIN') {
      throw new BadRequestError('Administrators cannot demote themselves');
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser || targetUser.deletedAt) {
      throw new NotFoundError('User not found');
    }

    // Guard 2: Last remaining ADMIN cannot be demoted
    if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        isActive: true,
        deletedAt: null,
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestError('Cannot demote the last remaining Administrator');
      }
    }

    const previousRole = targetUser.role;
    targetUser.role = newRole;

    if (departmentId !== undefined) {
      targetUser.department = departmentId ? new Types.ObjectId(departmentId) : null;
    }
    if (assignedLabs !== undefined) {
      targetUser.assignedLabs = assignedLabs.map((id) => new Types.ObjectId(id));
    }

    // Revoke active sessions
    targetUser.tokenVersion = (targetUser.tokenVersion || 0) + 1;
    await targetUser.save();

    if (targetUser.firebaseUid) {
      await revokeFirebaseUserSessions(targetUser.firebaseUid);
    }

    // Write Audit Log
    await AuditService.logEvent({
      actor: actorId,
      action: 'ADMIN_USER_ROLE_CHANGED',
      entityType: 'User',
      entityId: targetUser._id.toString(),
      before: { role: previousRole },
      after: {
        role: newRole,
        reason,
        department: targetUser.department,
        assignedLabs: targetUser.assignedLabs,
      },
      ip,
    });

    return targetUser;
  }

  public static async updateUserFields(
    actorId: string,
    targetUserId: string,
    data: {
      department?: string | null;
      prn?: string | null;
      name?: string;
      phone?: string;
      reason: string;
    },
    ip?: string
  ) {
    const user = await User.findById(targetUserId);
    if (!user || user.deletedAt) {
      throw new NotFoundError('User not found');
    }

    const before = {
      department: user.department,
      prn: user.prn,
      name: user.name,
      phone: user.phone,
    };

    if (data.department !== undefined) {
      user.department = data.department ? new Types.ObjectId(data.department) : null;
    }
    if (data.prn !== undefined) {
      user.prn = data.prn ? data.prn.trim().toUpperCase() : undefined;
    }
    if (data.name !== undefined) {
      user.name = data.name.trim();
    }
    if (data.phone !== undefined) {
      user.phone = data.phone.trim();
    }

    await user.save();

    // Write Audit Log
    await AuditService.logEvent({
      actor: actorId,
      action: 'ADMIN_USER_UPDATED',
      entityType: 'User',
      entityId: user._id.toString(),
      before,
      after: { ...data },
      ip,
    });

    return user;
  }

  public static async changeUserStatus(
    actorId: string,
    targetUserId: string,
    isActive: boolean,
    reason: string,
    ip?: string
  ) {
    // Guard 1: Admin cannot deactivate themselves
    if (actorId === targetUserId && !isActive) {
      throw new BadRequestError('Administrators cannot deactivate themselves');
    }

    const user = await User.findById(targetUserId);
    if (!user || user.deletedAt) {
      throw new NotFoundError('User not found');
    }

    // Guard 2: Last admin cannot be deactivated
    if (user.role === 'ADMIN' && !isActive) {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        isActive: true,
        deletedAt: null,
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestError('Cannot deactivate the last remaining Administrator');
      }
    }

    const previousStatus = user.isActive;
    user.isActive = isActive;

    if (!isActive) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      if (user.firebaseUid) {
        await revokeFirebaseUserSessions(user.firebaseUid);
      }
    }

    await user.save();

    await AuditService.logEvent({
      actor: actorId,
      action: 'ADMIN_USER_STATUS_CHANGED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: { isActive: previousStatus },
      after: { isActive, reason },
      ip,
    });

    return user;
  }

  public static async deleteUser(actorId: string, targetUserId: string, ip?: string) {
    // Guard 1: Admin cannot delete themselves
    if (actorId === targetUserId) {
      throw new BadRequestError('Administrators cannot delete themselves');
    }

    const user = await User.findById(targetUserId);
    if (!user || user.deletedAt) {
      throw new NotFoundError('User not found');
    }

    // Guard 2: Last admin cannot be deleted
    if (user.role === 'ADMIN') {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        isActive: true,
        deletedAt: null,
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestError('Cannot delete the last remaining Administrator');
      }
    }

    user.deletedAt = new Date();
    user.isActive = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    if (user.firebaseUid) {
      await revokeFirebaseUserSessions(user.firebaseUid);
    }

    await AuditService.logEvent({
      actor: actorId,
      action: 'ADMIN_USER_DELETED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: { isActive: true, deletedAt: null },
      after: { isActive: false, deletedAt: user.deletedAt },
      ip,
    });

    return { message: 'User soft-deleted successfully' };
  }

  public static async decideFacultyApproval(
    actorId: string,
    targetUserId: string,
    action: 'APPROVE' | 'REJECT',
    note?: string,
    ip?: string
  ) {
    const user = await User.findById(targetUserId);
    if (!user || user.deletedAt) {
      throw new NotFoundError('User not found');
    }

    const prevStatus = user.approvalStatus;
    user.approvalStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    await user.save();

    // Send in-app notification to the faculty user
    await NotificationService.create({
      userId: user._id,
      title: action === 'APPROVE' ? 'Account Approved' : 'Account Registration Update',
      message:
        action === 'APPROVE'
          ? 'Your faculty account has been approved by the Administrator. You now have full institutional access.'
          : `Your faculty registration request was reviewed: ${note || 'Please contact the IT administrator.'}`,
      type: action === 'APPROVE' ? 'SUCCESS' : 'WARNING',
    });

    await AuditService.logEvent({
      actor: actorId,
      action: 'FACULTY_APPROVAL_DECIDED',
      entityType: 'User',
      entityId: user._id.toString(),
      before: { approvalStatus: prevStatus },
      after: { approvalStatus: user.approvalStatus, note },
      ip,
    });

    return user;
  }

  // Deactivation requests
  public static async getDeactivationRequests(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    return DeactivationRequest.find(filter)
      .populate('user', 'name email role department avatar picture')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  public static async approveDeactivation(
    actorId: string,
    requestId: string,
    note?: string,
    ip?: string
  ) {
    const request = await DeactivationRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Deactivation request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestError(`Request is already ${request.status}`);
    }

    const user = await User.findById(request.user);
    if (!user) {
      throw new NotFoundError('User associated with request not found');
    }

    // Guard: Admin cannot approve deactivation of last admin
    if (user.role === 'ADMIN') {
      const activeAdminCount = await User.countDocuments({
        role: 'ADMIN',
        isActive: true,
        deletedAt: null,
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestError('Cannot deactivate the last remaining Administrator');
      }
    }

    // 1. Soft delete user and revoke session
    user.isActive = false;
    user.deletedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    if (user.firebaseUid) {
      await revokeFirebaseUserSessions(user.firebaseUid);
    }

    // 2. Update request
    request.status = 'APPROVED';
    request.reviewedBy = new Types.ObjectId(actorId);
    request.reviewedAt = new Date();
    request.adminNote = note || 'Deactivation request approved by administrator.';
    await request.save();

    // 3. Send notification
    await NotificationService.create({
      userId: user._id,
      title: 'Account Deactivated',
      message: 'Your request for account deactivation has been approved by the Administrator.',
      type: 'INFO',
    });

    // 4. Audit
    await AuditService.logEvent({
      actor: actorId,
      action: 'DEACTIVATION_APPROVED',
      entityType: 'DeactivationRequest',
      entityId: request._id.toString(),
      after: { userId: user._id.toString(), note },
      ip,
    });

    return { request, user };
  }

  public static async rejectDeactivation(
    actorId: string,
    requestId: string,
    note: string,
    ip?: string
  ) {
    const request = await DeactivationRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Deactivation request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestError(`Request is already ${request.status}`);
    }

    request.status = 'REJECTED';
    request.reviewedBy = new Types.ObjectId(actorId);
    request.reviewedAt = new Date();
    request.adminNote = note;
    await request.save();

    // Notify user
    await NotificationService.create({
      userId: request.user,
      title: 'Deactivation Request Declined',
      message: `Your account deactivation request was declined: ${note}`,
      type: 'WARNING',
    });

    await AuditService.logEvent({
      actor: actorId,
      action: 'DEACTIVATION_REJECTED',
      entityType: 'DeactivationRequest',
      entityId: request._id.toString(),
      after: { userId: request.user.toString(), note },
      ip,
    });

    return request;
  }

  // =========================================================================
  // 3. DEPARTMENTS
  // =========================================================================
  public static async getDepartments() {
    const departments = await Department.find({ deletedAt: null })
      .populate('hod', 'name email avatar picture role')
      .populate('authorities', 'name email avatar picture role')
      .sort({ name: 1 })
      .lean();

    // Compute counts of labs and users per department
    const [labsCountsRaw, usersCountsRaw] = await Promise.all([
      Laboratory.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { deletedAt: null, isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
    ]);

    const labCountMap = new Map(labsCountsRaw.map((r) => [String(r._id), r.count]));
    const userCountMap = new Map(usersCountsRaw.map((r) => [String(r._id), r.count]));

    return departments.map((d) => ({
      ...d,
      labsCount: labCountMap.get(String(d._id)) || 0,
      usersCount: userCountMap.get(String(d._id)) || 0,
    }));
  }

  public static async createDepartment(
    actorId: string,
    data: {
      name: string;
      code: string;
      hod?: string | null;
      authorities?: string[];
      isActive?: boolean;
    },
    ip?: string
  ) {
    const existing = await Department.findOne({ code: data.code.toUpperCase(), deletedAt: null });
    if (existing) {
      throw new ConflictError(`Department code ${data.code} already exists`);
    }

    const department = await Department.create({
      name: data.name,
      code: data.code.toUpperCase(),
      hod: data.hod ? new Types.ObjectId(data.hod) : null,
      authorities: (data.authorities || []).map((id) => new Types.ObjectId(id)),
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    await AuditService.logEvent({
      actor: actorId,
      action: 'DEPARTMENT_CREATED',
      entityType: 'Department',
      entityId: department._id.toString(),
      after: data,
      ip,
    });

    return department;
  }

  public static async updateDepartment(
    actorId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      hod?: string | null;
      authorities?: string[];
      isActive?: boolean;
    },
    ip?: string
  ) {
    const department = await Department.findById(id);
    if (!department || department.deletedAt) {
      throw new NotFoundError('Department not found');
    }

    if (data.code && data.code.toUpperCase() !== department.code) {
      const existing = await Department.findOne({
        code: data.code.toUpperCase(),
        _id: { $ne: department._id },
        deletedAt: null,
      });
      if (existing) {
        throw new ConflictError(`Department code ${data.code} already exists`);
      }
      department.code = data.code.toUpperCase();
    }

    const before = {
      name: department.name,
      code: department.code,
      hod: department.hod,
      authorities: department.authorities,
      isActive: department.isActive,
    };

    if (data.name) department.name = data.name;
    if (data.hod !== undefined) department.hod = data.hod ? new Types.ObjectId(data.hod) : null;
    if (data.authorities !== undefined) {
      department.authorities = data.authorities.map((a) => new Types.ObjectId(a));
    }
    if (data.isActive !== undefined) department.isActive = data.isActive;

    await department.save();

    await AuditService.logEvent({
      actor: actorId,
      action: 'DEPARTMENT_UPDATED',
      entityType: 'Department',
      entityId: department._id.toString(),
      before,
      after: data,
      ip,
    });

    return department;
  }

  public static async deleteDepartment(actorId: string, id: string, ip?: string) {
    const department = await Department.findById(id);
    if (!department || department.deletedAt) {
      throw new NotFoundError('Department not found');
    }

    // Check for associated labs or users
    const [labsCount, usersCount] = await Promise.all([
      Laboratory.countDocuments({ department: department._id, deletedAt: null }),
      User.countDocuments({ department: department._id, deletedAt: null }),
    ]);

    if (labsCount > 0 || usersCount > 0) {
      throw new BadRequestError(
        `Cannot delete department: ${labsCount} laboratory/laboratories and ${usersCount} user(s) are currently associated with it.`
      );
    }

    department.deletedAt = new Date();
    department.isActive = false;
    await department.save();

    await AuditService.logEvent({
      actor: actorId,
      action: 'DEPARTMENT_DELETED',
      entityType: 'Department',
      entityId: department._id.toString(),
      before: { isActive: true },
      after: { deletedAt: department.deletedAt, isActive: false },
      ip,
    });

    return { message: 'Department soft-deleted successfully' };
  }

  // =========================================================================
  // 4. LABORATORIES
  // =========================================================================
  public static async getLaboratories() {
    const labs = await Laboratory.find({ deletedAt: null })
      .populate('department', 'name code')
      .populate('assistants', 'name email avatar picture role')
      .sort({ name: 1 })
      .lean();

    const [computerCountsRaw, activeTicketsRaw] = await Promise.all([
      Computer.aggregate([
        { $match: { deletedAt: null } },
        { $group: { _id: '$lab', count: { $sum: 1 } } },
      ]),
      Ticket.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$lab', count: { $sum: 1 } } },
      ]),
    ]);

    const compCountMap = new Map(computerCountsRaw.map((r) => [String(r._id), r.count]));
    const ticketCountMap = new Map(activeTicketsRaw.map((r) => [String(r._id), r.count]));

    return labs.map((l) => ({
      ...l,
      computersCount: compCountMap.get(String(l._id)) || 0,
      activeTicketsCount: ticketCountMap.get(String(l._id)) || 0,
      reportUrl: QrService.buildLabReportUrl(env.CLIENT_URL, l.labCode || l.code),
    }));
  }

  public static async createLaboratory(
    actorId: string,
    data: {
      name: string;
      code: string;
      building: string;
      department: string;
      assistants?: string[];
      isActive?: boolean;
    },
    ip?: string
  ) {
    const existing = await Laboratory.findOne({ code: data.code.toUpperCase(), deletedAt: null });
    if (existing) {
      throw new ConflictError(`Laboratory code ${data.code} already exists`);
    }

    const randomLabCode = nanoid(10);
    const assistantIds = (data.assistants || []).map((id) => new Types.ObjectId(id));

    const lab = await Laboratory.create({
      name: data.name,
      code: data.code.toUpperCase(),
      labCode: randomLabCode,
      building: data.building,
      department: new Types.ObjectId(data.department),
      assistants: assistantIds,
      isActive: data.isActive !== undefined ? data.isActive : true,
    });

    // Synchronize assistants' assignedLabs
    if (assistantIds.length > 0) {
      await User.updateMany(
        { _id: { $in: assistantIds } },
        { $addToSet: { assignedLabs: lab._id } }
      );
    }

    await AuditService.logEvent({
      actor: actorId,
      action: 'LABORATORY_CREATED',
      entityType: 'Laboratory',
      entityId: lab._id.toString(),
      after: { ...data, labCode: randomLabCode },
      ip,
    });

    return lab;
  }

  public static async updateLaboratory(
    actorId: string,
    id: string,
    data: {
      name?: string;
      code?: string;
      building?: string;
      department?: string;
      assistants?: string[];
      isActive?: boolean;
    },
    ip?: string
  ) {
    const lab = await Laboratory.findById(id);
    if (!lab || lab.deletedAt) {
      throw new NotFoundError('Laboratory not found');
    }

    if (data.code && data.code.toUpperCase() !== lab.code) {
      const existing = await Laboratory.findOne({
        code: data.code.toUpperCase(),
        _id: { $ne: lab._id },
        deletedAt: null,
      });
      if (existing) {
        throw new ConflictError(`Laboratory code ${data.code} already exists`);
      }
      lab.code = data.code.toUpperCase();
    }

    const previousAssistants = lab.assistants.map((a) => a.toString());

    if (data.name) lab.name = data.name;
    if (data.building) lab.building = data.building;
    if (data.department) lab.department = new Types.ObjectId(data.department);
    if (data.isActive !== undefined) lab.isActive = data.isActive;

    if (data.assistants !== undefined) {
      const newAssistantIds = data.assistants.map((a) => new Types.ObjectId(a));
      lab.assistants = newAssistantIds;

      // Unassign assistants no longer linked
      const removedAssistants = previousAssistants.filter(
        (prevId) => !data.assistants!.includes(prevId)
      );
      if (removedAssistants.length > 0) {
        await User.updateMany(
          { _id: { $in: removedAssistants } },
          { $pull: { assignedLabs: lab._id } }
        );
      }

      // Add lab to newly assigned assistants
      if (newAssistantIds.length > 0) {
        await User.updateMany(
          { _id: { $in: newAssistantIds } },
          { $addToSet: { assignedLabs: lab._id } }
        );
      }
    }

    await lab.save();

    await AuditService.logEvent({
      actor: actorId,
      action: 'LABORATORY_UPDATED',
      entityType: 'Laboratory',
      entityId: lab._id.toString(),
      before: { assistants: previousAssistants },
      after: data,
      ip,
    });

    return lab;
  }

  public static async regenerateLabCode(actorId: string, id: string, ip?: string) {
    const lab = await Laboratory.findById(id);
    if (!lab || lab.deletedAt) {
      throw new NotFoundError('Laboratory not found');
    }

    const oldLabCode = lab.labCode;
    const newLabCode = nanoid(10);
    lab.labCode = newLabCode;
    await lab.save();

    await AuditService.logEvent({
      actor: actorId,
      action: 'LAB_QR_REGENERATED',
      entityType: 'Laboratory',
      entityId: lab._id.toString(),
      before: { labCode: oldLabCode },
      after: { labCode: newLabCode },
      ip,
    });

    return {
      lab,
      reportUrl: QrService.buildLabReportUrl(env.CLIENT_URL, newLabCode),
    };
  }

  public static async deleteLaboratory(actorId: string, id: string, ip?: string) {
    const lab = await Laboratory.findById(id);
    if (!lab || lab.deletedAt) {
      throw new NotFoundError('Laboratory not found');
    }

    // Guard: Block if active tickets exist
    const activeTicketsCount = await Ticket.countDocuments({ lab: lab._id, isActive: true });
    if (activeTicketsCount > 0) {
      throw new BadRequestError(
        `Cannot delete laboratory: ${activeTicketsCount} active ticket(s) are currently open for this lab.`
      );
    }

    lab.deletedAt = new Date();
    lab.isActive = false;
    await lab.save();

    // Remove this lab from assistants' assignedLabs
    await User.updateMany(
      { assignedLabs: lab._id },
      { $pull: { assignedLabs: lab._id } }
    );

    await AuditService.logEvent({
      actor: actorId,
      action: 'LABORATORY_DELETED',
      entityType: 'Laboratory',
      entityId: lab._id.toString(),
      before: { isActive: true },
      after: { deletedAt: lab.deletedAt, isActive: false },
      ip,
    });

    return { message: 'Laboratory soft-deleted successfully' };
  }

  public static async getLabQrData(id: string) {
    const lab = await Laboratory.findById(id).populate('department', 'name code');
    if (!lab || lab.deletedAt) {
      throw new NotFoundError('Laboratory not found');
    }

    const labCode = lab.labCode || lab.code;
    const placard = await QrService.createPlacard(
      env.CLIENT_URL,
      labCode,
      lab.name,
      lab.building
    );

    return {
      lab,
      ...placard,
    };
  }

  public static async getLabPlacardPdf(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const lab = await Laboratory.findById(id);
    if (!lab || lab.deletedAt) {
      throw new NotFoundError('Laboratory not found');
    }

    const labCode = lab.labCode || lab.code;
    const reportUrl = QrService.buildLabReportUrl(env.CLIENT_URL, labCode);
    const info: PlacardLabInfo = {
      labName: lab.name,
      code: lab.code,
      labCode,
      building: lab.building,
      reportUrl,
    };

    const buffer = generatePlacardsPdf([info]);
    return {
      buffer,
      filename: `placard-${lab.code}.pdf`,
    };
  }

  public static async getAllLabsPlacardsPdf(): Promise<{ buffer: Buffer; filename: string }> {
    const labs = await Laboratory.find({ deletedAt: null }).sort({ code: 1 });
    if (labs.length === 0) {
      throw new NotFoundError('No active laboratories found');
    }

    const placardInfos: PlacardLabInfo[] = labs.map((l) => {
      const labCode = l.labCode || l.code;
      return {
        labName: l.name,
        code: l.code,
        labCode,
        building: l.building,
        reportUrl: QrService.buildLabReportUrl(env.CLIENT_URL, labCode),
      };
    });

    const buffer = generatePlacardsPdf(placardInfos);
    return {
      buffer,
      filename: 'all-laboratories-placards.pdf',
    };
  }

  // =========================================================================
  // 5. COMPUTERS & ASSETS
  // =========================================================================
  public static async getComputers(filters: {
    search?: string;
    lab?: string;
    status?: string;
    warrantyExpired?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { deletedAt: null };

    if (filters.lab) {
      query.lab = new Types.ObjectId(filters.lab);
    }

    if (filters.status) {
      if (filters.status === 'ACTIVE') {
        query.status = { $in: ['ACTIVE', 'OPERATIONAL'] };
      } else if (filters.status === 'RETIRED') {
        query.status = { $in: ['RETIRED', 'DECOMMISSIONED'] };
      } else {
        query.status = filters.status;
      }
    }

    if (filters.warrantyExpired) {
      query.warrantyExpiry = { $lt: new Date(), $ne: null };
    }

    if (filters.search) {
      const term = filters.search.trim();
      const regex = new RegExp(term, 'i');
      query.$or = [{ assetTag: regex }, { label: regex }, { processor: regex }, { vendor: regex }];
    }

    const sortField = filters.sortBy || 'assetTag';
    const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;

    const [computers, total] = await Promise.all([
      Computer.find(query)
        .populate('lab', 'name code building')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Computer.countDocuments(query),
    ]);

    // Attach active tickets info if any
    const computerIds = computers.map((c) => c._id);
    const activeTickets = await Ticket.find({
      computer: { $in: computerIds },
      isActive: true,
    })
      .select('ticketId computer status priority')
      .lean();

    const activeTicketMap = new Map(
      activeTickets.map((t) => [String(t.computer), t])
    );

    const enrichedComputers = computers.map((c) => ({
      ...c,
      activeTicket: activeTicketMap.get(String(c._id)) || null,
    }));

    return {
      computers: enrichedComputers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getComputerDetail(id: string) {
    const computer = await Computer.findById(id)
      .populate('lab', 'name code building department')
      .lean();

    if (!computer || computer.deletedAt) {
      throw new NotFoundError('Computer not found');
    }

    // Maintenance history: all tickets for this computer, newest first
    const maintenanceHistory = await Ticket.find({ computer: computer._id })
      .populate('reportedBy', 'name email avatar picture')
      .populate('assignedTo', 'name email avatar picture')
      .sort({ createdAt: -1 })
      .lean();

    return {
      computer,
      maintenanceHistory,
    };
  }

  public static async createComputer(
    actorId: string,
    data: {
      assetTag: string;
      lab: string;
      label: string;
      processor?: string;
      ram?: string;
      storage?: string;
      purchaseDate?: string | Date | null;
      warrantyExpiry?: string | Date | null;
      vendor?: string;
      status?: ComputerStatus;
      notes?: string;
    },
    ip?: string
  ) {
    const existing = await Computer.findOne({
      assetTag: data.assetTag.toUpperCase(),
      deletedAt: null,
    });
    if (existing) {
      throw new ConflictError(`Computer with Asset Tag ${data.assetTag} already exists`);
    }

    const lab = await Laboratory.findById(data.lab);
    if (!lab || lab.deletedAt) {
      throw new NotFoundError('Laboratory not found');
    }

    const computer = await Computer.create({
      assetTag: data.assetTag.toUpperCase(),
      lab: lab._id,
      label: data.label,
      processor: data.processor || 'Intel Core i5',
      ram: data.ram || '8 GB DDR4',
      storage: data.storage || '256 GB SSD',
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      vendor: data.vendor || '',
      status: data.status || 'ACTIVE',
      notes: data.notes || '',
      installedComponents: [],
      isActive: true,
    });

    await AuditService.logEvent({
      actor: actorId,
      action: 'COMPUTER_CREATED',
      entityType: 'Computer',
      entityId: computer._id.toString(),
      after: data,
      ip,
    });

    return computer;
  }

  public static async updateComputer(
    actorId: string,
    id: string,
    data: {
      assetTag?: string;
      lab?: string;
      label?: string;
      processor?: string;
      ram?: string;
      storage?: string;
      purchaseDate?: string | Date | null;
      warrantyExpiry?: string | Date | null;
      vendor?: string;
      status?: ComputerStatus;
      notes?: string;
    },
    ip?: string
  ) {
    const computer = await Computer.findById(id);
    if (!computer || computer.deletedAt) {
      throw new NotFoundError('Computer not found');
    }

    if (data.assetTag && data.assetTag.toUpperCase() !== computer.assetTag) {
      const existing = await Computer.findOne({
        assetTag: data.assetTag.toUpperCase(),
        _id: { $ne: computer._id },
        deletedAt: null,
      });
      if (existing) {
        throw new ConflictError(`Computer with Asset Tag ${data.assetTag} already exists`);
      }
      computer.assetTag = data.assetTag.toUpperCase();
    }

    if (data.lab) {
      const lab = await Laboratory.findById(data.lab);
      if (!lab || lab.deletedAt) {
        throw new NotFoundError('Laboratory not found');
      }
      computer.lab = lab._id;
    }

    const before = {
      assetTag: computer.assetTag,
      lab: computer.lab,
      label: computer.label,
      processor: computer.processor,
      ram: computer.ram,
      storage: computer.storage,
      status: computer.status,
      vendor: computer.vendor,
      purchaseDate: computer.purchaseDate,
      warrantyExpiry: computer.warrantyExpiry,
    };

    if (data.label) computer.label = data.label;
    if (data.processor !== undefined) computer.processor = data.processor;
    if (data.ram !== undefined) computer.ram = data.ram;
    if (data.storage !== undefined) computer.storage = data.storage;
    if (data.vendor !== undefined) computer.vendor = data.vendor;
    if (data.status !== undefined) computer.status = data.status;
    if (data.notes !== undefined) computer.notes = data.notes;
    if (data.purchaseDate !== undefined) {
      computer.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    }
    if (data.warrantyExpiry !== undefined) {
      computer.warrantyExpiry = data.warrantyExpiry ? new Date(data.warrantyExpiry) : null;
    }

    await computer.save();

    await AuditService.logEvent({
      actor: actorId,
      action: 'COMPUTER_UPDATED',
      entityType: 'Computer',
      entityId: computer._id.toString(),
      before,
      after: data,
      ip,
    });

    return computer;
  }

  public static async deleteComputer(actorId: string, id: string, ip?: string) {
    const computer = await Computer.findById(id);
    if (!computer || computer.deletedAt) {
      throw new NotFoundError('Computer not found');
    }

    // Guard: block if active tickets exist
    const activeTicketsCount = await Ticket.countDocuments({
      computer: computer._id,
      isActive: true,
    });
    if (activeTicketsCount > 0) {
      throw new BadRequestError(
        `Cannot delete computer: ${activeTicketsCount} active ticket(s) are currently associated with it.`
      );
    }

    computer.deletedAt = new Date();
    computer.isActive = false;
    await computer.save();

    await AuditService.logEvent({
      actor: actorId,
      action: 'COMPUTER_DELETED',
      entityType: 'Computer',
      entityId: computer._id.toString(),
      before: { isActive: true },
      after: { deletedAt: computer.deletedAt, isActive: false },
      ip,
    });

    return { message: 'Computer soft-deleted successfully' };
  }

  public static async bulkStatusChange(
    actorId: string,
    ids: string[],
    newStatus: ComputerStatus,
    ip?: string
  ) {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const result = await Computer.updateMany(
      { _id: { $in: objectIds }, deletedAt: null },
      { $set: { status: newStatus } }
    );

    await AuditService.logEvent({
      actor: actorId,
      action: 'COMPUTERS_BULK_STATUS_CHANGED',
      entityType: 'Computer',
      entityId: `bulk-${ids.length}-computers`,
      after: { count: result.modifiedCount, newStatus, computerIds: ids },
      ip,
    });

    return { modifiedCount: result.modifiedCount };
  }

  // Bulk CSV Import
  public static async previewCsvImport(rows: Array<Record<string, string>>) {
    if (rows.length === 0) {
      throw new BadRequestError('CSV file has no data rows');
    }
    if (rows.length > 1000) {
      throw new BadRequestError('Maximum 1000 rows permitted per bulk import');
    }

    // Preload all active laboratories
    const labs = await Laboratory.find({ deletedAt: null }).lean();
    const labMap = new Map<string, Types.ObjectId>();
    for (const l of labs) {
      labMap.set(l.code.toUpperCase(), l._id);
      if (l.labCode) labMap.set(l.labCode, l._id);
    }

    // Preload existing asset tags
    const existingComputers = await Computer.find({ deletedAt: null }).select('assetTag').lean();
    const existingAssetTags = new Set(existingComputers.map((c) => c.assetTag.toUpperCase()));

    const seenInCsv = new Set<string>();
    const validRows: Array<{
      assetTag: string;
      labId: string;
      labCode: string;
      label: string;
      processor?: string;
      ram?: string;
      storage?: string;
      purchaseDate?: string | null;
      warrantyExpiry?: string | null;
      vendor?: string;
      status?: ComputerStatus;
      notes?: string;
    }> = [];

    const invalidRows: Array<{
      rowNumber: number;
      assetTag: string;
      errors: string[];
      raw: Record<string, string>;
    }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      const rowNumber = i + 1;
      const errors: string[] = [];

      const assetTag = (row.assetTag || row.AssetTag || '').trim().toUpperCase();
      const labCode = (row.labCode || row.LabCode || row.lab || row.Lab || '').trim().toUpperCase();
      const label = (row.label || row.Label || row.pcNumber || row['PC Number'] || '').trim();

      if (!assetTag) {
        errors.push('Asset Tag is required');
      } else if (seenInCsv.has(assetTag)) {
        errors.push(`Duplicate Asset Tag in this CSV: ${assetTag}`);
      } else if (existingAssetTags.has(assetTag)) {
        errors.push(`Asset Tag ${assetTag} already exists in database`);
      } else {
        seenInCsv.add(assetTag);
      }

      if (!labCode) {
        errors.push('Laboratory code is required');
      } else if (!labMap.has(labCode)) {
        errors.push(`Laboratory code '${labCode}' does not match any active laboratory`);
      }

      if (!label) {
        errors.push('Label / PC number is required');
      }

      // Validate date format if present
      const purchaseDate = row.purchaseDate || row['Purchase Date'] || '';
      if (purchaseDate && isNaN(Date.parse(purchaseDate))) {
        errors.push('Invalid purchase date format (use YYYY-MM-DD)');
      }

      const warrantyExpiry = row.warrantyExpiry || row['Warranty Expiry'] || '';
      if (warrantyExpiry && isNaN(Date.parse(warrantyExpiry))) {
        errors.push('Invalid warranty expiry date format (use YYYY-MM-DD)');
      }

      if (errors.length > 0) {
        invalidRows.push({
          rowNumber,
          assetTag: assetTag || 'N/A',
          errors,
          raw: row,
        });
      } else {
        const labId = labMap.get(labCode)!.toString();
        let status = (row.status || row.Status || 'ACTIVE').trim().toUpperCase() as ComputerStatus;
        if (!['ACTIVE', 'UNDER_MAINTENANCE', 'RETIRED', 'OPERATIONAL', 'DECOMMISSIONED'].includes(status)) {
          status = 'ACTIVE';
        }

        validRows.push({
          assetTag,
          labId,
          labCode,
          label,
          processor: (row.processor || row.Processor || 'Intel Core i5').trim(),
          ram: (row.ram || row.RAM || '8 GB DDR4').trim(),
          storage: (row.storage || row.Storage || '256 GB SSD').trim(),
          purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
          warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry).toISOString() : null,
          vendor: (row.vendor || row.Vendor || '').trim(),
          status,
          notes: (row.notes || row.Notes || '').trim(),
        });
      }
    }

    return {
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      validRows,
      invalidRows,
    };
  }

  public static async confirmCsvImport(
    actorId: string,
    validRows: Array<{
      assetTag: string;
      labId: string;
      label: string;
      processor?: string;
      ram?: string;
      storage?: string;
      purchaseDate?: string | null;
      warrantyExpiry?: string | null;
      vendor?: string;
      status?: ComputerStatus;
      notes?: string;
    }>,
    ip?: string
  ) {
    if (validRows.length === 0) {
      throw new BadRequestError('No valid rows provided to import');
    }

    const docs = validRows.map((r) => ({
      assetTag: r.assetTag.toUpperCase(),
      lab: new Types.ObjectId(r.labId),
      label: r.label,
      processor: r.processor || 'Intel Core i5',
      ram: r.ram || '8 GB DDR4',
      storage: r.storage || '256 GB SSD',
      purchaseDate: r.purchaseDate ? new Date(r.purchaseDate) : null,
      warrantyExpiry: r.warrantyExpiry ? new Date(r.warrantyExpiry) : null,
      vendor: r.vendor || '',
      status: r.status || 'ACTIVE',
      notes: r.notes || '',
      installedComponents: [],
      isActive: true,
    }));

    const result = await Computer.insertMany(docs);

    // Audit the import as one entry with counts
    await AuditService.logEvent({
      actor: actorId,
      action: 'COMPUTERS_BULK_IMPORTED',
      entityType: 'Computer',
      entityId: `import-${result.length}-assets`,
      after: {
        importedCount: result.length,
        assetTags: validRows.map((r) => r.assetTag),
      },
      ip,
    });

    return {
      importedCount: result.length,
    };
  }

  // =========================================================================
  // 6. SETTINGS
  // =========================================================================
  public static async getSettings() {
    return SettingsService.getAllSettings();
  }

  public static async updateSettings(
    actorId: string,
    data: {
      escalation_timeout_hours?: number;
      low_stock_default_threshold?: number;
    },
    ip?: string
  ) {
    if (data.escalation_timeout_hours !== undefined) {
      await SettingsService.setSetting(
        'escalation_timeout_hours',
        data.escalation_timeout_hours,
        actorId,
        ip
      );
    }

    if (data.low_stock_default_threshold !== undefined) {
      await SettingsService.setSetting(
        'low_stock_default_threshold',
        data.low_stock_default_threshold,
        actorId,
        ip
      );
    }

    return SettingsService.getAllSettings();
  }

  // =========================================================================
  // 7. AUDIT LOG VIEWER
  // =========================================================================
  public static async getAuditLogs(filters: AuditQueryFilters) {
    return AuditService.queryLogs(filters);
  }
}
