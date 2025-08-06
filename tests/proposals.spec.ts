import { test, expect } from "@playwright/test";

test("should auto-focus the title input for new proposals", async ({ page }) => {
  await page.goto("/Test-Conference/proposals/new");
  const focusedElement = await page.evaluateHandle(() => document.activeElement);
  const placeholder = await focusedElement.getAttribute("placeholder");
  expect(placeholder).toBe("Enter a clear, descriptive title");
});
