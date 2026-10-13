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
import { OFFICIAL_LAB_ROSTER } from '../server/src/modules/laboratories/lab-maps.config';
import { provisionAllStaff, STAFF_ROSTER } from './provision-staff';

export const seedDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fixify';
  console.log(`Connecting to MongoDB for seeding at: ${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }

  console.log('Seeding Official Production Staff, Real Accounts & Laboratories...');

  // 1. Run real staff provisioning pipeline (creates/syncs Firebase Auth + MongoDB + 12 Labs)
  await provisionAllStaff();

  // 2. Departments verification
  let compDept = await Department.findOne({ code: 'COMP' });
  if (!compDept) {
    compDept = await Department.create({
      name: 'Computer Engineering',
      code: 'COMP',
      isActive: true,
    });
  }

  let itDept = await Department.findOne({ code: 'IT' });
  if (!itDept) {
    itDept = await Department.create({
      name: 'Information Technology',
      code: 'IT',
      isActive: true,
    });
  }

  // 3. System Settings
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

  console.log('\nDatabase seeding finished successfully!');
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
