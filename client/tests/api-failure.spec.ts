import { expect, test } from "@playwright/test";

test("sign-in gives a readable error when the proxy returns HTML", async ({ page }) => {
  await page.route("**/api/auth/login", route => route.fulfill({
    status: 503,
    contentType: "text/html",
    body: "<h1>Service unavailable</h1>",
  }));
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("host@studiospace.local");
  await page.getByLabel("Password", { exact: true }).fill("StudioPass1");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page.getByText("Request failed. Please try again.", { exact: true })).toBeVisible();
  await expect(page).toHaveURL("/login");
});
