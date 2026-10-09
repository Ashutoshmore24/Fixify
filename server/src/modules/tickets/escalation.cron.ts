import { Types } from 'mongoose';
import cron from 'node-cron';
import { Ticket } from './ticket.model';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notifications/notification.service';
import { emitToLab } from '../../common/socket/socket.server';
import { logger } from '../../common/utils/logger';

/**
 * Runs a check for tickets exceeding escalation timeout and escalates them automatically.
 */
export async function runEscalationCheck(): Promise<number> {
  try {
    const timeoutHours = await SettingsService.getEscalationTimeoutHours();
    const cutoffDate = new Date(Date.now() - timeoutHours * 3600 * 1000);

    const overdueTickets = await Ticket.find({
      status: { $in: ['OPEN', 'ASSIGNED'] },
      isActive: true,
      createdAt: { $lte: cutoffDate },
    });

    if (overdueTickets.length === 0) {
      return 0;
    }

    logger.info(`Escalation cron found ${overdueTickets.length} overdue tickets (threshold: ${timeoutHours}h)`);

    for (const ticket of overdueTickets) {
      const prevStatus = ticket.status;
      ticket.status = 'ESCALATED';
      ticket.timeline.push({
        status: 'ESCALATED',
        actor: {
          id: new Types.ObjectId('000000000000000000000000'),
          name: 'System Escalation Engine',
          role: 'SYSTEM',
        },
        timestamp: new Date(),
        note: `Ticket automatically escalated after ${timeoutHours} hours without resolution.`,
      });

      await ticket.save();

      // Audit log the automatic escalation
      await AuditService.logEvent({
        actor: null,
        action: 'TICKET_AUTO_ESCALATED',
        entityType: 'Ticket',
        entityId: ticket._id.toString(),
        before: { status: prevStatus },
        after: { status: 'ESCALATED', timeoutHours },
      });

      // Send in-app notification if assigned or reported
      if (ticket.assignedTo) {
        await NotificationService.create({
          userId: ticket.assignedTo,
          title: `Ticket ${ticket.ticketId} Auto-Escalated`,
          message: `Ticket has exceeded the ${timeoutHours}-hour resolution SLA and was escalated to Department Authority.`,
          type: 'WARNING',
          ticketId: ticket.ticketId,
        });
      }

      emitToLab(ticket.lab.toString(), 'ticket:escalated', ticket);
    }

    return overdueTickets.length;
  } catch (error) {
    logger.error(error, 'Error executing escalation check cron job');
    return 0;
  }
}

/**
 * Initializes the recurring escalation cron schedule (runs hourly).
 */
export function initEscalationCron(): cron.ScheduledTask | null {
  try {
    // Run at minute 0 every hour
    const task = cron.schedule('0 * * * *', async () => {
      logger.info('Running scheduled ticket escalation SLA verification...');
      await runEscalationCheck();
    });
    logger.info('Escalation SLA cron job successfully scheduled (Hourly: 0 * * * *)');
    return task;
  } catch (err) {
    logger.warn(err, 'Could not schedule escalation cron job');
    return null;
  }
}
