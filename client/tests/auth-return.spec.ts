import { expect, test } from "@playwright/test";

test("sign-in rejects a return path that normalizes to an external origin", async ({ page }) => {
  const next = encodeURIComponent("/\\example.invalid");
  await page.goto(`/login?next=${next}`);
  await page.getByLabel("Email address", { exact: true }).fill("host@studiospace.local");
  await page.getByLabel("Password", { exact: true }).fill("StudioPass1");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
});
