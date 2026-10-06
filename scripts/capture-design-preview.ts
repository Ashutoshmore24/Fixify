import { chromium } from '@playwright/test';
import path from 'path';

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Light (1280x800)
  const desktopPage = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await desktopPage.goto('http://localhost:5173/design', { waitUntil: 'networkidle' });
  await desktopPage.screenshot({
    path: path.join(process.cwd(), 'docs', 'ui', 'step1-design-desktop-light.png'),
    fullPage: true,
  });
  console.log('Saved step1-design-desktop-light.png');

  // Toggle Dark Mode on Desktop
  await desktopPage.click('button[aria-label="Toggle theme"]');
  await desktopPage.waitForTimeout(300);
  await desktopPage.screenshot({
    path: path.join(process.cwd(), 'docs', 'ui', 'step1-design-desktop-dark.png'),
    fullPage: true,
  });
  console.log('Saved step1-design-desktop-dark.png');
  await desktopPage.close();

  // 2. Mobile Light (360x780)
  const mobilePage = await browser.newPage({
    viewport: { width: 360, height: 780 },
    isMobile: true,
  });
  await mobilePage.goto('http://localhost:5173/design', { waitUntil: 'networkidle' });
  await mobilePage.screenshot({
    path: path.join(process.cwd(), 'docs', 'ui', 'step1-design-mobile-light.png'),
    fullPage: true,
  });
  console.log('Saved step1-design-mobile-light.png');
  await mobilePage.close();

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
