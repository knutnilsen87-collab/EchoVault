import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const shots = process.env.E2E_SCREENSHOT_DIR;
const shot = async (page: Page, name: string) => {
  if (shots) await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true });
};

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("echovault-dev-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

async function visit(page: Page, url: string, heading: string | RegExp, name: string) {
  const res = await page.goto(url);
  expect(res?.status(), url).toBeLessThan(400);
  await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  await shot(page, name);
}

test("public pages", async ({ page }) => {
  await visit(page, "/pricing", /One track, one payment/, "p-pricing");
  await visit(page, "/support", "How can we help?", "p-support");
  await visit(page, "/legal/terms", /License & platform terms/, "p-terms");
  await visit(page, "/legal/privacy", "Privacy", "p-privacy");

  await page.goto("/?genre=Electronic");
  await expect(page.getByRole("link", { name: "Neon Harbor", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Night Shift Loop", exact: true })).toHaveCount(0); // Lo-fi, filtered out
  await shot(page, "p-catalog-filtered");

  await page.goto("/");
  await page.getByRole("link", { name: "Neon Harbor", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Similar tracks" })).toBeVisible();
  await shot(page, "p-track-detail");
  await page.locator("main").getByRole("link", { name: "Glass Signal", exact: true }).first().click(); // demo artist name
  await expect(page.getByRole("heading", { level: 1, name: "Glass Signal" })).toBeVisible();
  await expect(page.getByText(/Demo artist for local testing/)).toBeVisible();
  await shot(page, "p-artist-profile");
});

test("artist pages", async ({ page }) => {
  await signIn(page, "artist@echovault.local");
  await visit(page, "/artist/earnings", "Earnings", "a-earnings");
  await visit(page, "/settings", "Settings", "a-settings");
  await page.getByLabel("Bio").fill("Demo artist for local testing. All audio and artwork is generated in code.");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.")).toBeVisible();
});

test("admin pages", async ({ page }) => {
  await signIn(page, "admin@echovault.local");
  await visit(page, "/admin", "Review", "x-review");
  await visit(page, "/admin/disputes", "Disputes", "x-disputes");
  await visit(page, "/admin/licenses", "Licenses", "x-licenses");
  await visit(page, "/admin/audit", "Audit log", "x-audit");
  await visit(page, "/admin/terms", "License terms", "x-terms");
  await visit(page, "/admin/users", "Users", "x-users");
});
