import { test, expect } from "@playwright/test";

const EMAIL = "e2e@focusos.test";
const PASSWORD = "FocusOS-e2e-2026!";

async function login(page) {
  await page.goto("/");
  const signIn = page.getByRole("button", { name: "Sign in" });
  await expect(signIn).toBeVisible({ timeout: 15000 });
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await signIn.click();
  await expect(page.getByRole("link", { name: "Pages", exact: true })).toBeVisible({ timeout: 15000 });
}

test.describe("FocusOS core regression", () => {
  test("dashboard renders the greeting, live clock, and primary navigation", async ({ page }) => {
    await login(page);

    await expect(page.getByText("Assalamualaikum warahmatullahi wabarakatuhu", { exact: true })).toBeVisible();
    await expect(page.locator("#main-content header").getByRole("heading")).toBeVisible();
    await expect(page.locator("#main-content header").getByText(/FOCUSOS/i)).toHaveCount(0);

    // The live clock is a Dashboard widget in the main content, not part of the greeting header.
    await expect(page.locator("#main-content").getByText(/^\d{2}:\d{2}:\d{2}$/).first()).toBeVisible();

    await expect(page.getByRole("button", { name: /customize dashboard/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Calendar", exact: true })).toBeVisible();
  });

  test("Pages can be created, configured with a capability, and opened", async ({ page }) => {
    await login(page);

    const pageName = "E2E Project " + Date.now();
    await page.getByRole("link", { name: "Pages", exact: true }).click();

    await page.getByPlaceholder("New Page name...").fill(pageName);
    await page.getByRole("button", { name: "Create Page" }).click();
    await expect(page.getByRole("heading", { name: `Page: ${pageName}` })).toBeVisible({ timeout: 15000 });

    const tasks = page.locator("label").filter({ hasText: /^Tasks/ }).getByRole("checkbox");
    await tasks.check();
    await page.getByRole("button", { name: "Save Page" }).click();
    await expect(page.getByRole("button", { name: /^(Page saved ✓|Saved)$/ })).toBeVisible({ timeout: 15000 });

    await page.getByRole("link", { name: "Open Page" }).click();
    await expect(page.getByRole("heading", { name: pageName, exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Tasks", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tasks", exact: true })).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/page/[^/]+/tasks$`));
  });

  test("a Page can show two independent Tasks views over the same records", async ({ page }) => {
    await login(page);

    const pageName = "E2E Tool Views " + Date.now();
    await page.getByRole("link", { name: "Pages", exact: true }).click();
    await page.getByPlaceholder("New Page name...").fill(pageName);
    await page.getByRole("button", { name: "Create Page" }).click();
    await expect(page.getByRole("heading", { name: `Page: ${pageName}` })).toBeVisible({ timeout: 15000 });

    await page.getByRole("combobox", { name: "Tool to add" }).selectOption("tasks");
    await page.getByRole("button", { name: "Add tool view" }).click();
    await page.getByRole("button", { name: "Add tool view" }).click();
    await expect(page.getByText("Placement 1")).toBeVisible();
    await expect(page.getByText("Placement 2")).toBeVisible();

    await page.getByRole("button", { name: "Save Page" }).click();
    await expect(page.getByRole("button", { name: /Saved/ })).toBeVisible({ timeout: 15000 });
    await page.getByRole("link", { name: "Open Page" }).click();
    await expect(page.getByRole("heading", { name: pageName, exact: true })).toBeVisible();

    await expect(page.getByPlaceholder("Task name")).toHaveCount(2);
    const taskName = "Shared View Task " + Date.now();
    await page.getByPlaceholder("Task name").nth(0).fill(taskName);
    await page.getByRole("button", { name: "Add task" }).nth(0).click();
    await expect(page.getByText(taskName, { exact: true })).toHaveCount(2, { timeout: 15000 });
  });

  test("standalone Tasks opens without a Page and saves an unassociated task", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: "Tools", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tools", exact: true })).toBeVisible();

    await page.getByRole("link", { name: /Tasks/ }).click();
    await expect(page).toHaveURL(/\/tools\/tasks$/);
    await expect(page.getByRole("heading", { name: "Tasks", exact: true })).toBeVisible();
    await expect(page.getByText(/Standalone view · records are shared with Page views/)).toBeVisible();

    const taskName = "Standalone E2E Task " + Date.now();
    await page.getByPlaceholder("Task name").fill(taskName);
    await page.getByRole("button", { name: "Add task" }).click();
    await expect(page.getByText(taskName, { exact: true })).toBeVisible({ timeout: 15000 });
  });

  test("global tool defaults persist and Page views override them independently", async ({ page }) => {
    await login(page);

    await page.getByRole("link", { name: "Tools", exact: true }).click();
    const defaults = page.locator('section[aria-label="Global tool defaults"]');
    const focusDefaults = defaults.locator(".card").filter({ hasText: "Focus Sessions" });
    await focusDefaults.getByLabel("Focus minutes").fill("40");
    await focusDefaults.getByLabel("Break minutes").fill("8");
    await focusDefaults.getByRole("button", { name: "Save defaults" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Global defaults saved." })).toBeVisible({ timeout: 15000 });

    await page.reload();
    await expect(defaults.getByLabel("Focus minutes")).toHaveValue("40");
    await page.getByRole("link", { name: /Focus Sessions/ }).click();
    await expect(page.getByLabel("Focus")).toHaveValue("40");
    await expect(page.getByLabel("Break")).toHaveValue("8");

    await page.getByRole("link", { name: "Pages", exact: true }).click();
    const pageName = "E2E Focus Override " + Date.now();
    await page.getByPlaceholder("New Page name...").fill(pageName);
    await page.getByRole("button", { name: "Create Page" }).click();
    await expect(page.getByRole("heading", { name: `Page: ${pageName}` })).toBeVisible({ timeout: 15000 });
    await page.getByRole("combobox", { name: "Tool to add" }).selectOption("focus");
    await page.getByRole("button", { name: "Add tool view" }).click();
    await page.getByLabel("Focus minutes").fill("50");
    await page.getByRole("button", { name: "Save Page" }).click();
    await expect(page.getByRole("button", { name: /Page saved/ })).toBeVisible({ timeout: 15000 });
    await page.getByRole("link", { name: "Open Page" }).click();
    await expect(page.getByRole("heading", { name: pageName, exact: true })).toBeVisible();
    await expect(page.getByLabel("Focus")).toHaveValue("50");
    await expect(page.getByLabel("Break")).toHaveValue("8");
  });

  test("personal time format persists after reload", async ({ page }) => {
    await login(page);
    await page.goto("/settings/configuration");
    await expect(page.getByRole("heading", { name: "Settings", exact: true })).toBeVisible();

    const timeFormat = page.locator("label").filter({ hasText: /^Time format/ }).getByRole("combobox");
    await timeFormat.selectOption("12h");
    await page.getByRole("button", { name: "Save personal settings" }).click();
    await expect(page.getByText("Saved ✓")).toBeVisible({ timeout: 15000 });

    await page.reload();
    await expect(page.locator("label").filter({ hasText: /^Time format/ }).getByRole("combobox")).toHaveValue("12h");
  });
});
