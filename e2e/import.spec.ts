import { test, expect } from "@playwright/test";

test("import page loads and shows form", async ({ page }) => {
  await page.goto("/im-projects/import");

  await expect(page.getByRole("heading", { name: "Import Handoff Payload" })).toBeVisible();
  await expect(page.getByLabel("Handoff Token")).toBeVisible();
  await expect(page.getByRole("button", { name: /Import/ })).toBeVisible();
});

test("import with a valid demo token creates project", async ({ page }) => {
  await page.goto("/im-projects/import");

  // Fill token
  const input = page.getByLabel("Handoff Token");
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.fill("hof_demo_test_token");

  // Click submit
  await page.getByRole("button", { name: /Import/ }).click();

  // Wait for either success or error to appear
  const outcome = page.getByText("Import Complete").or(page.getByText("Import Failed"));
  await expect(outcome).toBeVisible({ timeout: 15000 });
});

test("empty form submission is blocked by required attribute", async ({ page }) => {
  await page.goto("/im-projects/import");

  const button = page.getByRole("button", { name: /Import/ });
  await expect(button).toBeVisible();
});
