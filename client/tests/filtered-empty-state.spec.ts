import { expect, test, type Page } from "@playwright/test";

const studio = {
  _id: "507f1f77bcf86cd799439011",
  title: "Test Studio",
  category: "Photo Studios",
  city: "Dhaka",
  country: "Bangladesh",
  address: "12 Creative Avenue",
  hourlyRate: 75,
  securityDeposit: 100,
  maxCapacity: 8,
  images: ["/images/studio-photo.png"],
  amenities: ["Wi-Fi"],
  overview: "A flexible daylight studio for creative productions.",
  ownerId: "507f1f77bcf86cd799439012",
  ownerName: "Host",
  averageRating: 0,
  reviewCount: 0,
  status: "active",
};

async function signInAsHost(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("host@studiospace.local");
  await page.getByLabel("Password", { exact: true }).fill("StudioPass1");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL("/dashboard");
}

test("filtered studio listings explain no matches and restore results", async ({ page }) => {
  await signInAsHost(page);
  await page.route("**/api/studios/mine", (route) =>
    route.fulfill({ json: [studio] }),
  );

  await page.goto("/my-listings");
  await page.getByLabel("Search my listings").fill("no matching studio");
  await expect(page.getByRole("heading", { name: "No listings match your filters." })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();

  await expect(page.getByRole("heading", { name: "No listings match your filters." })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Test Studio" })).toBeVisible();
});

test("filtered booking requests explain no matches and restore results", async ({ page }) => {
  const booking = {
    _id: "507f1f77bcf86cd799439013",
    studioId: studio,
    startTime: new Date(Date.now() + 86400000).toISOString(),
    endTime: new Date(Date.now() + 93600000).toISOString(),
    totalHours: 2,
    hourlyRateSnapshot: 75,
    securityDeposit: 100,
    totalPrice: 250,
    status: "Pending",
    userEmail: "creator@example.com",
  };
  await page.route("**/api/bookings/host", (route) =>
    route.fulfill({ json: [booking] }),
  );
  await signInAsHost(page);

  await page.goto("/host-bookings");
  await page.getByLabel("Search bookings").fill("no matching booking");
  await expect(page.getByRole("heading", { name: "No bookings match your filters." })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();

  await expect(page.getByRole("heading", { name: "No bookings match your filters." })).toHaveCount(0);
  await expect(page.locator('[data-booking-id="507f1f77bcf86cd799439013"]')).toBeVisible();
});
