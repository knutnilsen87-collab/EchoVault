import { describe, expect, it, beforeAll } from "vitest";
import { call, musicWav, validPoe, wavForm } from "./helpers";
import * as register from "@/app/api/v1/auth/register/route";
import * as login from "@/app/api/v1/auth/login/route";
import * as artistTracks from "@/app/api/v1/artist/tracks/route";
import * as artistTrack from "@/app/api/v1/artist/tracks/[trackId]/route";
import * as files from "@/app/api/v1/artist/tracks/[trackId]/files/route";
import * as poe from "@/app/api/v1/artist/tracks/[trackId]/poe/route";
import * as submit from "@/app/api/v1/artist/tracks/[trackId]/submit/route";
import * as queue from "@/app/api/v1/admin/review-queue/route";
import * as reviewDetail from "@/app/api/v1/admin/tracks/[trackId]/route";
import * as approve from "@/app/api/v1/admin/tracks/[trackId]/approve/route";
import * as reject from "@/app/api/v1/admin/tracks/[trackId]/reject/route";
import * as suspend from "@/app/api/v1/admin/tracks/[trackId]/suspend/route";
import * as vault from "@/app/api/v1/vault/tracks/route";
import * as vaultTrack from "@/app/api/v1/vault/tracks/[trackId]/route";
import * as preview from "@/app/api/v1/vault/tracks/[trackId]/preview/route";
import * as checkout from "@/app/api/v1/checkout/session/route";
import * as webhook from "@/app/api/v1/webhooks/stripe/route";
import * as licenses from "@/app/api/v1/licenses/route";
import * as license from "@/app/api/v1/licenses/[licenseId]/route";
import * as download from "@/app/api/v1/licenses/[licenseId]/download-link/route";
import * as certificate from "@/app/api/v1/certificates/[certificateId]/route";
import * as signedFile from "@/app/api/v1/files/signed/route";
import * as disputes from "@/app/api/v1/disputes/route";
import { createSession, hashPassword } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { buildSignedStubEvent } from "@/server/payments";
import { drainJobs } from "@/server/worker";

let artist: string, buyer: string, otherBuyer: string, reviewer: string;
let trackId: string;

async function signUp(role: "buyer" | "artist", email: string) {
  const r = await call(register.POST, {
    json: { email, password: "correct horse battery", display_name: email.split("@")[0], role, artist_name: role === "artist" ? "Blue Fire" : undefined }
  });
  expect(r.status).toBe(201);
  expect(r.headers.get("set-cookie")).toMatch(/ev_session=.*HttpOnly/);
  return r.body.data.token as string;
}

async function staff(role: "reviewer" | "admin", email: string) {
  const u = await queryOne<{ id: string }>("INSERT INTO users (email, role, display_name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id", [
    email,
    role,
    role,
    await hashPassword("staff password 123")
  ]);
  return (await createSession(u!.id)).token;
}

async function newSubmittedTrack(title: string, wav = musicWav()) {
  const draft = await call(artistTracks.POST, { token: artist, json: { title, genre: "Electronic", mood: "Cinematic", bpm: 124 } });
  const id = draft.body.data.track.id as string;
  expect((await call(files.POST, { token: artist, params: { trackId: id }, form: wavForm(wav) })).status).toBe(201);
  expect((await call(poe.PUT, { method: "PUT", token: artist, params: { trackId: id }, json: validPoe })).status).toBe(200);
  expect((await call(submit.POST, { token: artist, params: { trackId: id }, method: "POST" })).status).toBe(200);
  return id;
}

function stripeEvent(stripeSessionId: string, amountCents: number) {
  return buildSignedStubEvent({ id: stripeSessionId, amountCents, currency: "EUR", metadata: {} });
}

beforeAll(async () => {
  artist = await signUp("artist", "artist@echovault.test");
  buyer = await signUp("buyer", "buyer@echovault.test");
  otherBuyer = await signUp("buyer", "other@echovault.test");
  reviewer = await staff("reviewer", "reviewer@echovault.test");
});

describe("auth", () => {
  it("logs in with password and rejects wrong passwords", async () => {
    expect((await call(login.POST, { json: { email: "buyer@echovault.test", password: "correct horse battery" } })).status).toBe(200);
    const bad = await call(login.POST, { json: { email: "buyer@echovault.test", password: "nope" } });
    expect(bad.status).toBe(401);
    expect(bad.body).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("enforces roles (buyers cannot create tracks, artists cannot review)", async () => {
    expect((await call(artistTracks.POST, { token: buyer, json: { title: "x", genre: "y" } })).status).toBe(403);
    expect((await call(queue.GET, { token: artist })).status).toBe(403);
    expect((await call(queue.GET, {})).status).toBe(401);
  });

  it("rejects cross-origin cookie mutations", async () => {
    const r = await call(artistTracks.POST, { headers: { origin: "https://evil.example", cookie: `ev_session=${artist}` }, json: { title: "x", genre: "y" } });
    expect(r.status).toBe(403);
  });
});

describe("artist submission (AC-001, AC-002, AC-003)", () => {
  it("rejects non-WAV uploads", async () => {
    const draft = await call(artistTracks.POST, { token: artist, json: { title: "Not audio", genre: "Electronic" } });
    const form = new FormData();
    form.set("kind", "high_res_wav");
    form.set("file", new File(["hello"], "fake.wav", { type: "audio/wav" }));
    const r = await call(files.POST, { token: artist, params: { trackId: draft.body.data.track.id }, form });
    expect(r.status).toBe(422);
  });

  it("blocks submission without PoE, and blocks named-artist imitation", async () => {
    const draft = await call(artistTracks.POST, { token: artist, json: { title: "Neon Harbor", genre: "Electronic", mood: "Cinematic", bpm: 124 } });
    trackId = draft.body.data.track.id;
    expect(draft.body.data.track.status).toBe("draft");

    const up = await call(files.POST, { token: artist, params: { trackId }, form: wavForm(musicWav()) });
    expect(up.status).toBe(201);
    expect(up.body.data.file.checksum_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Math.round(up.body.data.file.duration_seconds)).toBe(8);

    const noPoe = await call(submit.POST, { token: artist, params: { trackId }, method: "POST" });
    expect(noPoe.status).toBe(422);
    expect(noPoe.body.error.details.problems).toContain("POE_MISSING");

    const imitation = await call(poe.PUT, { method: "PUT", token: artist, params: { trackId }, json: { ...validPoe, named_artist_imitation: true } });
    expect(imitation.status).toBe(422);
    expect(imitation.body.error.details.problems).toContain("POE_NAMED_ARTIST_IMITATION_BLOCKED");

    const noWarranty = await call(poe.PUT, { method: "PUT", token: artist, params: { trackId }, json: { ...validPoe, rights_warranty_accepted: false } });
    expect(noWarranty.body.error.details.problems).toContain("POE_RIGHTS_WARRANTY_REQUIRED");
  });

  it("stores the file privately and never shows drafts in the catalog", async () => {
    const file = await queryOne<{ is_public: boolean; storage_key: string }>("SELECT is_public, storage_key FROM track_files WHERE track_id = $1", [trackId]);
    expect(file!.is_public).toBe(false);
    const list = await call(vault.GET, { path: "/api/v1/vault/tracks" });
    expect(list.body.data.tracks.map((t: { id: string }) => t.id)).not.toContain(trackId);
    expect((await call(vaultTrack.GET, { params: { trackId } })).status).toBe(404);
  });

  it("submits, runs real EchoScore analysis and lands in the review queue", async () => {
    expect((await call(poe.PUT, { method: "PUT", token: artist, params: { trackId }, json: validPoe })).status).toBe(200);
    const sub = await call(submit.POST, { token: artist, params: { trackId }, method: "POST" });
    expect(sub.body.data.status).toBe("analysis_pending");

    // Artist can no longer edit once submitted.
    const locked = await call(files.POST, { token: artist, params: { trackId }, form: wavForm(musicWav()) });
    expect(locked.status).toBe(409);

    await drainJobs();
    const detail = await call(artistTrack.GET, { token: artist, params: { trackId } });
    expect(detail.body.data.track.status).toBe("needs_human_review");
    const a = detail.body.data.analysis;
    expect(a.status).toBe("succeeded");
    expect(a.analysis_version).toBe("echoscore-v0.2");
    expect(a.pass).toBe(true);
    expect(a.metrics.integrated_lufs).toBeGreaterThan(-18);
    expect(a.feedback.join(" ")).toContain("not a copyright");

    const preview = await queryOne("SELECT 1 FROM track_files WHERE track_id = $1 AND kind = 'preview_mp3'", [trackId]);
    expect(preview).not.toBeNull();

    const q = await call(queue.GET, { token: reviewer });
    expect(q.body.data.tracks.find((t: { id: string }) => t.id === trackId)).toMatchObject({ status: "needs_human_review", pass: true });
  });
});

describe("human review (AC-004, AC-005)", () => {
  it("shows reviewers the full PoE but audits every decision", async () => {
    const d = await call(reviewDetail.GET, { token: reviewer, params: { trackId } });
    expect(d.body.data.poe.private_notes).toContain("secret sauce");
  });

  it("approves, publishes with a public PoE summary that leaks nothing private", async () => {
    const r = await call(approve.POST, { token: reviewer, params: { trackId }, json: { reason_code: "meets_standard" } });
    expect(r.status).toBe(200);
    expect(r.body.data).toMatchObject({ status: "approved", override: false });

    const audit = await query("SELECT action FROM audit_logs WHERE entity_id = $1 AND action = 'track.approve'", [trackId]);
    expect(audit).toHaveLength(1);

    const list = await call(vault.GET, { path: "/api/v1/vault/tracks" });
    const pub = list.body.data.tracks.find((t: { id: string }) => t.id === trackId);
    expect(pub).toMatchObject({ title: "Neon Harbor", artist_name: "Blue Fire", has_preview: true, price_from_cents: 1900 });
    expect(pub.poe.rights_warranty).toBe("accepted");
    const raw = JSON.stringify(list.body);
    for (const secret of ["secret sauce", "Generated stems", "harbour", "storage_key", "artist@echovault.test"]) expect(raw).not.toContain(secret);

    const detail = await call(vaultTrack.GET, { params: { trackId } });
    expect(detail.body.data.tiers.map((t: { price_cents: number }) => t.price_cents)).toEqual([1900, 4900, 19900]);
  });

  it("serves previews through short-lived signed URLs", async () => {
    const r = await call(preview.GET, { params: { trackId } });
    expect(r.status).toBe(302);
    const location = new URL(r.headers.get("location")!);
    const file = await call(signedFile.GET, { path: location.pathname + location.search });
    expect(file.status).toBe(200);
    expect(file.headers.get("content-type")).toBe("audio/mpeg");
    // Tampering with the signed URL fails.
    const tampered = await call(signedFile.GET, { path: location.pathname + location.search.replace("preview_mp3", "high_res_wav") });
    expect(tampered.status).toBe(403);
  });

  it("requires an explicit override to approve a track that failed EchoScore", async () => {
    const clippedId = await newSubmittedTrack("Too Loud", musicWav(8, { clip: true }));
    await drainJobs();
    const a = await queryOne<{ pass: boolean; flags: string[] }>("SELECT pass, flags FROM echo_score_analyses WHERE track_id = $1", [clippedId]);
    expect(a!.pass).toBe(false);
    expect(a!.flags).toContain("clipping");

    const blocked = await call(approve.POST, { token: reviewer, params: { trackId: clippedId }, json: {} });
    expect(blocked.status).toBe(409);
    const withOverride = await call(approve.POST, {
      token: reviewer,
      params: { trackId: clippedId },
      json: { override_reason: "Intentional lo-fi distortion, confirmed with artist." }
    });
    expect(withOverride.body.data).toMatchObject({ status: "approved", override: true });
    const decisions = await query<{ decision: string }>("SELECT decision FROM track_reviews WHERE track_id = $1 ORDER BY created_at", [clippedId]);
    expect(decisions.map((d) => d.decision)).toEqual(["override_analysis", "approve"]);
  });

  it("rejected tracks never appear publicly and need a reason", async () => {
    const id = await newSubmittedTrack("Rejected One");
    await drainJobs();
    expect((await call(reject.POST, { token: reviewer, params: { trackId: id }, json: {} })).status).toBe(422);
    expect((await call(reject.POST, { token: reviewer, params: { trackId: id }, json: { reason_code: "sample_provenance" } })).status).toBe(200);
    expect((await call(vaultTrack.GET, { params: { trackId: id } })).status).toBe(404);
  });

  it("review_logs are append-only at the database level", async () => {
    await expect(query("UPDATE track_reviews SET decision = 'reject' WHERE track_id = $1", [trackId])).rejects.toThrow(/APPEND_ONLY/);
    await expect(query("DELETE FROM audit_logs")).rejects.toThrow(/APPEND_ONLY/);
  });
});

describe("checkout and fulfillment (AC-006, AC-007, AC-008)", () => {
  let stripeSessionId: string;
  let licenseId: string;

  it("requires accepted terms and an approved track", async () => {
    const noTerms = await call(checkout.POST, { token: buyer, json: { track_id: trackId, tier: "pro", terms_accepted: false } });
    expect(noTerms.status).toBe(409);
    expect(noTerms.body.error.code).toBe("TERMS_NOT_ACCEPTED");
    const draft = await call(artistTracks.POST, { token: artist, json: { title: "Draft only", genre: "Ambient" } });
    const notApproved = await call(checkout.POST, { token: buyer, json: { track_id: draft.body.data.track.id, tier: "pro", terms_accepted: true } });
    expect(notApproved.body.error.code).toBe("TRACK_NOT_APPROVED");
    expect((await call(checkout.POST, { json: { track_id: trackId, tier: "pro", terms_accepted: true } })).status).toBe(401);
  });

  it("creates a persisted session with tier/terms metadata and reuses it on double-click", async () => {
    const body = { track_id: trackId, tier: "pro", terms_accepted: true, project_or_client_name: "Acme spring campaign" };
    const first = await call(checkout.POST, { token: buyer, json: body });
    expect(first.status).toBe(200);
    expect(first.body.data.checkout_url).toContain("/dev/checkout/cs_stub_");
    const second = await call(checkout.POST, { token: buyer, json: body });
    expect(second.body.data.payment_session_id).toBe(first.body.data.payment_session_id);
    expect(second.body.data.reused).toBe(true);

    stripeSessionId = first.body.data.stripe_session_id;
    const ps = await queryOne<{ amount_cents: number; tier: string; terms_version_id: string; status: string }>(
      "SELECT amount_cents, tier, terms_version_id, status FROM payment_sessions WHERE stripe_session_id = $1",
      [stripeSessionId]
    );
    expect(ps).toMatchObject({ amount_cents: 4900, tier: "pro", status: "created" });
    expect(await queryOne("SELECT 1 FROM purchased_licenses WHERE stripe_session_id = $1", [stripeSessionId])).toBeNull();
  });

  it("rejects unsigned and forged webhooks", async () => {
    const { payload } = stripeEvent(stripeSessionId, 4900);
    expect((await call(webhook.POST, { raw: payload })).status).toBe(400);
    const forged = await call(webhook.POST, { raw: payload, headers: { "stripe-signature": "t=1,v1=deadbeef" } });
    expect(forged.status).toBe(400);
    expect(forged.body.error.code).toBe("WEBHOOK_SIGNATURE_INVALID");
  });

  it("ignores events whose amount does not match what we charged", async () => {
    const { payload, signature } = stripeEvent(stripeSessionId, 100);
    const r = await call(webhook.POST, { raw: payload, headers: { "stripe-signature": signature } });
    expect(r.body.data.outcome).toBe("amount_mismatch");
    expect(await queryOne("SELECT 1 FROM purchased_licenses WHERE stripe_session_id = $1", [stripeSessionId])).toBeNull();
  });

  it("creates exactly one license under duplicate and concurrent delivery", async () => {
    const e1 = stripeEvent(stripeSessionId, 4900);
    const e2 = stripeEvent(stripeSessionId, 4900); // different event id, same session (e.g. async_payment_succeeded)
    const send = (e: { payload: string; signature: string }) => call(webhook.POST, { raw: e.payload, headers: { "stripe-signature": e.signature } });
    const results = await Promise.all([send(e1), send(e1), send(e2), send(e1)]);
    for (const r of results) expect(r.status).toBe(200);
    const outcomes = results.map((r) => r.body.data.outcome).sort();
    expect(outcomes.filter((o) => o === "license_created")).toHaveLength(1);

    const rows = await query<{ id: string; price_paid_cents: number; artist_cut_cents: number; platform_cut_cents: number; terms_snapshot: { version: string } }>(
      "SELECT id, price_paid_cents, artist_cut_cents, platform_cut_cents, terms_snapshot FROM purchased_licenses WHERE stripe_session_id = $1",
      [stripeSessionId]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ price_paid_cents: 4900, artist_cut_cents: 3430, platform_cut_cents: 1470 });
    expect(rows[0]!.terms_snapshot.version).toBe("0.1-draft");
    licenseId = rows[0]!.id;
  });

  it("generates a PDF certificate linked to the license", async () => {
    await drainJobs();
    const cert = await queryOne<{ id: string; sha256: string; storage_key: string }>(
      "SELECT c.id, c.sha256, f.storage_key FROM certificates c JOIN track_files f ON f.id = c.file_id WHERE c.license_id = $1",
      [licenseId]
    );
    expect(cert).not.toBeNull();
    const { storage } = await import("@/server/storage");
    const pdf = Buffer.from(await (await storage()).get(cert!.storage_key)).toString("latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);

    const pub = await call(certificate.GET, { params: { certificateId: cert!.id } });
    expect(pub.body.data).toMatchObject({ license_id: licenseId, track_title: "Neon Harbor", tier: "pro", validity: "valid", terms_version: "0.1-draft" });
    expect(JSON.stringify(pub.body)).not.toContain("buyer@echovault.test");
  });

  it("the license ledger is immutable", async () => {
    await expect(query("UPDATE purchased_licenses SET price_paid_cents = 0 WHERE id = $1", [licenseId])).rejects.toThrow(/APPEND_ONLY/);
    await expect(query("DELETE FROM purchased_licenses WHERE id = $1", [licenseId])).rejects.toThrow(/APPEND_ONLY/);
    await expect(query("UPDATE license_terms_versions SET price_cents = 1 WHERE tier = 'pro'")).rejects.toThrow(/TERMS_LOCKED/);
  });

  describe("delivery (AC-009, AC-010)", () => {
    it("owner gets an expiring signed WAV URL", async () => {
      const r = await call(download.POST, { token: buyer, params: { licenseId }, method: "POST" });
      expect(r.status).toBe(200);
      expect(new Date(r.body.data.expires_at).getTime() - Date.now()).toBeLessThanOrEqual(15 * 60 * 1000);
      expect(JSON.stringify(r.body)).not.toContain("tracks/"); // never the raw storage key
      const u = new URL(r.body.data.url);
      const file = await call(signedFile.GET, { path: u.pathname + u.search });
      expect(file.status).toBe(200);
      expect(file.headers.get("content-disposition")).toContain("Neon_Harbor_EchoVault_");

      const l = await call(license.GET, { token: buyer, params: { licenseId } });
      expect(l.body.data.events.map((e: { type: string }) => e.type)).toEqual(["paid", "certificate_generated", "delivered"]);
    });

    it("non-owners get 404, anonymous users 401", async () => {
      expect((await call(download.POST, { token: otherBuyer, params: { licenseId }, method: "POST" })).status).toBe(404);
      expect((await call(download.POST, { params: { licenseId }, method: "POST" })).status).toBe(401);
      expect((await call(licenses.GET, { token: otherBuyer })).body.data.licenses).toHaveLength(0);
    });

    it("expired signed URLs are refused", async () => {
      const r = await call(download.POST, { token: buyer, params: { licenseId }, method: "POST" });
      const u = new URL(r.body.data.url);
      u.searchParams.set("exp", String(Math.floor(Date.now() / 1000) - 1));
      expect((await call(signedFile.GET, { path: u.pathname + u.search })).status).toBe(403);
    });
  });

  describe("disputes and suspension (AC-011)", () => {
    it("suspension blocks new purchases and previews but buyers keep their license", async () => {
      const d = await call(disputes.POST, {
        token: buyer,
        json: { license_id: licenseId, claim_summary: "Received a Content ID claim on my upload of this track.", reason_category: "content_id_claim" }
      });
      expect(d.status).toBe(201);
      const s = await call(suspend.POST, { token: reviewer, params: { trackId }, json: { reason: "Investigating Content ID claim", dispute_id: d.body.data.id } });
      expect(s.body.data.status).toBe("suspended");

      expect((await call(vaultTrack.GET, { params: { trackId } })).status).toBe(404);
      expect((await call(preview.GET, { params: { trackId } })).status).toBe(404);
      const blocked = await call(checkout.POST, { token: otherBuyer, json: { track_id: trackId, tier: "creator", terms_accepted: true } });
      expect(blocked.body.error.code).toBe("TRACK_NOT_APPROVED");

      const mine = await call(licenses.GET, { token: buyer });
      expect(mine.body.data.licenses[0]).toMatchObject({ id: licenseId, status: "disputed", track_status: "suspended" });
      expect((await call(download.POST, { token: buyer, params: { licenseId }, method: "POST" })).status).toBe(200);
    });
  });
});
