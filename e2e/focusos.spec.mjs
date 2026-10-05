import { test, expect } from "@playwright/test";

const EMAIL = "e2e@focusos.test";
const PASSWORD = "FocusOS-e2e-2026!";

async function login(page) {
  await page.goto("/");
  if (await page.getByRole("button", { name: "Sign in" }).isVisible().catch(() => false)) {
    await page.getByLabel("Email").fill(EMAIL);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
  }
  const pagesLink = page.getByRole("link", { name: "Pages", exact: true });
  try {
    await expect(pagesLink).toBeVisible({ timeout: 15000 });
  } catch (error) {
    console.log("E2E URL:", page.url());
    console.log("E2E BODY:", (await page.locator("body").innerText()).slice(0, 4000));
    throw error;
  }
}

test.describe("FocusOS core regression", () => {
  test("dashboard keeps the core greeting/time contract", async ({ page }) => {
    await login(page);

    await expect(page.getByText("Assalamualaikum warahmatullahi wabarakatuhu", { exact: true })).toBeVisible();
    await expect(page.locator("header").getByRole("heading")).toBeVisible();
    await expect(page.locator("header").getByText(/FOCUSOS/i)).toHaveCount(0);

    const clock = page.locator("header").locator("span, p, div").filter({ hasText: /^\d{2}:\d{2}:\d{2}$/ }).first();
    await expect(clock).toBeVisible();

    await expect(page.getByRole("button", { name: /customize dashboard/i })).toHaveCount(0);
  });

  test("Pages, capabilities, nodes and configuration survive navigation", async ({ page }) => {
    await login(page);

    const pageName = "E2E Project " + Date.now();
    await page.getByRole("link", { name: "Pages", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Page Builder" })).toBeVisible();

    await page.getByPlaceholder("New Page name...").fill(pageName);
    await page.getByRole("button", { name: "Create Page" }).click();
    await expect(page.getByRole("heading", { name: "Configure Page" })).toBeVisible();

    const analytics = page.locator("label").filter({ hasText: /^Analytics/ }).getByRole("checkbox");
    await analytics.check();
    await expect(analytics).toBeChecked();
    const showChildren = page.locator("label").filter({ hasText: /Show child content/ }).getByRole("checkbox");
    await showChildren.check();
    await page.getByRole("button", { name: "Save Page" }).click();
    await expect(page.getByText("Page saved ✓")).toBeVisible();

    await page.getByRole("link", { name: "Open Page" }).click();
    await expect(page.getByRole("heading", { name: pageName })).toBeVisible();

    await page.getByLabel("New item name").fill("E2E Node");
    await page.getByLabel("New item name").press("Enter");
    await expect(page.getByText("E2E Node", { exact: true })).toBeVisible();
    await page.getByText("E2E Node", { exact: true }).click();

    await expect(page.getByRole("heading", { name: "E2E Node" })).toBeVisible();
    await page.getByRole("button", { name: "Identity" }).click();
    const tasks = page.locator("label").filter({ hasText: /^Tasks/ }).getByRole("checkbox");
    await tasks.check();
    await page.getByRole("button", { name: "Save identity" }).click();
    await expect(page.getByText("Node identity saved ✓")).toBeVisible();

    await page.getByRole("button", { name: "Configure page" }).click();
    await expect(page).toHaveURL(/\/pages\?edit=/);
    await expect(page.getByRole("heading", { name: "Configure Page" })).toBeVisible();

    await page.goto("/settings/configuration");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const timeFormat = page.locator("label").filter({ hasText: /^Time format/ }).getByRole("combobox");
    await timeFormat.selectOption("12h");
    await page.getByRole("button", { name: "Save personal settings" }).click();
    await expect(page.getByText("Saved ✓")).toBeVisible();

    await page.reload();
    await expect(page.locator("label").filter({ hasText: /^Time format/ }).getByRole("combobox")).toHaveValue("12h");

    const nodeSelector = page.locator("select").filter({ hasText: "E2E Node" }).first();
    await expect(nodeSelector).toBeVisible();
    await nodeSelector.selectOption({ label: "E2E Node" });

    const capabilitySelector = page.locator("#dashboard-capability");
    await expect(capabilitySelector).toBeEnabled();
    await expect(capabilitySelector.locator("option")).toHaveText(["Select capability", "tasks"]);
    await capabilitySelector.selectOption("tasks");
    await page.getByRole("button", { name: "Add Node widget" }).click();

    await expect(page.getByText(/E2E Node · tasks/)).toBeVisible();
    await page.getByRole("button", { name: "Save personal settings" }).click();
    await page.reload();
    await expect(page.getByText(/E2E Node · tasks/)).toBeVisible();
  });
});
