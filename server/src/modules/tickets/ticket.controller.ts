import { Request, Response, NextFunction } from 'express';
import { TicketService } from './ticket.service';
import { sendSuccess } from '../../common/utils/api-response';

export class TicketController {
  static async createTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await TicketService.createTicket({
        ...req.body,
        user: req.user!,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, ticket, 201);
    } catch (error) {
      next(error);
    }
  }

  static async getTickets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        lab: req.query.lab as string | undefined,
        department: req.query.department as string | undefined,
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string | undefined,
      };

      const tickets = await TicketService.getTickets(req.user!, filters);
      sendSuccess(res, tickets);
    } catch (error) {
      next(error);
    }
  }

  static async getTicketById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await TicketService.getTicketById(req.params.id as string, req.user!);
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  static async transitionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await TicketService.transitionStatus({
        ticketId: req.params.id as string,
        nextStatus: req.body.status,
        note: req.body.note,
        resolutionNotes: req.body.resolutionNotes,
        testedOk: req.body.testedOk,
        user: req.user!,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  }

  static async addNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticket = await TicketService.addNote(
        req.params.id as string,
        req.body.note as string,
        req.user!,
        req.ip
      );
      sendSuccess(res, ticket);
    } catch (error) {
      next(error);
    }
  }
}
