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

  try {
    await page.locator("#root > *").first().waitFor({ state: "attached", timeout: 15_000 });
  } catch {
    const diagnostics = {
      url: page.url(),
      title: await page.title().catch(() => ""),
      rootHtml: await page.locator("#root").innerHTML().catch(() => ""),
      bodyText: (await page.locator("body").innerText().catch(() => "")).slice(0, 1000),
      pageErrors,
      consoleErrors,
      failedRequests,
      badResponses,
    };
    throw new Error(`FocusOS did not mount into #root. Browser diagnostics: ${JSON.stringify(diagnostics, null, 2)}`);
  }

  await expect(page.locator("#root")).not.toBeEmpty();
  const bodyText = (await page.locator("body").innerText()).trim();
  expect(bodyText.length, "FocusOS should render visible content").toBeGreaterThan(0);
  expect(pageErrors, "The page should not throw uncaught JavaScript errors").toEqual([]);
});
