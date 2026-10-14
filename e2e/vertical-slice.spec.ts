import { test, expect, Page } from '@playwright/test';

const password = 'Fixture-password-123!';
async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL(/\/(report|assistant|admin)(\?|$)/);
}

test('student reports a complaint and assigned assistant closes it', async ({ page }) => {
  await page.goto('/report?lab=LAB-5401');
  await expect(page).toHaveURL(/login\?redirect=/);
  await login(page, 'student@pccoe.org');
  await page.goto('/report?lab=LAB-5401');
  await expect(page.getByRole('heading', { name: 'Web Development Lab', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Workstation available/ }).first().click();
  await page.getByRole('button', { name: /Hardware/ }).click();
  await page.locator('textarea').fill('Keyboard spacebar is physically broken and stuck');
  await page.locator('[data-testid="submit-complaint-btn"]:visible').click();
  await expect(page.getByText('Complaint Registered', {exact:true})).toBeVisible();
  const ticketId = (await page.locator('body').innerText()).match(/FIX-\d{4}-\d{6}/)?.[0];
  expect(ticketId).toBeTruthy();
  await page.context().clearCookies();
  await login(page, 'assistant@pccoe.org');
  await expect(page).toHaveURL(/\/assistant$/);
  await page.getByRole('button', {name:/Accept Ticket/}).click();
  await page.getByRole('button', {name:/Start Repair/}).click();
  await page.getByRole('button', {name:/Resolve & Close/}).click();
  await page.getByPlaceholder(/Detail the root cause/).fill('Replaced keyboard and verified all keys work correctly.');
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole('button', {name:'Close Ticket',exact:true}).click();
  await expect(page.getByText('CLOSED', {exact:true}).first()).toBeVisible();
  await page.context().clearCookies();
  await login(page, 'student@pccoe.org');
  await page.goto('/my-complaints');
  await expect(page.getByText(ticketId!, {exact:true})).toBeVisible();
  await expect(page.getByText('Closed', {exact:true}).first()).toBeVisible();
});

test('admin loads staff management after authentication', async ({page}) => {
  await login(page, 'admin@pccoe.org');
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto('/admin/provision-staff');
  await expect(page.getByText('Test Assistant', {exact:true})).toBeVisible();
});

test('student creates a local account and signs in', async ({page}) => {
  await page.goto('/signup');
  await page.locator('#signup-firstname').fill('New');
  await page.locator('#signup-lastname').fill('Student');
  await page.locator('#signup-email').fill('new.student@pccoe.org');
  await page.locator('#signup-course').click();
  await page.getByRole('option', {name: 'B.Tech Computer Engineering', exact: true}).click();
  await page.locator('#signup-prn').fill('E2E123456');
  await page.locator('#signup-password').fill(password);
  await page.locator('#signup-confirmpassword').fill(password);
  await page.getByRole('button', {name:'Create Account',exact:true}).click();
  await expect(page).toHaveURL(/\/login\?/);
  await login(page, 'new.student@pccoe.org');
  await expect(page).toHaveURL(/\/report$/);
});
