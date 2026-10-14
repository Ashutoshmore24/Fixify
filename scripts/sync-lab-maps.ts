import path from 'path';
import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { Laboratory } from '../server/src/modules/laboratories/laboratory.model';
import { Computer } from '../server/src/modules/computers/computer.model';
import { OFFICIAL_LAB_ROSTER } from '../server/src/modules/laboratories/lab-maps.config';

const localConfiguration = dotenv.config({ path: path.resolve(__dirname, '../server/.env') }).parsed;

// Update map metadata and insert missing PCs without changing accounts, tickets,
// assignments, existing hardware records, or retired/deleted workstations.
async function main() {
  const requestedRooms = process.argv.slice(2);
  if (!requestedRooms.length) throw new Error('Provide room numbers to sync.');
  const definitions = requestedRooms.map(room => {
    const definition = OFFICIAL_LAB_ROSTER.find(lab => lab.roomNumber === room);
    if (!definition?.hasMap) throw new Error(`No blueprint configured for ${room}`);
    return definition;
  });
  const mongoUri = localConfiguration?.MONGODB_URI || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI is required.');
  const dnsServers = localConfiguration?.DNS_SERVERS || process.env.DNS_SERVERS;
  if (dnsServers) dns.setServers(dnsServers.split(',').map(server => server.trim()).filter(Boolean));
  await mongoose.connect(mongoUri);
  try {
    for (const definition of definitions) {
      const lab = await Laboratory.findOne({ code: definition.code });
      if (!lab) throw new Error(`Laboratory ${definition.code} is missing.`);
      await Laboratory.updateOne({ _id: lab._id }, { $set: {
        hasMap: true, mapImage: definition.imagePath, roomNumber: definition.roomNumber,
      } });
      const result = await Computer.bulkWrite(Array.from({ length: definition.totalWorkstations }, (_, index) => {
        const label = `PC-${String(index + 1).padStart(2, '0')}`;
        const assetTag = `${definition.code}-${label}`;
        return { updateOne: { filter: { lab: lab._id, label }, update: { $setOnInsert: {
          assetTag, label, lab: lab._id, status: 'ACTIVE', isActive: true,
          notes: 'Added from laboratory blueprint; verify hardware specifications before operational use.',
        } }, upsert: true } };
      }));
      console.log(`${definition.code}: map ready, ${definition.totalWorkstations} positions, ${result.upsertedCount} PCs added.`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(error => {
  // Do not print connection strings or credentials in database error messages.
  console.error(`Lab map sync failed (${error.name}, code ${error.code ?? 'unknown'}).`);
  process.exitCode = 1;
});
