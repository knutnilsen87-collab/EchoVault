import path from "node:path";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { expect, test, type Page } from "@playwright/test";
import { musicWav } from "../src/scripts/synth";

const shots = process.env.E2E_SCREENSHOT_DIR;
const shot = async (page: Page, name: string) => {
  if (shots) await page.screenshot({ path: path.join(shots, `${name}.png`), fullPage: true });
};
const unique = Date.now();

async function signIn(page: Page, email: string, password = "echovault-dev-password") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/login"));
}

test("buyer: browse → preview → checkout → certificate → download → verify", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /paper trail/i })).toBeVisible();
  await expect(page.getByText("Neon Harbor")).toBeVisible();
  await shot(page, "01-catalog");

  // Preview plays in the persistent player without navigating away.
  await page.getByRole("button", { name: "Play preview of Neon Harbor" }).click();
  await expect(page.getByRole("button", { name: "Pause preview" })).toBeVisible({ timeout: 10_000 });

  await page.getByRole("link", { name: "Neon Harbor", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Neon Harbor" })).toBeVisible();
  await shot(page, "02-track-detail");

  // Sign up as a new buyer from the license CTA.
  await page.getByRole("button", { name: "License this track" }).click();
  await page.waitForURL(/\/login/);
  await page.getByRole("link", { name: "Create an account" }).click();
  await page.getByLabel("Name").fill("E2E Buyer");
  await page.getByLabel("Email").fill(`buyer+${unique}@echovault.test`);
  await page.getByLabel("Password").fill("correct horse battery");
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/\/tracks\//);

  await page.getByRole("button", { name: "License this track" }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByText("Pro", { exact: true }).click();
  await drawer.getByLabel("Project or client (optional)").fill("E2E campaign");
  const pay = drawer.getByRole("button", { name: /^Pay/ });
  await expect(pay).toBeDisabled(); // terms must be accepted first
  await drawer.getByRole("checkbox").check();
  await shot(page, "03-checkout-drawer");
  await pay.click();

  await page.waitForURL(/\/dev\/checkout\/cs_stub_/);
  await page.getByRole("button", { name: "Pay (test)" }).click();
  await page.waitForURL(/\/licenses\//, { timeout: 20_000 });
  await expect(page.getByText("E2E campaign")).toBeVisible();
  await expect(page.getByRole("link", { name: "Download certificate (PDF)" })).toBeVisible();
  await shot(page, "04-license");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download high-res WAV" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^Neon_Harbor_EchoVault_.*\.wav$/);

  await page.getByRole("link", { name: /Public verification page/ }).click();
  await expect(page.getByText("VALID", { exact: true })).toBeVisible();
  await expect(page.locator("main").getByText(`buyer+${unique}@echovault.test`)).toHaveCount(0); // header shows own email; the record must not
  await shot(page, "05-verify");
});

test("artist submits → EchoScore → reviewer approves → track is live", async ({ page, browser }) => {
  await signIn(page, "artist@echovault.local");
  await page.goto("/artist/tracks/new");
  const title = `E2E Track ${unique}`;
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Genre").fill("Electronic");
  await page.getByLabel("BPM").fill("120");
  await page.getByRole("button", { name: "Create draft" }).click();
  await page.waitForURL(/\/artist\/tracks\/[0-9a-f-]{36}$/);

  const wavPath = path.join(tmpdir(), `e2e-${unique}.wav`);
  writeFileSync(wavPath, musicWav(10, { root: 246.9 }));
  await page.getByLabel("Upload high-res WAV").setInputFiles(wavPath);
  await expect(page.getByText(/sha256/)).toBeVisible({ timeout: 15_000 });

  await page.getByLabel("AI tools used").fill("Suno");
  await page.getByLabel(/Process summary/).fill("Generated stems with Suno, then arranged and mixed by hand in Ableton.");
  await page.getByRole("checkbox", { name: /I warrant/ }).check();
  await page.getByRole("button", { name: "Save Proof of Effort" }).click();
  await expect(page.getByText("✓ Proof of Effort complete")).toBeVisible({ timeout: 10_000 });
  await shot(page, "06-artist-track");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText(/Analysing|In review/).first()).toBeVisible();

  // Reviewer (separate session) waits for the worker + EchoScore, then approves.
  const reviewer = await (await browser.newContext()).newPage();
  await signIn(reviewer, "reviewer@echovault.local");
  await expect(async () => {
    await reviewer.goto("/admin");
    await expect(reviewer.getByRole("link", { name: new RegExp(title) })).toContainText("In review");
  }).toPass({ timeout: 30_000 });
  await shot(reviewer, "07-review-queue");
  await reviewer.getByRole("link", { name: new RegExp(title) }).click();
  await expect(reviewer.getByText("integrated_lufs")).toBeVisible();
  await shot(reviewer, "08-review-detail");
  await reviewer.getByRole("button", { name: "Approve for sale" }).click();
  await expect(reviewer.getByText("Decision recorded.")).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("link", { name: title, exact: true })).toBeVisible();
});
