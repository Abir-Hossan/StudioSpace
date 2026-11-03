import { expect, test } from "@playwright/test";

test("Escape closes mobile navigation and returns focus to its trigger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: "Toggle navigation" });
  await trigger.click();
  const menuLink = page
    .locator(".mobile-menu")
    .getByRole("link", { name: "About Us" });
  await menuLink.focus();
  await page.keyboard.press("Escape");

  await expect(page.locator(".mobile-menu")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Escape closes the account menu and returns focus to its trigger", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("host@studiospace.local");
  await page.getByLabel("Password", { exact: true }).fill("StudioPass1");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");

  const trigger = page.getByRole("button", { name: "Profile menu" });
  await trigger.click();
  await page
    .locator("#account-menu")
    .getByRole("link", { name: "Overview" })
    .focus();
  await page.keyboard.press("Escape");

  await expect(page.locator("#account-menu")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
