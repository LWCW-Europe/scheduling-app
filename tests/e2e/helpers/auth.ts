import { expect, Page } from "@playwright/test";

const DEFAULT_PASSWORD = process.env.TEST_PASSWORD || "testtest";

export async function login(page: Page, password: string = DEFAULT_PASSWORD) {
  if (!(await page.locator('input[name="password"]').first().isVisible())) {
    await page.goto("/");
  }
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page.getByText("Conference Alpha")).toBeVisible();
}

export async function loginAndGoto(page: Page, path: string) {
  await login(page);
  await page.goto(path);
}
