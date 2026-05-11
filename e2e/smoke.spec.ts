import { test, expect } from '@playwright/test';

test('has title and im-projects link', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/JS Full IM Studio/);

  // create a locator for the main CTA button
  const enterStudioLink = page.getByRole('link', { name: 'IM 프로젝트 시작' });

  // Expect an attribute "to be strictly equal" to the value.
  await expect(enterStudioLink).toHaveAttribute('href', '/im-projects');

  // Click the enter studio link.
  await enterStudioLink.click();

  // Expects the URL to contain im-projects.
  await expect(page).toHaveURL(/.*im-projects/);

  // Expects im-projects header
  await expect(page.getByRole('heading', { name: 'IM 프로젝트', exact: true })).toBeVisible();
});

