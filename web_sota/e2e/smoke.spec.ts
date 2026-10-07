import { expect, test } from "@playwright/test";

test("dashboard loads with KPIs", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByTestId("dashboard-build-cta")).toBeVisible();
  await expect(page.getByTestId("kpi-channels")).toBeVisible();
  await expect(page.getByTestId("kpi-backend")).toContainText("11242");
});

test("nav reaches tools and help", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByTestId("nav-tools").click();
  await expect(page.getByTestId("tool-toggle-iptv")).toBeVisible({ timeout: 15000 });
  await page.getByTestId("nav-help").click();
  await expect(page.getByTestId("help-body")).toBeVisible();
});

test("playlist builder renders", async ({ page }) => {
  await page.goto("/playlists");
  await expect(page.getByTestId("playlist-build")).toBeVisible();
  await expect(page.getByTestId("playlist-country")).toHaveValue("AT");
});
