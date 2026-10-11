import { test, expect } from "@playwright/test";

const baseUrl = process.env.BASE_URL || "https://focusos-7cd08.web.app";

test("production homepage responds and renders the FocusOS application", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", request => {
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText || "unknown request failure",
    });
  });
  page.on("response", response => {
    if (response.status() >= 400) {
      badResponses.push({ status: response.status(), url: response.url() });
    }
  });

  const response = await page.goto(baseUrl, {
    waitUntil: "domcontentloaded",
    timeout: 45_000,
  });

  expect(response, "Navigation should return an HTTP response").not.toBeNull();
  expect(response.status(), "Production homepage should return a successful status").toBeLessThan(400);
  await expect(page.locator("body")).toBeVisible();

  await expect(page.locator("#root > *").first()).toBeAttached({ timeout: 15_000 });

  const startupError = page.getByRole("heading", { name: "FocusOS could not start." });
  if (await startupError.count()) {
    const diagnostics = {
      url: page.url(),
      title: await page.title().catch(() => ""),
      rootText: (await page.locator("#root").innerText().catch(() => "")).slice(0, 1000),
      pageErrors,
      consoleErrors,
      failedRequests,
      badResponses,
    };
    throw new Error(`FocusOS startup failed. Browser diagnostics: ${JSON.stringify(diagnostics, null, 2)}`);
  }

  const readyUi = page.getByRole("button", { name: "Sign in" })
    .or(page.getByRole("link", { name: "Pages", exact: true }))
    .first();
  await expect(readyUi, "The page should render either the sign-in screen or authenticated navigation").toBeVisible({ timeout: 15_000 });

  expect(pageErrors, "The page should not throw uncaught JavaScript errors").toEqual([]);
});
