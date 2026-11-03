import { expect, test } from "@playwright/test";

test("sign-in sends a password without registration-only strength requirements", async ({ page }) => {
  let submittedPassword: unknown;
  await page.route("**/api/auth/login", async (route) => {
    submittedPassword = route.request().postDataJSON().password;
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Email or password is incorrect" }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("existing@example.com");
  await page.getByLabel("Password", { exact: true }).fill("lowercasepassword");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  await expect(page.getByText("Email or password is incorrect", { exact: true })).toBeVisible();
  expect(submittedPassword).toBe("lowercasepassword");
});

test("registration still requires an uppercase password character", async ({ page }) => {
  let registrationSubmitted = false;
  await page.route("**/api/auth/register", async (route) => {
    registrationSubmitted = true;
    await route.fulfill({ status: 201, contentType: "application/json", body: "{}" });
  });

  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("Existing Account");
  await page.getByLabel("Email address", { exact: true }).fill("new@example.com");
  await page.getByLabel("Password", { exact: true }).fill("lowercasepassword");
  await page.getByLabel("Confirm password", { exact: true }).fill("lowercasepassword");
  await page.locator('input[name="accepted"]').check();
  await page.getByRole("button", { name: "Create Account", exact: true }).click();

  await expect(page.getByText("Include an uppercase letter", { exact: true })).toBeVisible();
  expect(registrationSubmitted).toBe(false);
});
