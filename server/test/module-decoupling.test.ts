import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('SRS 6.3 Module Decoupling Static Verification', () => {
  const serverSrcDir = path.resolve(__dirname, '../src');

  const checkImports = (dirPath: string, forbiddenPatterns: string[]) => {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        checkImports(fullPath, forbiddenPatterns);
      } else if (file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        for (const pattern of forbiddenPatterns) {
          const regex = new RegExp(`from\\s+['"].*${pattern}.*['"]`, 'g');
          const matches = content.match(regex);
          expect(
            matches,
            `File ${file} in decoupled module illegally imports from ${pattern}: ${matches?.join(', ')}`
          ).toBeNull();
        }
      }
    }
  };

  it('verifies src/modules/auth has zero imports from other domain modules', () => {
    const authDir = path.join(serverSrcDir, 'modules/auth');
    const forbidden = [
      'departments',
      'laboratories',
      'computers',
      'tickets',
      'escalations',
      'inventory',
      'analytics',
      'settings',
    ];
    checkImports(authDir, forbidden);
  });

  it('verifies src/modules/qr has zero imports from domain modules or auth', () => {
    const qrDir = path.join(serverSrcDir, 'modules/qr');
    const forbidden = [
      'auth',
      'users',
      'departments',
      'laboratories',
      'computers',
      'tickets',
      'escalations',
      'inventory',
      'analytics',
      'settings',
    ];
    checkImports(qrDir, forbidden);
  });
});
