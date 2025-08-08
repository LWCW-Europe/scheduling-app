import { test, expect } from "@playwright/test";

test("should auto-focus the title input for new proposals", async ({
  page,
}) => {
  await page.goto("/");
  await page.fill('input[name="password"]', "testtest");
  await page.click('button[type="submit"]');

  await expect(page.getByText("Conference Alpha")).toBeVisible();

  await page.goto("/Conference-Alpha/proposals/new");
  const focusedElement = await page.evaluateHandle(
    () => document.activeElement
  );
  const placeholder = await page.evaluate(
    (el) => el?.getAttribute("placeholder"),
    focusedElement
  );
  expect(placeholder).toBe("Enter a clear, descriptive title");
});
