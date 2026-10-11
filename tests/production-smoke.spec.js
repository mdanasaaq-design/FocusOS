import { test, expect } from "@playwright/test";

const baseUrl = process.env.BASE_URL || "https://focusos-7cd08.web.app";

test("production homepage responds and renders visible content", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));

  const response = await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 45000 });

  expect(response, "The navigation should return an HTTP response").not.toBeNull();
  expect(response.status(), "The production homepage should return a successful status").toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();

  const bodyText = (await page.locator("body").innerText()).trim();
  expect(bodyText.length, "The page should render visible text content").toBeGreaterThan(0);
  expect(pageErrors, "The page should not throw uncaught JavaScript errors").toEqual([]);
});
