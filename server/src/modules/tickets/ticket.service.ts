import { Types } from 'mongoose';
import { Ticket, ITicket } from './ticket.model';
import { Computer } from '../computers/computer.model';
import { Laboratory } from '../laboratories/laboratory.model';
import { User } from '../auth/auth.model';
import { generateTicketId } from '../../common/models/counter.model';
import { PriorityEngine } from './priority.engine';
import { AssignmentService } from './assignment.service';
import { TicketStateMachine } from './ticket.state-machine';
import { TicketCategory, TicketPriority, TicketStatus } from './ticket.constants';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { emitToLab, emitToUser } from '../../common/socket/socket.server';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../common/errors/app-error';
import { JwtTokenPayload } from '../auth/auth.service';

export interface CreateTicketParams {
  computer: string;
  lab: string;
  category: TicketCategory;
  description: string;
  priority?: TicketPriority;
  images?: string[];
  user: JwtTokenPayload;
  ipAddress?: string;
  userAgent?: string;
}

export interface TransitionStatusParams {
  ticketId: string;
  nextStatus: TicketStatus;
  note?: string;
  resolutionNotes?: string;
  testedOk?: boolean;
  user: JwtTokenPayload;
  ipAddress?: string;
  userAgent?: string;
}

export interface TicketFilters {
  lab?: string;
  department?: string;
  status?: string;
  priority?: string;
  isActive?: boolean;
  search?: string;
}

export class TicketService {
  /**
   * Creates a new complaint ticket enforcing BR-1, BR-2, BR-3, BR-4, REQ-1.8, REQ-1.9.
   */
  static async createTicket(params: CreateTicketParams): Promise<ITicket> {
    const { computer: computerId, lab: labId, category, description, user, ipAddress } = params;

    // 1. Verify Lab exists
    const lab = await Laboratory.findById(labId);
    if (!lab) {
      throw new NotFoundError(`Laboratory not found`);
    }

    // 2. BR-2: Verify Computer exists and belongs to the specified lab
    const computer = await Computer.findById(computerId);
    if (!computer) {
      throw new NotFoundError(`Computer not found`);
    }
    if (computer.lab.toString() !== lab._id.toString()) {
      throw new BadRequestError(`Computer ${computer.assetTag} does not belong to Laboratory ${lab.code}`);
    }

    // 3. BR-3: Check for existing active ticket for this computer
    const existingActiveTicket = await Ticket.findOne({
      computer: computer._id,
      isActive: true,
    });
    if (existingActiveTicket) {
      throw new ConflictError(
        `BR-3 Violation: An active ticket (${existingActiveTicket.ticketId}) already exists for computer ${computer.label}`
      );
    }

    // 4. REQ-1.9: Determine priority with Safety Keyword analysis
    const { priority } = PriorityEngine.determinePriority(category, description, params.priority);

    // 5. REQ-1.8: Generate sequential annual Ticket ID FIX-YYYY-000001
    const ticketId = await generateTicketId();

    // 6. BR-4: Auto-assign ticket to lab assistant
    const assignment = await AssignmentService.autoAssign(lab._id);

    // 7. Initialize timeline
    const timelineEntry = {
      status: assignment.status,
      actor: {
        id: new Types.ObjectId(user.id),
        name: user.email.split('@')[0] || 'User',
        role: user.role,
      },
      timestamp: new Date(),
      note: assignment.assignedTo
        ? `Ticket created and auto-assigned to ${assignment.assistantName || 'Assistant'}`
        : 'Ticket created (Awaiting assignment)',
    };

    try {
      const ticket = await Ticket.create({
        ticketId,
        computer: computer._id,
        lab: lab._id,
        department: lab.department,
        reportedBy: new Types.ObjectId(user.id),
        assignedTo: assignment.assignedTo,
        category,
        priority,
        description,
        images: params.images || [],
        status: assignment.status,
        isActive: true,
        timeline: [timelineEntry],
      });

      // 8. BR-9: Write Audit Log
      await AuditService.logEvent({
        actor: user.id,
        action: 'TICKET_CREATED',
        entityType: 'Ticket',
        entityId: ticket._id.toString(),
        after: { ticketId, computer: computer.assetTag, category, priority, status: ticket.status },
        ip: ipAddress,
      });

      // 9. Notifications & Socket Events
      if (assignment.assignedTo) {
        await NotificationService.create({
          userId: assignment.assignedTo,
          title: `New Ticket Assigned: ${ticketId}`,
          message: `${category} issue reported on ${computer.label} in ${lab.name}`,
          type: priority === 'CRITICAL' ? 'ALERT' : 'INFO',
          ticketId: ticket._id.toString(),
        });
      }

      emitToLab(lab._id.toString(), 'ticket:created', ticket);

      return ticket;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictError(
          `BR-3 Violation: An active ticket already exists for computer ${computer.label}`
        );
      }
      throw error;
    }
  }

  /**
   * Transitions ticket status enforcing state-machine and role permissions.
   */
  static async transitionStatus(params: TransitionStatusParams): Promise<ITicket> {
    const { ticketId, nextStatus, note, resolutionNotes, testedOk, user, ipAddress } = params;

    const ticket = await Ticket.findById(ticketId)
      .populate('computer', 'label assetTag')
      .populate('lab', 'name code assistants department');

    if (!ticket) {
      throw new NotFoundError(`Ticket not found`);
    }

    // Role-based scoping checks
    if (user.role === 'STUDENT') {
      if (ticket.reportedBy.toString() !== user.id) {
        throw new ForbiddenError(`Forbidden: You can only update your own tickets`);
      }
      if (nextStatus !== 'CANCELLED') {
        throw new ForbiddenError(`Students are only permitted to cancel their open tickets`);
      }
    } else if (user.role === 'LAB_ASSISTANT') {
      // Fetch assistant's assigned labs
      const dbUser = await User.findById(user.id);
      const assignedLabs = (dbUser?.assignedLabs || []).map((id) => id.toString());
      if (!assignedLabs.includes(ticket.lab._id.toString())) {
        throw new ForbiddenError(`Forbidden: You are not assigned to Laboratory ${(ticket.lab as any).code}`);
      }
    } else if (user.role === 'DEPT_AUTHORITY' || user.role === 'HOD') {
      const dbUser = await User.findById(user.id);
      if (dbUser?.department?.toString() !== ticket.department.toString()) {
        throw new ForbiddenError(`Forbidden: Ticket does not belong to your department`);
      }
    }

    // Validate state-machine transition
    TicketStateMachine.validateTransition(ticket.status, nextStatus);

    // BR-8: Closure condition enforcement
    if (nextStatus === 'CLOSED') {
      if (testedOk !== true) {
        throw new BadRequestError(
          'BR-8 Violation: Ticket cannot be closed without verifying testedOk is true'
        );
      }
      if (!resolutionNotes || resolutionNotes.trim().length === 0) {
        throw new BadRequestError(
          'BR-8 Violation: Ticket cannot be closed without non-empty resolution notes'
        );
      }
      ticket.testedOk = true;
      ticket.resolutionNotes = resolutionNotes.trim();
      ticket.closedAt = new Date();
    }

    if (resolutionNotes) {
      ticket.resolutionNotes = resolutionNotes.trim();
    }
    if (testedOk !== undefined) {
      ticket.testedOk = testedOk;
    }

    const previousStatus = ticket.status;
    ticket.status = nextStatus;

    // Add timeline entry
    const actorUser = await User.findById(user.id);
    ticket.timeline.push({
      status: nextStatus,
      actor: {
        id: new Types.ObjectId(user.id),
        name: actorUser?.name || user.email.split('@')[0] || 'User',
        role: user.role,
      },
      timestamp: new Date(),
      note: note || `Status transitioned to ${nextStatus}`,
    });

    await ticket.save();

    // BR-9: Write Audit Log
    await AuditService.logEvent({
      actor: user.id,
      action: 'TICKET_STATUS_UPDATED',
      entityType: 'Ticket',
      entityId: ticket._id.toString(),
      before: { status: previousStatus },
      after: { status: nextStatus, note, testedOk },
      ip: ipAddress,
    });

    // Notify Student
    await NotificationService.create({
      userId: ticket.reportedBy,
      title: `Ticket ${ticket.ticketId} Updated`,
      message: `Status changed from ${previousStatus} to ${nextStatus}`,
      type: nextStatus === 'RESOLVED' || nextStatus === 'CLOSED' ? 'SUCCESS' : 'INFO',
      ticketId: ticket._id.toString(),
    });

    // Emit live events
    emitToLab(ticket.lab._id.toString(), 'ticket:updated', ticket);
    emitToUser(ticket.reportedBy.toString(), 'ticket:updated', ticket);

    return ticket;
  }

  /**
   * Adds an internal note to the ticket timeline.
   */
  static async addNote(
    ticketId: string,
    noteText: string,
    user: JwtTokenPayload,
    ipAddress?: string
  ): Promise<ITicket> {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError(`Ticket not found`);
    }

    const actorUser = await User.findById(user.id);
    ticket.timeline.push({
      status: ticket.status,
      actor: {
        id: new Types.ObjectId(user.id),
        name: actorUser?.name || user.email.split('@')[0] || 'User',
        role: user.role,
      },
      timestamp: new Date(),
      note: noteText,
    });

    await ticket.save();

    await AuditService.logEvent({
      actor: user.id,
      action: 'TICKET_NOTE_ADDED',
      entityType: 'Ticket',
      entityId: ticket._id.toString(),
      after: { note: noteText },
      ip: ipAddress,
    });

    emitToLab(ticket.lab.toString(), 'ticket:updated', ticket);
    emitToUser(ticket.reportedBy.toString(), 'ticket:updated', ticket);

    return ticket;
  }

  /**
   * Gets tickets scoped according to user role.
   */
  static async getTickets(user: JwtTokenPayload, filters: TicketFilters): Promise<ITicket[]> {
    const query: Record<string, unknown> = {};

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.lab) query.lab = filters.lab;
    if (filters.department) query.department = filters.department;

    if (user.role === 'STUDENT') {
      // Students can strictly only view their own reported tickets
      query.reportedBy = user.id;
    } else if (user.role === 'LAB_ASSISTANT') {
      const dbUser = await User.findById(user.id);
      const assignedLabs = dbUser?.assignedLabs || [];
      query.lab = { $in: assignedLabs };
    } else if (user.role === 'DEPT_AUTHORITY' || user.role === 'HOD') {
      const dbUser = await User.findById(user.id);
      if (dbUser?.department) {
        query.department = dbUser.department;
      }
    }
    // ADMIN has full access across all tickets

    return Ticket.find(query)
      .populate('computer', 'label assetTag processor ram storage')
      .populate('lab', 'name code building')
      .populate('department', 'name code')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
  }

  /**
   * Gets single ticket by ID with strict role scoping.
   */
  static async getTicketById(id: string, user: JwtTokenPayload): Promise<ITicket> {
    const ticket = await Ticket.findById(id)
      .populate('computer', 'label assetTag processor ram storage')
      .populate('lab', 'name code building assistants')
      .populate('department', 'name code')
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      throw new NotFoundError(`Ticket not found`);
    }

    // Role-based visibility check
    if (user.role === 'STUDENT' && ticket.reportedBy._id.toString() !== user.id) {
      throw new ForbiddenError(`Access denied: You are not authorized to view this ticket`);
    }

    if (user.role === 'LAB_ASSISTANT') {
      const dbUser = await User.findById(user.id);
      const assignedLabs = (dbUser?.assignedLabs || []).map((l) => l.toString());
      if (!assignedLabs.includes(ticket.lab._id.toString())) {
        throw new ForbiddenError(`Access denied: Ticket does not belong to your assigned laboratories`);
      }
    }

    return ticket;
  }
}
