import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/win11/.gemini/antigravity-ide/brain/26bea800-86d8-4654-a1ad-dc845cf1791b';
const DOCS_UI_DIR = path.join(process.cwd(), 'docs', 'ui');

if (!fs.existsSync(DOCS_UI_DIR)) {
  fs.mkdirSync(DOCS_UI_DIR, { recursive: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });

  // 1. Login at 360px
  const loginMobile = await browser.newPage({
    viewport: { width: 360, height: 800 },
    isMobile: true,
  });
  await loginMobile.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await loginMobile.screenshot({
    path: path.join(ARTIFACT_DIR, 'login-360px.png'),
    fullPage: true,
  });
  await loginMobile.screenshot({
    path: path.join(DOCS_UI_DIR, 'login-360px.png'),
    fullPage: true,
  });
  console.log('Captured login-360px.png');
  await loginMobile.close();

  // 2. Login at 1280px
  const loginDesktop = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await loginDesktop.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await loginDesktop.screenshot({
    path: path.join(ARTIFACT_DIR, 'login-1280px.png'),
    fullPage: true,
  });
  await loginDesktop.screenshot({
    path: path.join(DOCS_UI_DIR, 'login-1280px.png'),
    fullPage: true,
  });
  console.log('Captured login-1280px.png');
  await loginDesktop.close();

  // 3. Signup at 360px
  const signupMobile = await browser.newPage({
    viewport: { width: 360, height: 900 },
    isMobile: true,
  });
  await signupMobile.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
  await signupMobile.screenshot({
    path: path.join(ARTIFACT_DIR, 'signup-360px.png'),
    fullPage: true,
  });
  await signupMobile.screenshot({
    path: path.join(DOCS_UI_DIR, 'signup-360px.png'),
    fullPage: true,
  });
  console.log('Captured signup-360px.png');
  await signupMobile.close();

  // 4. Signup at 1280px
  const signupDesktop = await browser.newPage({
    viewport: { width: 1280, height: 950 },
  });
  await signupDesktop.goto('http://localhost:5173/signup', { waitUntil: 'networkidle' });
  await signupDesktop.screenshot({
    path: path.join(ARTIFACT_DIR, 'signup-1280px.png'),
    fullPage: true,
  });
  await signupDesktop.screenshot({
    path: path.join(DOCS_UI_DIR, 'signup-1280px.png'),
    fullPage: true,
  });
  console.log('Captured signup-1280px.png');
  await signupDesktop.close();

  await browser.close();
  console.log('Screenshots completed successfully!');
}

capture().catch((err) => {
  console.error('Failed to capture screenshots:', err);
  process.exit(1);
});
