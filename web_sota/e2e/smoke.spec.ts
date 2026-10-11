import { expect, test } from "@playwright/test";

test("dashboard loads with KPIs", async ({ page }) => {
	await page.goto("/dashboard");
	await expect(page.getByTestId("dashboard-build-cta")).toBeVisible();
	await expect(page.getByTestId("onboarding-cue")).toBeVisible();
	await expect(page.getByTestId("kpi-channels")).toBeVisible();
	await expect(page.getByTestId("kpi-tools")).toBeVisible();
	await expect(page.getByTestId("kpi-version")).toBeVisible();
});

test("nav reaches tools and help", async ({ page }) => {
	await page.goto("/dashboard");
	await page.getByTestId("nav-tools").click();
	await expect(page.getByTestId("tool-toggle-iptv")).toBeVisible({
		timeout: 15000,
	});
	await page.getByTestId("nav-help").click();
	await expect(page.getByTestId("help-body")).toBeVisible();
});

test("playlist builder renders", async ({ page }) => {
	await page.goto("/playlists");
	await expect(page.getByTestId("playlist-build")).toBeVisible();
	await expect(page.getByTestId("playlist-country")).toHaveValue("AT");
});

test("chat shows controls and examples", async ({ page }) => {
	await page.goto("/chat");
	await expect(page.getByTestId("chat-page")).toBeVisible();
	await expect(page.getByTestId("chat-controls")).toBeVisible();
	await expect(page.getByTestId("personality-select")).toBeVisible();
	await expect(page.getByTestId("example-prompts")).toBeVisible();
});
