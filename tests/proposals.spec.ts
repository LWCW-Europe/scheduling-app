import { test, expect } from "@playwright/test";
import { loginAndGoto, login } from "./helpers/auth";

test("should auto-focus the title input for new proposals", async ({
  page,
}) => {
  await loginAndGoto(page, "/Conference-Alpha/proposals/new");
  await expect(page.getByLabel("Title")).toBeFocused();
});

test("should create a new session proposal, edit it, and add hosts", async ({
  page,
}) => {
  await login(page);

  // Go to proposals list first (optional, helps ensure baseline loaded)
  await page.goto("/Conference-Alpha/proposals");
  // Generate a unique title to avoid collisions between runs
  const proposalTitle = `Playwright Test Proposal ${Date.now()}`;
  await expect(page.getByText(proposalTitle).first()).toHaveCount(0); // ensure not present

  await page
    .getByRole("link", { name: /Add Proposal/i })
    .click({ timeout: 5000 });
  await expect(
    page.getByRole("heading", { name: /Add Session Proposal/i })
  ).toBeVisible();

  // Fill form
  await page.getByLabel("Title").fill(proposalTitle);
  await page
    .getByLabel("Description")
    .fill("This is a test proposal created by an automated Playwright test.");
  // (Optional) select a duration, not required
  const durationRadio = page.locator("#duration-60");
  if (await durationRadio.count()) {
    await durationRadio.check();
  }

  // Submit
  await Promise.all([
    page.waitForURL(/\/Conference-Alpha\/proposals$/),
    page.click('button[type="submit"]'),
  ]);

  // Assert new proposal appears in list (may need slight waiting for Airtable consistency)
  // Narrow selector to the desktop table to avoid also matching the hidden mobile card version
  await expect(
    page.getByRole("row", { name: new RegExp(proposalTitle) })
  ).toBeVisible();

  // Click the edit button directly (rather than clicking the row to navigate first)
  const proposalRow = page.getByRole("row", {
    name: new RegExp(proposalTitle),
  });
  await proposalRow.getByRole("button", { name: /Edit/i }).click();
  await expect(
    page.getByRole("heading", { name: /Edit Session Proposal/i })
  ).toBeVisible();

  // Find and click the hosts combobox to open it
  // Look for the Host(s) section and find the main combobox button (not nested buttons)
  const hostsSection = page
    .locator("div")
    .filter({ hasText: /^Host\(s\)/ })
    .first();
  const comboboxButton = hostsSection.getByRole("button").first(); // Get the first (main) button

  // Click to open the combobox dropdown
  await comboboxButton.click();

  // Now the input should be focused and we can type directly
  await page.keyboard.type("Alice Test");
  await page.getByRole("option", { name: /Alice Test/i }).click();

  // Add second host - use the same reference to the main combobox button
  await comboboxButton.click();
  await page.keyboard.type("Bob Test");
  await page.getByRole("option", { name: /Bob Test/i }).click();

  // Submit the edited form
  await page.getByRole("button", { name: /Submit/i }).click();
  await page.waitForURL(/\/Conference-Alpha\/proposals$/);

  // Verify the hosts appear in the proposals list
  const updatedRow = page.getByRole("row", { name: new RegExp(proposalTitle) });
  await expect(updatedRow).toBeVisible();
  await expect(updatedRow).toContainText("Alice Test");
  await expect(updatedRow).toContainText("Bob Test");
});

test("should open proposal detail page when clicking on a proposal", async ({
  page,
}) => {
  await login(page);

  // Go to proposals list
  await page.goto("/Conference-Alpha/proposals");

  // Find any existing proposal in the table (should have some from test data)
  const firstProposalRow = page.getByRole("row").nth(1); // Skip header row
  await expect(firstProposalRow).toBeVisible();

  // Get the proposal title for verification
  const proposalTitleCell = firstProposalRow.locator("td").first();
  const proposalTitle = (await proposalTitleCell.textContent()) || "";
  expect(proposalTitle).toBeTruthy();

  await proposalTitleCell.click();

  // Verify the modal is open using the proper ARIA role
  const modal = page.getByRole("dialog");

  await expect(modal).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(1);

  // Verify the proposal title is displayed as a heading within the modal
  await expect(
    modal.getByRole("heading", { name: proposalTitle! })
  ).toBeVisible();

  const closeButton = modal.getByRole("button", { name: /close/i });
  await expect(closeButton).toBeVisible();

  // Test closing the modal by clicking the close button (real user behavior)
  await closeButton.click();

  // Verify the modal is closed by checking that the close button is no longer visible
  await expect(closeButton).not.toBeVisible();

  // Verify we're back on the proposals list page by checking URL
  await expect(page).toHaveURL(/\/Conference-Alpha\/proposals$/);

  // Test opening the modal again to verify it can be reopened
  await proposalTitleCell.click();
  await expect(modal).toBeVisible();

  // Test closing by clicking outside the modal content (common user behavior)
  // Click in an area that should be the backdrop
  await page.click("body", { position: { x: 50, y: 50 } });

  // Verify modal is closed again
  await expect(modal).not.toBeVisible();

  // Verify the proposal we viewed is still in the list
  await expect(
    page.getByRole("row", { name: new RegExp(proposalTitle!) })
  ).toBeVisible();
});
