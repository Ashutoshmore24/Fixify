import { Laboratory, ILaboratory } from './laboratory.model';
import '../departments/department.model';
import '../auth/auth.model';
import { NotFoundError } from '../../common/errors/app-error';

export class LaboratoryService {
  static async getAll(departmentId?: string): Promise<ILaboratory[]> {
    const filter: Record<string, unknown> = { isActive: true };
    if (departmentId) {
      filter.department = departmentId;
    }
    return Laboratory.find(filter)
      .populate('department', 'name code')
      .populate('assistants', 'name email role')
      .sort({ code: 1 });
  }

  static async getById(id: string): Promise<ILaboratory> {
    const lab = await Laboratory.findById(id)
      .populate('department', 'name code')
      .populate('assistants', 'name email role');
    if (!lab) {
      throw new NotFoundError(`Laboratory with ID ${id} not found`);
    }
    return lab;
  }

  static async getByCode(code: string): Promise<ILaboratory> {
    const cleanCode = code.toUpperCase().trim();
    const lab = await Laboratory.findOne({
      $or: [
        { code: cleanCode },
        { code: `LAB-${cleanCode.replace(/^LAB-/, '')}` },
        { labCode: cleanCode },
        { roomNumber: cleanCode.replace(/^LAB-/, '') },
      ],
    })
      .populate('department', 'name code')
      .populate('assistants', 'name email role');
    if (!lab) {
      throw new NotFoundError(`Laboratory with code ${code} not found`);
    }
    return lab;
  }

  static async getMap(idOrCode: string) {
    let lab: ILaboratory | null = null;
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrCode);
    if (isObjectId) {
      lab = await Laboratory.findById(idOrCode)
        .populate('department', 'name code')
        .populate('assistants', 'name email role');
    }
    if (!lab) {
      const cleanCode = idOrCode.toUpperCase().trim();
      lab = await Laboratory.findOne({
        $or: [
          { code: cleanCode },
          { code: `LAB-${cleanCode.replace(/^LAB-/, '')}` },
          { labCode: cleanCode },
          { roomNumber: cleanCode.replace(/^LAB-/, '') },
        ],
      })
        .populate('department', 'name code')
        .populate('assistants', 'name email role');
    }

    if (!lab) {
      throw new NotFoundError(`Laboratory "${idOrCode}" not found`);
    }

    // Import config
    const { findLabMapConfig } = await import('./lab-maps.config');
    const mapConfig = findLabMapConfig(lab.code) || findLabMapConfig(lab.roomNumber || '');

    // Fetch computers and active tickets for this lab
    const { Computer } = await import('../computers/computer.model');
    const { Ticket } = await import('../tickets/ticket.model');

    const [computers, activeTickets] = await Promise.all([
      Computer.find({ lab: lab._id, isActive: true }).sort({ label: 1 }),
      Ticket.find({ lab: lab._id, isActive: true }).select('ticketId computer status priority category'),
    ]);

    const activeTicketsByComputerId = new Map<string, { ticketId: string; status: string; priority: string; category: string }>();
    for (const t of activeTickets) {
      activeTicketsByComputerId.set(t.computer.toString(), {
        ticketId: t.ticketId,
        status: t.status,
        priority: t.priority,
        category: t.category,
      });
    }

    const computersWithActiveTickets = computers.map((pc) => {
      const activeTicket = activeTicketsByComputerId.get(pc._id.toString()) || null;
      return {
        _id: pc._id,
        assetTag: pc.assetTag,
        label: pc.label,
        status: pc.status,
        processor: pc.processor,
        ram: pc.ram,
        storage: pc.storage,
        activeTicket,
      };
    });

    if (!mapConfig || !mapConfig.hasMap) {
      return {
        hasMap: false,
        roomNumber: mapConfig?.roomNumber || lab.code.replace(/^LAB-/, ''),
        code: lab.code,
        roomName: lab.name,
        reason: 'Visual layout map graphic not yet prepared for this laboratory. Use workstation list view.',
        lab: {
          _id: lab._id,
          name: lab.name,
          code: lab.code,
          building: lab.building,
          assistants: lab.assistants,
        },
        computers: computersWithActiveTickets,
      };
    }

    // Map hotspots to actual database computers
    // Create lookup by numeric index (e.g., PC-01 -> 1) and by exact label
    const pcByIndex = new Map<number, typeof computersWithActiveTickets[0]>();
    const pcByLabel = new Map<string, typeof computersWithActiveTickets[0]>();

    computersWithActiveTickets.forEach((pc, idx) => {
      pcByIndex.set(idx + 1, pc);
      const matchNum = pc.label.match(/\d+/);
      if (matchNum) {
        const num = parseInt(matchNum[0], 10);
        pcByIndex.set(num, pc);
      }
      pcByLabel.set(pc.label.toUpperCase(), pc);
      pcByLabel.set(pc.assetTag.toUpperCase(), pc);
    });

    const mappedHotspots = (mapConfig.hotspots || []).map((spot) => {
      const pc =
        pcByIndex.get(spot.pcIndex) ||
        pcByLabel.get(`PC-${String(spot.pcIndex).padStart(2, '0')}`) ||
        computersWithActiveTickets[spot.pcIndex - 1] ||
        null;

      return {
        hotspotId: spot.hotspotId,
        pcIndex: spot.pcIndex,
        x: spot.x,
        y: spot.y,
        width: spot.width || 4.2,
        height: spot.height || 4.2,
        label: spot.label,
        computer: pc,
      };
    });

    return {
      hasMap: true,
      roomNumber: mapConfig.roomNumber,
      code: lab.code,
      roomName: lab.name,
      imageFileName: mapConfig.imageFileName,
      imagePath: mapConfig.imagePath,
      dimensions: mapConfig.dimensions,
      totalWorkstations: mapConfig.totalWorkstations,
      lab: {
        _id: lab._id,
        name: lab.name,
        code: lab.code,
        building: lab.building,
        assistants: lab.assistants,
      },
      hotspots: mappedHotspots,
      computers: computersWithActiveTickets,
    };
  }
}
