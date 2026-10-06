import path from 'path';
import dotenv from 'dotenv';

// Load server .env
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

import mongoose from 'mongoose';
import { Department } from '../server/src/modules/departments/department.model';
import { Laboratory } from '../server/src/modules/laboratories/laboratory.model';
import { Computer } from '../server/src/modules/computers/computer.model';
import { User } from '../server/src/modules/auth/auth.model';

export const seedDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixify';
  console.log(`Connecting to MongoDB for seeding at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  console.log('Seeding Phase 2 Initial Domain Data...');

  // 1. Department
  let compDept = await Department.findOne({ code: 'COMP' });
  if (!compDept) {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
      isActive: true,
    });
    console.log('Created Department: Computer Engineering (COMP)');
  }

  // 2. Users for all 5 roles
  const usersData = [
    {
      name: 'System Administrator',
      email: 'admin@pccoe.org',
      role: 'ADMIN' as const,
      department: compDept._id,
      assignedLabs: [],
    },
    {
      name: 'Lab Assistant Sharma',
      email: 'assistant@pccoe.org',
      role: 'LAB_ASSISTANT' as const,
      department: compDept._id,
      assignedLabs: [],
    },
    {
      name: 'Dept Authority Patil',
      email: 'authority@pccoe.org',
      role: 'DEPT_AUTHORITY' as const,
      department: compDept._id,
      assignedLabs: [],
    },
    {
      name: 'HOD Computer Engg',
      email: 'hod@pccoe.org',
      role: 'HOD' as const,
      department: compDept._id,
      assignedLabs: [],
    },
    {
      name: 'Rahul Deshmukh (Student)',
      email: 'student@pccoe.org',
      role: 'STUDENT' as const,
      department: compDept._id,
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
      await user.save();
    }
    seededUsers[u.role] = user;
  }

  // Link HOD and Authority to Department
  compDept.hod = seededUsers['HOD']._id;
  compDept.authorities = [seededUsers['DEPT_AUTHORITY']._id];
  await compDept.save();

  // 3. Laboratories
  let lab101 = await Laboratory.findOne({ code: 'LAB-101' });
  if (!lab101) {
    lab101 = await Laboratory.create({
      name: 'Advanced Computing Laboratory',
      code: 'LAB-101',
      building: 'IT Building 1st Floor (Room 101)',
      department: compDept._id,
      assistants: [seededUsers['LAB_ASSISTANT']._id],
      isActive: true,
    });
    console.log('Created Laboratory: LAB-101');
  } else {
    lab101.assistants = [seededUsers['LAB_ASSISTANT']._id];
    await lab101.save();
  }

  // Update assistant's assigned labs
  seededUsers['LAB_ASSISTANT'].assignedLabs = [lab101._id];
  await seededUsers['LAB_ASSISTANT'].save();

  let lab102 = await Laboratory.findOne({ code: 'LAB-102' });
  if (!lab102) {
    lab102 = await Laboratory.create({
      name: 'Network & Cloud Security Laboratory',
      code: 'LAB-102',
      building: 'IT Building 1st Floor (Room 102)',
      department: compDept._id,
      assistants: [],
      isActive: true,
    });
    console.log('Created Laboratory: LAB-102');
  }

  // 4. Computers (~10 per lab)
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
        status: 'OPERATIONAL',
        isActive: true,
      });
    }

    const assetTag102 = `COMP-L102-PC${pad}`;
    const existing102 = await Computer.findOne({ assetTag: assetTag102 });
    if (!existing102) {
      await Computer.create({
        assetTag: assetTag102,
        lab: lab102._id,
        label: `PC-${pad}`,
        processor: 'Intel Core i5-11400',
        ram: '16 GB DDR4',
        storage: '512 GB SSD',
        status: 'OPERATIONAL',
        isActive: true,
      });
    }
  }

  console.log('Successfully seeded 1 Department, 2 Laboratories, 20 Computers, and 5 Seeded Users!');
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
