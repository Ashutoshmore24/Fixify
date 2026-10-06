import { Router } from 'express';
import { TicketController } from './ticket.controller';
import { authenticate } from '../auth/auth.middleware';
import { validateRequest } from '../../common/middleware/validate.middleware';
import {
  createTicketSchema,
  transitionStatusSchema,
  addNoteSchema,
} from './ticket.schema';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest({ body: createTicketSchema }), TicketController.createTicket);
router.get('/', TicketController.getTickets);
router.get('/:id', TicketController.getTicketById);
router.patch(
  '/:id/status',
  validateRequest({ body: transitionStatusSchema }),
  TicketController.transitionStatus
);
router.post(
  '/:id/notes',
  validateRequest({ body: addNoteSchema }),
  TicketController.addNote
);

export const ticketRoutes = router;
