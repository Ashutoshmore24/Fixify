import { Types } from 'mongoose';
import { Laboratory } from '../laboratories/laboratory.model';
import { Ticket } from './ticket.model';
import { TicketStatus } from './ticket.constants';
import { IUser } from '../auth/auth.model';

export interface AssignmentResult {
  assignedTo: Types.ObjectId | null;
  status: TicketStatus;
  assistantName?: string;
}

export class AssignmentService {
  /**
   * BR-4: Auto-assigns new ticket to the laboratory's assistant with least active tickets.
   * If no assistant is assigned to the lab, sets status to OPEN.
   */
  static async autoAssign(labId: Types.ObjectId | string): Promise<AssignmentResult> {
    const lab = await Laboratory.findById(labId).populate<{ assistants: IUser[] }>({
      path: 'assistants',
      match: { isActive: true },
    });

    if (!lab || !lab.assistants || lab.assistants.length === 0) {
      return {
        assignedTo: null,
        status: 'OPEN',
      };
    }

    const availableAssistants = lab.assistants.filter((a) => Boolean(a && a._id));
    if (availableAssistants.length === 0) {
      return {
        assignedTo: null,
        status: 'OPEN',
      };
    }

    // Single assistant shortcut
    if (availableAssistants.length === 1) {
      const assistant = availableAssistants[0]!;
      return {
        assignedTo: assistant._id,
        status: 'ASSIGNED',
        assistantName: assistant.name,
      };
    }

    // Multiple assistants: least active tickets strategy
    const assistantCounts = await Promise.all(
      availableAssistants.map(async (ast) => {
        const activeCount = await Ticket.countDocuments({
          assignedTo: ast._id,
          isActive: true,
        });
        return { assistant: ast, count: activeCount };
      })
    );

    assistantCounts.sort((a, b) => a.count - b.count);
    const chosen = assistantCounts[0]!.assistant;

    return {
      assignedTo: chosen._id,
      status: 'ASSIGNED',
      assistantName: chosen.name,
    };
  }
}
