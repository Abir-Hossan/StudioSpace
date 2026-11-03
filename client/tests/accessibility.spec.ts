import { expect, test } from "@playwright/test";

test("switching header disclosures closes the previous panel and restores the current trigger", async ({
  page,
}) => {
  await page.route("**/api/auth/me", route => route.fulfill({
    json: { _id: "test-host", name: "Test Host", email: "host@example.test" },
  }));
  await page.route("**/api/dashboard", route => route.fulfill({
    json: { pending: 1, upcoming: 0 },
  }));
  await page.goto("/");

  const profile = page.getByRole("button", { name: "Profile menu" });
  const notifications = page.getByRole("button", { name: "Notifications" });
  await notifications.click();
  await expect(notifications).toHaveAttribute("aria-expanded", "true");
  await profile.focus();
  await page.keyboard.press("Enter");
  await expect(notifications).toHaveAttribute("aria-expanded", "false");
  await expect(profile).toHaveAttribute("aria-expanded", "true");
  await page.locator("#account-menu").getByRole("link", { name: "Overview" }).focus();
  await page.keyboard.press("Escape");
  await expect(profile).toHaveAttribute("aria-expanded", "false");
  await expect(profile).toBeFocused();
});

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
