import { Computer, IComputer } from './computer.model';
import { NotFoundError } from '../../common/errors/app-error';
import mongoose from 'mongoose';

export interface ComputerWithTicketInfo {
  _id: string;
  assetTag: string;
  lab: string;
  label: string;
  processor: string;
  ram: string;
  storage: string;
  status: string;
  isActive: boolean;
  activeTicket: { _id: string; ticketId: string; status: string } | null;
}

export class ComputerService {
  static async getByLab(labId: string): Promise<ComputerWithTicketInfo[]> {
    const computers = await Computer.find({ lab: labId, isActive: true }).sort({ label: 1 }).lean();

    const computerIds = computers.map((c) => c._id);
    const Ticket = mongoose.model('Ticket');
    const activeTickets = await Ticket.find({
      computer: { $in: computerIds },
      isActive: true,
    }).select('_id ticketId status computer').lean();

    const ticketMap = new Map<string, { _id: string; ticketId: string; status: string }>();
    for (const t of activeTickets as any[]) {
      ticketMap.set(t.computer.toString(), {
        _id: t._id.toString(),
        ticketId: t.ticketId,
        status: t.status,
      });
    }

    return computers.map((c: any) => ({
      _id: c._id.toString(),
      assetTag: c.assetTag,
      lab: c.lab.toString(),
      label: c.label,
      processor: c.processor,
      ram: c.ram,
      storage: c.storage,
      status: c.status,
      isActive: c.isActive,
      activeTicket: ticketMap.get(c._id.toString()) || null,
    }));
  }

  static async getById(id: string): Promise<IComputer> {
    const pc = await Computer.findById(id).populate('lab', 'name code building');
    if (!pc) {
      throw new NotFoundError(`Computer with ID ${id} not found`);
    }
    return pc;
  }
}
