import { Department, IDepartment } from './department.model';
import { NotFoundError } from '../../common/errors/app-error';

export class DepartmentService {
  static async getAll(): Promise<IDepartment[]> {
    return Department.find({ isActive: true })
      .populate('hod', 'name email role')
      .populate('authorities', 'name email role')
      .sort({ name: 1 });
  }

  static async getById(id: string): Promise<IDepartment> {
    const dept = await Department.findById(id)
      .populate('hod', 'name email role')
      .populate('authorities', 'name email role');
    if (!dept) {
      throw new NotFoundError(`Department with ID ${id} not found`);
    }
    return dept;
  }

  static async getByCode(code: string): Promise<IDepartment> {
    const dept = await Department.findOne({ code: code.toUpperCase() })
      .populate('hod', 'name email role')
      .populate('authorities', 'name email role');
    if (!dept) {
      throw new NotFoundError(`Department with code ${code} not found`);
    }
    return dept;
  }
}
