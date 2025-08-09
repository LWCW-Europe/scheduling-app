import { test, expect } from "@playwright/test";

test.describe("Basic Sanity Checks", () => {
  test("homepage loads and shows multiple events", async ({ page }) => {
    await page.goto("/");

    // Input the password 'testtest'
    await page.fill('input[name="password"]', "testtest");
    // submit the form
    await page.click('button[type="submit"]');

    // Should show all three test events
    await expect(page.getByText("Conference Alpha")).toBeVisible();
    await expect(page.getByText("Conference Beta")).toBeVisible();
    await expect(page.getByText("Conference Gamma")).toBeVisible();

    // Should show phase descriptions
    await expect(
      page.getByText("Event currently in proposal phase")
    ).toBeVisible();
    await expect(
      page.getByText("Event currently in voting phase")
    ).toBeVisible();
    await expect(
      page.getByText("Event currently in scheduling phase")
    ).toBeVisible();
  });

  test("can navigate to Alpha event (proposal phase)", async ({ page }) => {
    await page.goto("/");

    // Input the password 'testtest'
    await page.fill('input[name="password"]', "testtest");
    // submit the form
    await page.click('button[type="submit"]');

    await page
      .locator("text=Conference Alpha")
      .locator("..")
      .getByRole("link", { name: "View Schedule" })
      .click();

    await expect(
      page.getByText(/Conference Alpha: Session Proposals/)
    ).toBeVisible();
    await expect(
      page
        .getByText("Conference Alpha Lightning Talks: Community Showcase")
        .locator("visible=true")
    ).toBeVisible();
  });

  test("can navigate to Beta event (voting phase)", async ({ page }) => {
    await page.goto("/");

    // Input the password 'testtest'
    await page.fill('input[name="password"]', "testtest");
    // submit the form
    await page.click('button[type="submit"]');

    await page
      .locator("text=Conference Beta")
      .locator("..")
      .getByRole("link", { name: "View Schedule" })
      .click();

    await expect(
      page.getByText(/Conference Beta: Session Proposals/)
    ).toBeVisible();
    await expect(
      page
        .getByText("Conference Beta Lightning Talks: Community Showcase")
        .locator("visible=true")
    ).toBeVisible();
  });

  test("can navigate to Gamma event (scheduling phase)", async ({ page }) => {
    await page.goto("/");

    // Input the password 'testtest'
    await page.fill('input[name="password"]', "testtest");
    // submit the form
    await page.click('button[type="submit"]');

    await page
      .locator("text=Conference Gamma")
      .locator("..")
      .getByRole("link", { name: "View Schedule" })
      .click();

    await expect(page.getByText(/Conference Gamma Schedule/)).toBeVisible();
    await expect(
      page.getByText("Opening Keynote - Conference Gamma")
    ).toBeVisible();
  });
});
