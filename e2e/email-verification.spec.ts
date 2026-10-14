import { test, expect, Page } from '@playwright/test';

// Stub Firebase's HTTP transport: these tests never send real emails or create real accounts.
async function stubFirebase(page: Page, email: string, throttled: boolean) {
  const now = Math.floor(Date.now() / 1000);
  const uid = 'verification-test-user';
  const jwt = [
    { alg: 'RS256', typ: 'JWT' },
    { sub: uid, user_id: uid, email, email_verified: false, iat: now, exp: now + 3600, auth_time: now, aud: 'fixify-b90b0', iss: 'https://securetoken.google.com/fixify-b90b0', firebase: { sign_in_provider: 'password', identities: { email: [email] } } },
  ].map(part => Buffer.from(JSON.stringify(part)).toString('base64url')).join('.') + '.fixture-signature';
  const sends: Record<string, unknown>[] = [];
  let verified = false;
  await page.route('**/api/v1/**', route => route.fulfill({ status: route.request().url().includes('/auth/me') ? 401 : 200, json: { success: true, data: [] } }));
  await page.route('https://identitytoolkit.googleapis.com/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('accounts:signInWithPassword') || path.endsWith('accounts:signUp')) {
      await route.fulfill({ json: { localId: uid, email, idToken: jwt, refreshToken: 'fixture-refresh-token', expiresIn: '3600', registered: true } });
    } else if (path.endsWith('accounts:lookup')) {
      await route.fulfill({ json: { users: [{ localId: uid, email, emailVerified: verified, passwordHash: 'fixture-password-hash', providerUserInfo: [{ providerId: 'password', email, rawId: email }] }] } });
    } else if (path.endsWith('accounts:sendOobCode')) {
      sends.push(route.request().postDataJSON());
      await route.fulfill(throttled
        ? { status: 400, json: { error: { code: 400, message: 'TOO_MANY_ATTEMPTS_TRY_LATER' } } }
        : { json: { email } });
    } else {
      await route.fulfill({ status: 400, json: { error: { message: 'UNEXPECTED_TEST_REQUEST' } } });
    }
  });
  await page.route('https://securetoken.googleapis.com/**', route => {
    const parts = jwt.split('.');
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    parts[1] = Buffer.from(JSON.stringify({ ...claims, email_verified: verified })).toString('base64url');
    return route.fulfill({ json: { access_token: parts.join('.'), id_token: parts.join('.'), refresh_token: 'fixture-refresh-token', expires_in: '3600', user_id: uid, token_type: 'Bearer' } });
  });
  return Object.assign(sends, { verify: () => { verified = true; } });
}

async function signInFixture(page: Page, email: string) {
  await page.evaluate(async email => {
    // Vite serves the actual Firebase singleton used by the verification screen.
    const moduleUrl = '/src/lib/firebase.ts';
    const { auth, signInWithEmailAndPassword } = await import(/* @vite-ignore */ moduleUrl);
    await signInWithEmailAndPassword(auth, email, 'Fixture-password-123!');
  }, email);
}

test('Firebase throttling disables resend and persists after refresh', async ({ page }) => {
  const email = 'throttled@example.com';
  const sends = await stubFirebase(page, email, true);
  await page.goto(`/verify-email?email=${email}`);
  await signInFixture(page, email);
  await page.getByRole('button', { name: 'Send Verification Link', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Firebase is temporarily limiting verification emails');
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  await expect(page.getByRole('alert')).toContainText('Firebase is temporarily limiting');
  expect(sends).toHaveLength(1);
});

test('successful verification email returns to the current app and cannot be resent immediately', async ({ page }) => {
  const email = 'delivery@example.com';
  const sends = await stubFirebase(page, email, false);
  await page.goto(`/verify-email?email=${email}&redirect=${encodeURIComponent('/report?lab=LAB-5401')}`);
  await signInFixture(page, email);
  await page.getByRole('button', { name: 'Send Verification Link', exact: true }).click();
  await expect(page.getByText('A verification link has been sent. Check your inbox and spam folder.', { exact: true })).toBeVisible();
  expect(sends).toHaveLength(1);
  const returnUrl = new URL(sends[0].continueUrl as string);
  expect(returnUrl.origin).toBe('http://localhost:15175');
  expect(returnUrl.pathname).toBe('/verify-email');
  expect(returnUrl.searchParams.get('redirect')).toBe('/report?lab=LAB-5401');
  await page.reload();
  await expect(page.getByRole('button', { name: /Resend in/ })).toBeDisabled();
  expect(sends).toHaveLength(1);
});

test('signup keeps the pending profile when email delivery is throttled', async ({ page }) => {
  const email = 'signup@example.com';
  const sends = await stubFirebase(page, email, true);
  await page.goto('/signup');
  await page.locator('#signup-firstname').fill('Verification');
  await page.locator('#signup-lastname').fill('Student');
  await page.locator('#signup-email').fill(email);
  await page.locator('#signup-course').click();
  await page.getByRole('option', { name: 'B.Tech Computer Engineering', exact: true }).click();
  await page.locator('#signup-prn').fill('VERIFY1234');
  await page.locator('#signup-password').fill('Fixture-password-123!');
  await page.locator('#signup-confirmpassword').fill('Fixture-password-123!');
  await page.getByRole('button', { name: 'Create Account', exact: true }).click();
  await expect(page).toHaveURL(/\/verify-email\?/);
  await expect(page.getByRole('alert')).toContainText('Firebase is temporarily limiting');
  const pending = await page.evaluate(() => JSON.parse(sessionStorage.getItem('fixify_pending_profile') || 'null'));
  expect(pending.email).toBe(email);
  expect(pending.prn).toBe('VERIFY1234');
  expect(sends).toHaveLength(1);
});

test('returning from the email link completes verified sign-in automatically', async ({ page }) => {
  const email = 'returned@example.com';
  const fixture = await stubFirebase(page, email, false);
  let sessions = 0;
  await page.route('**/api/v1/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/session')) sessions++;
    if (path.endsWith('/auth/me') && sessions === 0) return route.fulfill({ status: 401, json: { success: false } });
    return route.fulfill({ json: { success: true, data: path.includes('/auth/') ? { user: { id: 'fixture-user', name: 'Verified Student', email, role: 'STUDENT', profileComplete: true, approvalStatus: 'APPROVED' } } : [] } });
  });
  await page.goto(`/verify-email?email=${email}`);
  await signInFixture(page, email);
  await expect(page.getByRole('button', { name: 'Check Verification & Continue' })).toBeEnabled();
  expect(sessions).toBe(0);
  fixture.verify();
  await page.waitForTimeout(5100); // Automatic checks are limited to once every five seconds.
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page).toHaveURL(/\/report$/);
  expect(sessions).toBe(1);
});

test('the check button never verifies an address without the email link', async ({ page }) => {
  const email = 'unverified@example.com';
  const fixture = await stubFirebase(page, email, false);
  let sessions = 0;
  page.on('request', request => { if (request.url().includes('/api/v1/auth/session')) sessions++; });
  await page.goto(`/verify-email?email=${email}`);
  await signInFixture(page, email);
  await page.getByRole('button', { name: 'Check Verification & Continue' }).click();
  await expect(page.getByRole('alert')).toContainText('Open the verification link inside the email first');
  expect(sessions).toBe(0);
  expect(fixture).toHaveLength(0);
});
