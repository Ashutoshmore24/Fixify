import { Laboratory, ILaboratory } from './laboratory.model';
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
    const lab = await Laboratory.findOne({ code: code.toUpperCase() })
      .populate('department', 'name code')
      .populate('assistants', 'name email role');
    if (!lab) {
      throw new NotFoundError(`Laboratory with code ${code} not found`);
    }
    return lab;
  }
}
