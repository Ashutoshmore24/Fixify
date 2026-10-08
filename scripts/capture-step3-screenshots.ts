import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/win11/.gemini/antigravity-ide/brain/053452ce-b6c3-4244-9b91-05e83acdc1cd';
const DOCS_UI_DIR = path.join(process.cwd(), 'docs', 'ui');

if (!fs.existsSync(DOCS_UI_DIR)) {
  fs.mkdirSync(DOCS_UI_DIR, { recursive: true });
}
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: '360px', width: 360, height: 800, isMobile: true },
    { name: '1280px', width: 1280, height: 900, isMobile: false },
  ];

  // 1. Capture LOGIN (light and dark)
  for (const vp of viewports) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
      });

      await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('fixify_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('fixify_theme', 'light');
        }
      }, theme);
      await page.waitForTimeout(400);

      const fileName = `login-${vp.name}-${theme}.png`;
      await page.screenshot({ path: path.join(ARTIFACT_DIR, fileName), fullPage: true });
      await page.screenshot({ path: path.join(DOCS_UI_DIR, fileName), fullPage: true });
      console.log(`Captured ${fileName}`);
      await page.close();
    }
  }

  // 2. Capture SIGNUP (light and dark)
  for (const vp of viewports) {
    for (const theme of ['light', 'dark']) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
      });

      await page.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('fixify_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('fixify_theme', 'light');
        }
      }, theme);
      await page.waitForTimeout(400);

      const fileName = `signup-${vp.name}-${theme}.png`;
      await page.screenshot({ path: path.join(ARTIFACT_DIR, fileName), fullPage: true });
      await page.screenshot({ path: path.join(DOCS_UI_DIR, fileName), fullPage: true });
      console.log(`Captured ${fileName}`);
      await page.close();
    }
  }

  // 3. Capture REPORT COMPLAINT (light and dark)
  for (const vp of viewports) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
      });
      const page = await context.newPage();

      // Go to login with redirect to report lab 101
      await page.goto('http://localhost:5173/login?redirect=%2Freport%3Flab%3DLAB-101', {
        waitUntil: 'networkidle',
      });

      // Dev login as student Rahul Deshmukh
      const studentBtn = page.locator('button:has-text("Rahul Deshmukh")');
      if (await studentBtn.isVisible({ timeout: 5000 })) {
        await studentBtn.click();
      } else {
        // Expand accordion if needed
        await page.click('button:has-text("Developer Access")');
        await page.click('button:has-text("Rahul Deshmukh")');
      }

      await page.waitForURL(/\/report/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      // Set theme
      await page.evaluate((t) => {
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
          localStorage.setItem('fixify_theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('fixify_theme', 'light');
        }
      }, theme);
      await page.waitForTimeout(600);

      // Select first available PC to show interactive state
      const firstAvailablePc = page.locator('[data-testid^="pc-card-"]:not(:has-text("Busy"))').first();
      if (await firstAvailablePc.isVisible()) {
        await firstAvailablePc.click();
      }
      await page.waitForTimeout(300);

      const fileName = `report-${vp.name}-${theme}.png`;
      await page.screenshot({ path: path.join(ARTIFACT_DIR, fileName), fullPage: true });
      await page.screenshot({ path: path.join(DOCS_UI_DIR, fileName), fullPage: true });
      console.log(`Captured ${fileName}`);
      await context.close();
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
