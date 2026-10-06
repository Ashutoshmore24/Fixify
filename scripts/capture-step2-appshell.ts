import { chromium } from '@playwright/test';
import path from 'path';

interface RoleConfig {
  role: string;
  name: string;
  defaultPath: string;
}

const roles: RoleConfig[] = [
  { role: 'student', name: 'Rahul Deshmukh', defaultPath: '/report?lab=LAB-101' },
  { role: 'assistant', name: 'Lab Assistant Sharma', defaultPath: '/assistant' },
  { role: 'authority', name: 'Dept Authority Patil', defaultPath: '/assistant' },
  { role: 'hod', name: 'HOD Computer Engg', defaultPath: '/assistant' },
  { role: 'admin', name: 'System Administrator', defaultPath: '/assistant' },
];

const viewports = [
  { name: '1280', width: 1280, height: 800, isMobile: false },
  { name: '768', width: 768, height: 1024, isMobile: false },
  { name: '360', width: 360, height: 740, isMobile: true },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });

  for (const r of roles) {
    console.log(`Capturing role: ${r.role} (${r.name})...`);

    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
      });

      const page = await context.newPage();

      // Go to login page with redirect target
      await page.goto(`http://localhost:5173/login?redirect=${encodeURIComponent(r.defaultPath)}`, { waitUntil: 'networkidle' });

      // Click the dev impersonation button for this role
      await page.click(`text="${r.name}"`);

      // Wait for navigation to destination
      await page.waitForURL(`**${r.defaultPath.split('?')[0]}**`, { timeout: 10000 });
      await page.waitForTimeout(600);

      const fileName = `step2-appshell-${r.role}-${vp.name}.png`;
      const filePath = path.join(process.cwd(), 'docs', 'ui', fileName);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`  -> Saved ${fileName}`);

      await context.close();
    }
  }

  await browser.close();
  console.log('All authenticated role screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error capturing step 2 screenshots:', err);
  process.exit(1);
});
