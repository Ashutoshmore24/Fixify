import path from 'path';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';

// Load server .env
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

import mongoose from 'mongoose';
import { Department } from '../server/src/modules/departments/department.model';
import { Laboratory } from '../server/src/modules/laboratories/laboratory.model';
import { Computer } from '../server/src/modules/computers/computer.model';
import { User } from '../server/src/modules/auth/auth.model';
import { Setting } from '../server/src/modules/settings/setting.model';
import { DeactivationRequest } from '../server/src/modules/profile/deactivation-request.model';

export const seedDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixify';
  console.log(`Connecting to MongoDB for seeding at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  console.log('Seeding Complete Admin Module & Domain Demo Data...');

  // 0. One-time Migration: Ensure any existing laboratories have a random non-guessable 10-char labCode
  const unmigratedLabs = await Laboratory.find({
    $or: [{ labCode: { $exists: false } }, { labCode: null }, { labCode: '' }],
  });
  if (unmigratedLabs.length > 0) {
    console.log(`Migrating ${unmigratedLabs.length} legacy laboratories to random labCodes...`);
    for (const legacyLab of unmigratedLabs) {
      legacyLab.labCode = nanoid(10);
      await legacyLab.save();
      console.log(`Migrated lab ${legacyLab.code} -> labCode: ${legacyLab.labCode}`);
    }
  }

  // 1. Departments
  let compDept = await Department.findOne({ code: 'COMP' });
  if (!compDept) {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
      isActive: true,
    });
    console.log('Created Department: Computer Engineering (COMP)');
  }

  let itDept = await Department.findOne({ code: 'IT' });
  if (!itDept) {
    itDept = await Department.create({
      name: 'Information Technology',
      code: 'IT',
      isActive: true,
    });
    console.log('Created Department: Information Technology (IT)');
  }

  // 2. Users for all roles and demo states
  const usersData = [
    {
      name: 'System Administrator',
      email: 'admin@pccoe.org',
      role: 'ADMIN' as const,
      department: compDept._id,
      approvalStatus: 'APPROVED' as const,
      assignedLabs: [],
    },
    {
      name: 'Lab Assistant Sharma',
      email: 'assistant@pccoe.org',
      role: 'LAB_ASSISTANT' as const,
      department: compDept._id,
      approvalStatus: 'APPROVED' as const,
      assignedLabs: [],
    },
    {
      name: 'Dept Authority Patil',
      email: 'authority@pccoe.org',
      role: 'DEPT_AUTHORITY' as const,
      department: compDept._id,
      approvalStatus: 'APPROVED' as const,
      assignedLabs: [],
    },
    {
      name: 'HOD Computer Engg',
      email: 'hod@pccoe.org',
      role: 'HOD' as const,
      department: compDept._id,
      approvalStatus: 'APPROVED' as const,
      assignedLabs: [],
    },
    {
      name: 'Rahul Deshmukh (Student)',
      email: 'student@pccoe.org',
      role: 'STUDENT' as const,
      department: compDept._id,
      approvalStatus: 'APPROVED' as const,
      prn: 'PRN12345678',
      assignedLabs: [],
    },
    {
      name: 'Prof. Sneha Kulkarni',
      email: 'faculty@pccoe.org',
      role: 'FACULTY' as const,
      department: compDept._id,
      approvalStatus: 'APPROVED' as const,
      employeeId: 'EMP-FAC-001',
      assignedLabs: [],
    },
    {
      name: 'Dr. Amit Joshi (Pending Approval)',
      email: 'pending_faculty@pccoe.org',
      role: 'FACULTY' as const,
      department: itDept._id,
      approvalStatus: 'PENDING_APPROVAL' as const,
      employeeId: 'EMP-FAC-002',
      assignedLabs: [],
    },
    {
      name: 'Alumni Vikram Rao',
      email: 'alumni@pccoe.org',
      role: 'STUDENT' as const,
      department: compDept._id,
      approvalStatus: 'APPROVED' as const,
      prn: 'PRN87654321',
      assignedLabs: [],
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const u of usersData) {
    let user = await User.findOne({ email: u.email });
    if (!user) {
      user = await User.create({
        ...u,
        isActive: true,
      });
      console.log(`Created user: ${u.email} (${u.role})`);
    } else {
      user.role = u.role;
      user.name = u.name;
      user.department = u.department;
      user.approvalStatus = u.approvalStatus;
      if (u.prn) user.prn = u.prn;
      if (u.employeeId) user.employeeId = u.employeeId;
      await user.save();
    }
    seededUsers[u.email] = user;
  }

  // Link HOD and Authority to Department
  compDept.hod = seededUsers['hod@pccoe.org']._id;
  compDept.authorities = [seededUsers['authority@pccoe.org']._id];
  await compDept.save();

  // Create pending deactivation request for Alumni user if not exists
  const existingDeact = await DeactivationRequest.findOne({ user: seededUsers['alumni@pccoe.org']._id });
  if (!existingDeact) {
    await DeactivationRequest.create({
      user: seededUsers['alumni@pccoe.org']._id,
      reason: 'Graduated in 2026, no longer requires campus portal access',
      status: 'PENDING',
    });
    console.log('Created pending DeactivationRequest for alumni@pccoe.org');
  }

  // 3. Laboratories
  // Lab 1: Has assistant ( Sharma ) and computers
  let lab101 = await Laboratory.findOne({ code: 'LAB-101' });
  if (!lab101) {
    lab101 = await Laboratory.create({
      name: 'Advanced Computing Laboratory',
      code: 'LAB-101',
      labCode: nanoid(10),
      building: 'IT Building 1st Floor (Room 101)',
      department: compDept._id,
      assistants: [seededUsers['assistant@pccoe.org']._id],
      isActive: true,
    });
    console.log(`Created Laboratory: LAB-101 (labCode: ${lab101.labCode})`);
  } else {
    if (!lab101.labCode) {
      lab101.labCode = nanoid(10);
    }
    lab101.assistants = [seededUsers['assistant@pccoe.org']._id];
    await lab101.save();
  }

  // Update assistant's assigned labs
  seededUsers['assistant@pccoe.org'].assignedLabs = [lab101._id];
  await seededUsers['assistant@pccoe.org'].save();

  // Lab 2: Has NO assistants (triggers dashboard warning "labs without an assistant")
  let lab102 = await Laboratory.findOne({ code: 'LAB-102' });
  if (!lab102) {
    lab102 = await Laboratory.create({
      name: 'Network & Cloud Security Laboratory',
      code: 'LAB-102',
      labCode: nanoid(10),
      building: 'IT Building 1st Floor (Room 102)',
      department: compDept._id,
      assistants: [],
      isActive: true,
    });
    console.log(`Created Laboratory: LAB-102 without assistants (labCode: ${lab102.labCode})`);
  } else {
    if (!lab102.labCode) {
      lab102.labCode = nanoid(10);
      await lab102.save();
    }
  }

  // Lab 3: Project Lab with NO computers (triggers dashboard warning "labs with no computers")
  let lab103 = await Laboratory.findOne({ code: 'LAB-103' });
  if (!lab103) {
    lab103 = await Laboratory.create({
      name: 'Project & Innovation Laboratory',
      code: 'LAB-103',
      labCode: nanoid(10),
      building: 'IT Building 2nd Floor (Room 201)',
      department: itDept._id,
      assistants: [seededUsers['assistant@pccoe.org']._id],
      isActive: true,
    });
    console.log(`Created Laboratory: LAB-103 without computers (labCode: ${lab103.labCode})`);
  } else {
    if (!lab103.labCode) {
      lab103.labCode = nanoid(10);
      await lab103.save();
    }
  }

  // 4. Computers
  // In LAB-101: 10 computers, all with active warranty
  const purchaseDate = new Date('2023-08-15');
  const validWarranty = new Date('2026-08-15');
  const expiredWarranty = new Date('2023-01-10');

  for (let i = 1; i <= 10; i++) {
    const pad = String(i).padStart(2, '0');
    const assetTag101 = `COMP-L101-PC${pad}`;
    const existing101 = await Computer.findOne({ assetTag: assetTag101 });
    if (!existing101) {
      await Computer.create({
        assetTag: assetTag101,
        lab: lab101._id,
        label: `PC-${pad}`,
        processor: 'Intel Core i7-12700',
        ram: '16 GB DDR4',
        storage: '512 GB NVMe SSD',
        purchaseDate,
        warrantyExpiry: validWarranty,
        vendor: 'Dell India Pvt Ltd',
        status: 'ACTIVE',
        isActive: true,
        notes: 'Standard high-performance development workstation',
      });
    }
  }

  // In LAB-102: 8 active computers, 2 with expired warranty (triggers dashboard warning "computers with expired warranty")
  for (let i = 1; i <= 10; i++) {
    const pad = String(i).padStart(2, '0');
    const assetTag102 = `COMP-L102-PC${pad}`;
    const existing102 = await Computer.findOne({ assetTag: assetTag102 });
    const isExpired = i >= 9;

    if (!existing102) {
      await Computer.create({
        assetTag: assetTag102,
        lab: lab102._id,
        label: `PC-${pad}`,
        processor: 'Intel Core i5-11400',
        ram: '16 GB DDR4',
        storage: '512 GB SSD',
        purchaseDate: isExpired ? new Date('2020-01-10') : purchaseDate,
        warrantyExpiry: isExpired ? expiredWarranty : validWarranty,
        vendor: 'HP Enterprise',
        status: isExpired ? 'UNDER_MAINTENANCE' : 'ACTIVE',
        isActive: true,
        notes: isExpired ? 'Warranty expired, awaiting AMC contract renewal' : 'Network simulation node',
      });
    }
  }

  // 5. System Settings
  const defaultSettings = [
    { key: 'escalation_timeout_hours', value: 24, description: 'Default SLA timeout before tickets auto-escalate' },
    { key: 'low_stock_default_threshold', value: 5, description: 'Inventory threshold below which components trigger warning' },
  ];

  for (const s of defaultSettings) {
    const existingSetting = await Setting.findOne({ key: s.key });
    if (!existingSetting) {
      await Setting.create(s);
      console.log(`Created default setting: ${s.key} = ${s.value}`);
    }
  }

  console.log('Successfully seeded Admin Module demo data:');
  console.log('- 2 Departments (COMP, IT) with HOD and Authorities');
  console.log('- 3 Laboratories (with random 10-char labCode, 1 without assistant, 1 empty without computers)');
  console.log('- 20 Computers (including 2 with expired warranties)');
  console.log('- 8 Users (including pending faculty approval and pending account deactivation request)');
  console.log('- Default system settings (escalation_timeout_hours, low_stock_default_threshold)');
};

// Run script if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

