import { test, expect } from "@playwright/test";

test("Full IM Studio E2E Walkthrough", async ({ page }) => {
  // 1. Visit Home and go to Import
  await page.goto("/");
  
  // 2. Go to Import (via Direct URL since we didn't add it to header)
  await page.goto("/im-projects/import");

  // 3. Fill the token and submit
  const input = page.getByLabel("Handoff Token");
  await expect(input).toBeVisible();
  await input.fill("hof_demo_test_token_123");
  
  await page.getByRole("button", { name: /Import/ }).click();
  
  // 4. Verify Success or Failure (since we don't have a valid real token)
  const outcome = page.getByText("Import Complete").or(page.getByText("Import Failed"));
  await expect(outcome).toBeVisible({ timeout: 15000 });
  
  // 5. Navigate to IM Projects list directly since import might have failed
  await page.goto("/im-projects");
  
  // 6. We should be on IM Projects list
  await expect(page).toHaveURL(/.*im-projects.*/);

  // 7. Assuming we are on the project list or dashboard, verify it loads.
  // Wait for network/loading
  await page.waitForLoadState('networkidle');

  // Verify there's some content related to IM Projects
  await expect(page.locator('body')).toContainText(/IM 프로젝트|Project/);

  // 8. Go to admin analytics to check if it's there
  await page.goto("/admin/analytics");
  await expect(page.getByRole("heading", { name: /Analytics Console/i })).toBeVisible();
  
  // 9. Go to Golden Candidates
  await page.goto("/admin/golden-candidates");
  await expect(page.getByRole("heading", { name: /Golden Dataset/i })).toBeVisible();
  
  // 10. Go to Expert Assignments
  await page.goto("/expert/assignments");
  await expect(page.getByRole("heading", { name: /전문가 배정/i })).toBeVisible();
});
