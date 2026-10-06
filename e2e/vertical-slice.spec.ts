import { test, expect } from '@playwright/test';

test.describe('Phase 2 Vertical Slice: Login → Report Complaint → Assistant Resolve & Close', () => {
  test('executes mobile-first complaint lifecycle with deep link preservation, BR-4, and BR-8', async ({ page }) => {
    // 1. Student accesses deep link via QR code scan: /report?lab=LAB-101
    await page.goto('/report?lab=LAB-101');

    // Verify unauthenticated redirection preserves deep link
    await expect(page).toHaveURL(/\/login\?redirect=%2Freport%3Flab%3DLAB-101/);

    // Verify SRS 6.2 Institutional Privacy Notice is prominently rendered
    await expect(page.locator('text=Institutional Privacy Notice (SRS 6.2)')).toBeVisible();

    // 2. Student signs in via Dev Impersonation
    await page.click('button:has-text("Rahul Deshmukh")');

    // Verify student is redirected to the preserved deep link /report?lab=LAB-101
    await expect(page).toHaveURL(/\/report\?lab=LAB-101/);
    await expect(page.locator('text=Advanced Computing Lab')).toBeVisible();

    // 3. Action 1: Select first available non-busy Computer
    const availablePc = page.locator('[data-testid^="pc-card-"]:not(:has-text("Busy"))').first();
    await expect(availablePc).toBeVisible({ timeout: 15000 });
    await availablePc.click();

    // Action 2: Select Category Hardware
    await page.click('button:has-text("Hardware")');

    // Action 3: Enter Description
    const descriptionInput = page.locator('textarea[placeholder*="Describe what\'s wrong"]');
    await descriptionInput.fill('Monitor display flickering and power button stuck during boot');

    // Action 4: Optional Photo Attachment
    await page.click('button:has-text("Attach")');
    await expect(page.locator('text=1/3 Photos')).toBeVisible();

    // Submit the complaint
    await page.click('[data-testid="submit-complaint-btn"]');

    // Verify success confirmation with sequential annual Ticket ID (REQ-1.8)
    await expect(page.locator('text=Complaint Registered')).toBeVisible();
    const ticketIdElement = page.locator('span:has-text("FIX-")');
    await expect(ticketIdElement).toBeVisible();
    const ticketId = (await ticketIdElement.textContent())?.trim() || '';
    expect(ticketId).toMatch(/^FIX-\d{4}-\d{6}$/);

    // 4. Student navigates to My Complaints
    await page.click('button:has-text("Track Status")');
    await expect(page).toHaveURL(/\/my-complaints/);
    await expect(page.locator(`text=${ticketId}`)).toBeVisible();

    // 5. Assistant signs in via dev login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const assistantBtn = page.locator('button:has-text("Lab Assistant Sharma")');
    await expect(assistantBtn).toBeVisible({ timeout: 10000 });
    await assistantBtn.click();
    await page.waitForTimeout(500);
    await page.goto('/assistant');

    // Verify assistant dashboard metrics and ticket presence
    await expect(page.locator('text=Lab Assistant Dashboard')).toBeVisible();
    const assistantTicketCard = page.locator(`div:has-text("${ticketId}")`).first();
    await expect(assistantTicketCard).toBeVisible();

    // Step A: Assistant accepts the ticket (ASSIGNED -> ACCEPTED)
    const acceptButton = page.locator('button:has-text("Accept Ticket")').first();
    await acceptButton.click();
    await expect(page.locator('button:has-text("Start Repair")').first()).toBeVisible();

    // Step B: Assistant starts repair (ACCEPTED -> IN_PROGRESS)
    const startRepairButton = page.locator('button:has-text("Start Repair")').first();
    await startRepairButton.click();
    await expect(page.locator('button:has-text("Resolve & Close (BR-8)")').first()).toBeVisible();

    // Step C: Assistant adds work note
    await page.click('button:has-text("Add Note")');
    await page.fill('textarea[placeholder*="work note"]', 'Replaced video display cable and cleaned power switch');
    await page.click('button:has-text("Add Note"):not([disabled])');

    // Step D: Assistant resolves & closes with BR-8 closure verification
    await page.click('button:has-text("Resolve & Close (BR-8)")');

    // Fill mandatory resolution notes and verify testedOk checkbox
    const resNotesInput = page.locator('textarea[placeholder*="Detail the root cause"]');
    await resNotesInput.fill('Replaced monitor cable, reseated power button assembly, and verified display boot.');

    const testedOkCheckbox = page.locator('input[type="checkbox"]');
    await testedOkCheckbox.check();

    // Submit closure
    await page.click('button:has-text("Close Ticket")');

    // Verify ticket is closed
    await expect(page.locator(`div:has-text("${ticketId}")`).first()).toContainText('CLOSED');

    // 6. Switch back to Student and verify closed status and timeline
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const studentBtn = page.locator('button:has-text("Rahul Deshmukh")');
    await expect(studentBtn).toBeVisible({ timeout: 10000 });
    await studentBtn.click();
    await page.waitForTimeout(500);
    await page.goto('/my-complaints');

    // Open ticket timeline
    await page.click(`text=${ticketId}`);
    await expect(page.locator('text=Resolved & Closed (BR-8 Verified)')).toBeVisible();
    await expect(page.locator('text=Replaced monitor cable')).toBeVisible();
  });
});
