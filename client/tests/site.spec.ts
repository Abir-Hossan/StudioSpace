import { test, expect } from "@playwright/test";
import path from "node:path";
test("navigation, server-backed filters, theme and mobile menu", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Spaces Worth Creating In" }),
  ).toBeVisible();
  await expect(page.locator(".studio-card")).toHaveCount(6);
  await page
    .locator(".categories")
    .getByRole("link", { name: "Photo Studios" })
    .click();
  await expect(page).toHaveURL(/category=Photo/);
  await expect(page.locator("select[name=category]")).toHaveValue(
    "Photo Studios",
  );
  await page.locator("input[name=search]").fill("Daylight");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator(".studio-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Toggle theme" }).click();
  await expect(page.locator("html")).toHaveClass("light");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("light");
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Toggle navigation" }).click();
  await expect(page.locator(".mobile-menu")).toBeVisible();
  await page
    .locator(".mobile-menu")
    .getByRole("link", { name: "About Us" })
    .click();
  await expect(page.getByRole("heading", { name: /Making Creative Spaces/ })).toBeVisible();
});
test("login, persistent private route, wishlist and booking modal", async ({
  page,
}) => {
  await page.goto("/my-bookings");
  await expect(page).toHaveURL(/login/);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("creator@studiospace.local");
  await page.getByLabel("Password", { exact: true }).fill("StudioPass1");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("/my-bookings");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "My Reservations & Stage Holds" }),
  ).toBeVisible();
  for (const w of await (await page.request.get("/api/wishlist")).json()) {
    await page.request.delete("/api/wishlist/" + w.studioId._id, {
      headers: { "x-studiospace": "1", origin: new URL(page.url()).origin },
    });
  }
  await page.goto("/studios");
  await page
    .locator(".studio-card")
    .first()
    .getByRole("button", { name: "Save studio", exact: true })
    .click();
  await page.goto("/wishlist");
  await expect(page.locator(".studio-card")).toHaveCount(1);
  await page
    .locator(".studio-card")
    .getByRole("link", { name: /View Details/ })
    .click();
  await page.getByRole("button", { name: "Book Workspace Now" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByLabel("Booking date")
    .fill(new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10));
  const bookingResponse = page.waitForResponse(
    (r) => r.url().endsWith("/api/bookings") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Request Booking" }).click();
  const booked = await (await bookingResponse).json();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/my-bookings");
  const booking = page.locator('[data-booking-id="' + booked._id + '"]');
  await expect(booking).toBeVisible();
  await booking.getByRole("button", { name: "Cancel request" }).click();
  await page.getByRole("button", { name: "Confirm Change" }).click();
  await expect(booking.locator(".badge")).toContainText("Cancelled");
});
test("public routes fit all required viewport widths", async ({ page }) => {
  for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/studios",
      "/login",
      "/register",
      "/about",
      "/how-it-works",
      "/terms",
      "/privacy",
      "/missing-page",
    ]) {
      await page.goto(route);
      await expect(page.locator("header")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
    }
  }
});
test("private routes and studio details fit required viewport widths", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("host@studiospace.local");
  await page.getByLabel("Password", { exact: true }).fill("StudioPass1");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  const data = await (await page.request.get("/api/studios/mine")).json();
  const detail = "/studios/" + data[0]._id;
  const edit = "/studios/edit/" + data[0]._id;
  for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/dashboard",
      "/add-studio",
      "/my-listings",
      "/my-bookings",
      "/host-bookings",
      "/profile-settings",
      "/wishlist",
      detail,
      edit,
    ]) {
      await page.goto(route);
      await expect(page.locator("header")).toBeVisible();
      await page.waitForFunction(()=>document.querySelectorAll(".skeleton").length===0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route + " at " + width,
      ).toBeTruthy();
    }
  }
});
test("host creates, edits and deletes a listing through the UI", async ({
  page,
}) => {
  await page.goto("/login");
  await page
    .getByLabel("Email address", { exact: true })
    .fill("host@studiospace.local");
  await page.getByLabel("Password", { exact: true }).fill("StudioPass1");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
  await page.goto("/add-studio");
  await page.getByLabel("Studio title").fill("Browser Test Studio");
  await page.getByLabel("Hourly rate (USD)").fill("90");
  await page.getByLabel("Street address").fill("25 Test Avenue");
  await page.getByLabel("City", { exact: true }).fill("Dhaka");
  await page.getByLabel("Country", { exact: true }).fill("Bangladesh");
  await page
    .getByLabel("Upload studio photo")
    .setInputFiles(path.resolve("client/public/images/studio-photo.png"));
  await expect(page.locator(".upload-previews img")).toHaveCount(1);
  await page
    .getByLabel("Tell the story of your space")
    .fill("A flexible studio created by our browser integration test.");
  await page.getByRole("button", { name: "Publish Studio",exact:true }).last().click();
  await expect(page).toHaveURL("/my-listings");
  const row = page
    .locator(".listing-row")
    .filter({ hasText: "Browser Test Studio" });
  await row.getByRole("link", { name: "Edit", exact: true }).click();
  await page.getByLabel("Studio title").fill("Updated Browser Test Studio");
  await page.getByRole("button", { name: "Save Changes",exact:true }).last().click();
  await expect(page).toHaveURL("/my-listings");
  const updated = page
    .locator(".listing-row")
    .filter({ hasText: "Updated Browser Test Studio" });
  await updated.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete Studio", exact: true })
    .click();
  await expect(updated).toHaveCount(0);
});
test("captures desktop and mobile previews with local images", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.locator(".studio-card")).toHaveCount(6);
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((image) =>
        image.decode().catch(() => undefined),
      ),
    ),
  );
  expect(
    await page
      .locator("img")
      .evaluateAll((images) =>
        images.every((image) => (image as HTMLImageElement).naturalWidth > 0),
      ),
  ).toBeTruthy();
  await page.screenshot({ path: "../studiospace-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "../studiospace-mobile.png", fullPage: true });
});

