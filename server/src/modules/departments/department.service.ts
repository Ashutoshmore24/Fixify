import { Department, IDepartment } from './department.model';
import { NotFoundError } from '../../common/errors/app-error';

export const DEFAULT_DEPARTMENTS_DATA = [
  { name: 'Computer Engineering', code: 'COMP' },
  { name: 'Information Technology', code: 'IT' },
  { name: 'Artificial Intelligence & Data Science', code: 'AI&DS' },
  { name: 'Computer Science & Engineering (Regional)', code: 'CSE-R' },
  { name: 'Electronics & Telecommunication', code: 'E&TC' },
  { name: 'Mechanical Engineering', code: 'MECH' },
  { name: 'Civil Engineering', code: 'CIVIL' },
  { name: 'Robotics & Automation', code: 'R&A' },
  { name: 'Applied Sciences & Humanities', code: 'AS&H' },
  { name: 'Master of Computer Applications', code: 'MCA' },
];

export class DepartmentService {
  private static async ensureDefaultDepartments(): Promise<void> {
    for (const d of DEFAULT_DEPARTMENTS_DATA) {
      await Department.findOneAndUpdate(
        { code: d.code },
        {
          $setOnInsert: {
            name: d.name,
            code: d.code,
            isActive: true,
            authorities: [],
          },
        },
        { upsert: true, new: true }
      );
    }
  }

  static async getAll(): Promise<IDepartment[]> {
    const count = await Department.countDocuments({ isActive: true });
    if (count < DEFAULT_DEPARTMENTS_DATA.length) {
      await this.ensureDefaultDepartments();
    }
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
