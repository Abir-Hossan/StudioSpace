import { expect, test } from "@playwright/test";

test("profile validation shows field errors and blocks invalid updates", async ({ page }) => {
  let updateSubmitted = false;
  await page.route("**/api/users/me", async (route) => {
    if (route.request().method() === "PATCH") updateSubmitted = true;
    await route.continue();
  });

  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("host@studiospace.local");
  await page.getByLabel("Password", { exact: true }).fill("StudioPass1");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");

  await page.goto("/profile-settings");
  await page.getByLabel("Full name").fill("  ");
  await page.getByLabel("Studio / production house URL").fill("not-a-url");
  await page.getByRole("button", { name: "Save Profile Changes" }).click();

  await expect(page.getByText("Enter at least 2 characters", { exact: true })).toBeVisible();
  await expect(page.getByText("Enter a valid website URL", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Full name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Studio / production house URL")).toHaveAttribute("aria-invalid", "true");
  expect(updateSubmitted).toBe(false);
});
