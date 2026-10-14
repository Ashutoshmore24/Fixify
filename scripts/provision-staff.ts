import path from 'path';
import dotenv from 'dotenv';
import { env } from '../server/src/common/config/env';
import { User } from '../server/src/modules/auth/auth.model';
import { Department } from '../server/src/modules/departments/department.model';
import { Laboratory } from '../server/src/modules/laboratories/laboratory.model';
import { Computer } from '../server/src/modules/computers/computer.model';
import { OFFICIAL_LAB_ROSTER } from '../server/src/modules/laboratories/lab-maps.config';
import { hashPassword } from '../server/src/modules/auth/password';
import { createOrUpdateFirebaseUser } from '../server/src/modules/auth/firebase-admin';

export async function provisionAllStaff(): Promise<void> {
  const credentials = dotenv.config({ path: path.resolve(__dirname, '../credentials.env') }).parsed || {};
  const staff = [
    { key: 'ADMIN', name: credentials.ADMIN_NAME || 'Administrator', email: credentials.ADMIN_EMAIL || env.ADMIN_EMAIL },
    ...Array.from(new Map(OFFICIAL_LAB_ROSTER.map(lab => [lab.assignedAssistantEmail, {
      key: lab.assignedAssistantEmail.split('@')[0]!.replace('.', '_').toUpperCase(),
      name: lab.assignedAssistantName, email: lab.assignedAssistantEmail,
    }])).values()),
  ];
  // Validate the complete credential set before making any changes.
  for (const member of staff) {
    if (!credentials[`${member.key}_PASSWORD`]) throw new Error(`Missing ${member.key}_PASSWORD in credentials.env`);
  }
  const department = await Department.findOneAndUpdate({ code: 'COMP' }, { $setOnInsert: { name: 'Computer Engineering', code: 'COMP', isActive: true } }, { upsert: true, new: true });
  for (const member of staff) {
    const email = credentials[`${member.key}_EMAIL`] || member.email;
    const password = credentials[`${member.key}_PASSWORD`]!;
    const authentication = env.AUTH_MODE === 'local'
      ? { passwordHash: await hashPassword(password) }
      : { firebaseUid: await createOrUpdateFirebaseUser({ email, password, displayName: member.name, emailVerified: true }) };
    await User.findOneAndUpdate({ email }, { $set: {
      name: member.name, email, role: member.key === 'ADMIN' ? 'ADMIN' : 'LAB_ASSISTANT',
      department: department._id, profileComplete: true, approvalStatus: 'APPROVED', ...authentication,
    }, $setOnInsert: { isActive: true } }, { upsert: true, new: true, runValidators: true });
  }
  for (const definition of OFFICIAL_LAB_ROSTER) {
    const assistantKey = definition.assignedAssistantEmail.split('@')[0]!.replace('.', '_').toUpperCase();
    const assistant = await User.findOne({ email: credentials[`${assistantKey}_EMAIL`] || definition.assignedAssistantEmail });
    if (!assistant) throw new Error(`Assistant unavailable for ${definition.code}`);
    const lab = await Laboratory.findOneAndUpdate({ code: definition.code }, {
      $setOnInsert: { name: definition.roomName, code: definition.code, roomNumber: definition.roomNumber,
        building: 'Computer Engineering Building', department: department._id, hasMap: definition.hasMap,
        mapImage: definition.imagePath || '', isActive: true },
      $addToSet: { assistants: assistant._id },
    }, { upsert: true, new: true, runValidators: true });
    await User.updateOne({ _id: assistant._id }, { $addToSet: { assignedLabs: lab._id } });
    const computers = Array.from({ length: definition.totalWorkstations }, (_, index) => {
      const label = `PC-${String(index + 1).padStart(2, '0')}`;
      const assetTag = `${definition.code}-${label}`;
      return { updateOne: { filter: { assetTag }, update: { $setOnInsert: { assetTag, label, lab: lab._id, status: 'ACTIVE', isActive: true, notes: 'Seeded workstation; verify hardware specifications before operational use.' } }, upsert: true } };
    });
    await Computer.bulkWrite(computers);
    console.log(`Ready: ${definition.code} (${definition.totalWorkstations} workstations)`);
  }
  console.log(`Provisioned ${staff.length} staff accounts in ${env.AUTH_MODE} mode.`);
}
