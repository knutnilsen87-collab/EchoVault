import { beforeAll, describe, expect, it } from "vitest";
import { call, musicWav, validPoe, wavForm } from "./helpers";
import * as register from "@/app/api/v1/auth/register/route";
import * as login from "@/app/api/v1/auth/login/route";
import * as me from "@/app/api/v1/me/route";
import * as password from "@/app/api/v1/me/password/route";
import * as artistTracks from "@/app/api/v1/artist/tracks/route";
import * as files from "@/app/api/v1/artist/tracks/[trackId]/files/route";
import * as poe from "@/app/api/v1/artist/tracks/[trackId]/poe/route";
import * as submit from "@/app/api/v1/artist/tracks/[trackId]/submit/route";
import * as approve from "@/app/api/v1/admin/tracks/[trackId]/approve/route";
import * as artwork from "@/app/api/v1/vault/tracks/[trackId]/artwork/route";
import * as artists from "@/app/api/v1/artists/[artistId]/route";
import * as vault from "@/app/api/v1/vault/tracks/route";
import * as checkout from "@/app/api/v1/checkout/session/route";
import * as webhook from "@/app/api/v1/webhooks/stripe/route";
import * as earnings from "@/app/api/v1/artist/earnings/route";
import * as disputes from "@/app/api/v1/disputes/route";
import * as dispute from "@/app/api/v1/admin/disputes/[disputeId]/route";
import * as evidence from "@/app/api/v1/admin/disputes/[disputeId]/evidence/route";
import * as adminLicenses from "@/app/api/v1/admin/licenses/route";
import * as audit from "@/app/api/v1/admin/audit/route";
import * as terms from "@/app/api/v1/admin/terms/route";
import * as activate from "@/app/api/v1/admin/terms/[termsId]/activate/route";
import * as users from "@/app/api/v1/admin/users/route";
import * as role from "@/app/api/v1/admin/users/[userId]/role/route";
import { createSession, hashPassword } from "@/server/auth";
import { query, queryOne } from "@/server/db";
import { buildSignedStubEvent } from "@/server/payments";
import { drainJobs } from "@/server/worker";
import { pngImage } from "@/scripts/synth";

let artist: string, artistId: string, buyer: string, reviewer: string, admin: string, support: string;
let trackId: string, licenseId: string;

async function signUp(role: "buyer" | "artist", email: string) {
  const r = await call(register.POST, { json: { email, password: "correct horse battery", display_name: "N", role, artist_name: role === "artist" ? "Nordlys" : undefined } });
  return { token: r.body.data.token as string, id: r.body.data.user.id as string };
}
async function staff(r: string, email: string) {
  const u = await queryOne<{ id: string }>("INSERT INTO users (email, role, display_name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id", [email, r, r, await hashPassword("staff password 123")]);
  return (await createSession(u!.id)).token;
}

beforeAll(async () => {
  ({ token: artist, id: artistId } = await signUp("artist", "nordlys@pages.test"));
  ({ token: buyer } = await signUp("buyer", "buyer@pages.test"));
  reviewer = await staff("reviewer", "reviewer@pages.test");
  admin = await staff("admin", "admin@pages.test");
  support = await staff("support", "support@pages.test");

  const draft = await call(artistTracks.POST, { token: artist, json: { title: "Aurora Run", genre: "Synthwave", mood: "Driving", bpm: 110 } });
  trackId = draft.body.data.track.id;
  await call(files.POST, { token: artist, params: { trackId }, form: wavForm(musicWav(6)) });
  const art = new FormData();
  art.set("kind", "artwork_image");
  art.set("file", new File([pngImage(64, 7) as BlobPart], "cover.png", { type: "image/png" }));
  expect((await call(files.POST, { token: artist, params: { trackId }, form: art })).status).toBe(201);
  await call(poe.PUT, { method: "PUT", token: artist, params: { trackId }, json: validPoe });
  await call(submit.POST, { method: "POST", token: artist, params: { trackId } });
  await drainJobs();
});

describe("artwork + artist profile", () => {
  it("hides artwork and profile until the track is approved", async () => {
    expect((await call(artwork.GET, { params: { trackId } })).status).toBe(404);
    expect((await call(artwork.GET, { token: artist, params: { trackId } })).status).toBe(200); // owner may see it
    expect((await call(artists.GET, { params: { artistId } })).status).toBe(404);
  });

  it("serves public, cacheable artwork and a profile after approval", async () => {
    expect((await call(approve.POST, { token: reviewer, params: { trackId }, json: {} })).status).toBe(200);
    const a = await call(artwork.GET, { params: { trackId } });
    expect(a.status).toBe(200);
    expect(a.headers.get("content-type")).toBe("image/png");
    expect(a.headers.get("cache-control")).toContain("public");
    const p = await call(artists.GET, { params: { artistId } });
    expect(p.body.data.artist.name).toBe("Nordlys");
    expect(p.body.data.tracks.map((t: { id: string }) => t.id)).toEqual([trackId]);
    expect(JSON.stringify(p.body)).not.toContain("nordlys@pages.test");
  });

  it("filters the catalog", async () => {
    const hit = await call(vault.GET, { path: "/api/v1/vault/tracks?genre=synthwave&bpm_min=100&bpm_max=120&max_duration=10" });
    expect(hit.body.data.tracks.map((t: { id: string }) => t.id)).toContain(trackId);
    const miss = await call(vault.GET, { path: "/api/v1/vault/tracks?genre=synthwave&bpm_min=130" });
    expect(miss.body.data.tracks).toHaveLength(0);
  });
});

describe("account settings", () => {
  it("updates profile and bio", async () => {
    const r = await call(me.PATCH, { method: "PATCH", token: artist, json: { bio: "Oslo-based hybrid producer.", artist_name: "Nordlys" } });
    expect(r.body.data.profile).toMatchObject({ bio: "Oslo-based hybrid producer.", has_password: true });
    expect((await call(me.PATCH, { method: "PATCH", token: artist, json: { artist_name: null } })).status).toBe(422);
  });

  it("changes password only with the current one, and signs out other sessions", async () => {
    const other = (await call(login.POST, { json: { email: "buyer@pages.test", password: "correct horse battery" } })).body.data.token;
    expect((await call(password.POST, { token: buyer, json: { current_password: "wrong", new_password: "new horse battery 2" } })).status).toBe(422);
    expect((await call(password.POST, { token: buyer, json: { current_password: "correct horse battery", new_password: "new horse battery 2" } })).status).toBe(200);
    expect((await call(me.GET, { token: other })).status).toBe(401);
    expect((await call(me.GET, { token: buyer })).status).toBe(200);
    expect((await call(login.POST, { json: { email: "buyer@pages.test", password: "new horse battery 2" } })).status).toBe(200);
  });
});

describe("earnings, licenses, disputes", () => {
  it("shows the artist their 70% of each sale", async () => {
    const s = await call(checkout.POST, { token: buyer, json: { track_id: trackId, tier: "agency", terms_accepted: true } });
    const { payload, signature } = buildSignedStubEvent({ id: s.body.data.stripe_session_id, amountCents: 19900, currency: "EUR", metadata: {} });
    const w = await call(webhook.POST, { raw: payload, headers: { "stripe-signature": signature } });
    licenseId = w.body.data.license_id;
    const e = await call(earnings.GET, { token: artist });
    expect(e.body.data.totals).toMatchObject({ licenses: 1, gross_cents: 19900, artist_cents: 13930 });
    expect(e.body.data.by_track[0]).toMatchObject({ track_id: trackId, licenses: 1 });
    expect((await call(earnings.GET, { token: buyer })).status).toBe(403);
  });

  it("lists licenses for support with platform totals; buyers are refused", async () => {
    const r = await call(adminLicenses.GET, { token: support, path: "/api/v1/admin/licenses?q=aurora" });
    expect(r.body.data.licenses.map((l: { id: string }) => l.id)).toContain(licenseId);
    expect((await call(adminLicenses.GET, { token: buyer })).status).toBe(403);
  });

  it("resolves a dispute with notes and exports an evidence pack", async () => {
    const d = await call(disputes.POST, { token: buyer, json: { license_id: licenseId, claim_summary: "A platform flagged my video for this track.", reason_category: "content_id_claim" } });
    const id = d.body.data.id;
    expect((await call(dispute.PATCH, { method: "PATCH", token: support, params: { disputeId: id }, json: { status: "resolved_invalid" } })).status).toBe(422);
    const ok = await call(dispute.PATCH, { method: "PATCH", token: support, params: { disputeId: id }, json: { status: "resolved_invalid", resolution_notes: "Claim released after we sent the certificate." } });
    expect(ok.body.data.status).toBe("resolved_invalid");
    const detail = await call(dispute.GET, { token: support, params: { disputeId: id } });
    expect(detail.body.data.dispute).toMatchObject({ status: "resolved_invalid", resolved_by: "support@pages.test" });

    const pack = await call(evidence.GET, { token: support, params: { disputeId: id } });
    expect(pack.headers.get("content-disposition")).toContain("attachment");
    expect(pack.body.license.terms_snapshot.version).toBe("0.1-draft");
    expect(pack.body.proof_of_effort_snapshot.rights_warranty_accepted).toBe(true);
    expect(pack.body.files.find((f: { kind: string }) => f.kind === "high_res_wav").checksum_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect((await call(evidence.GET, { token: buyer, params: { disputeId: id } })).status).toBe(403);
  });

  it("audit log is browsable by support and filterable", async () => {
    const r = await call(audit.GET, { token: support, path: "/api/v1/admin/audit?entity_type=dispute" });
    expect(r.body.data.entries.length).toBeGreaterThan(0);
    expect(r.body.data.entries.every((e: { entity_type: string }) => e.entity_type === "dispute")).toBe(true);
  });
});

describe("terms versions + users (admin)", () => {
  it("creates a new version, activates it, and new checkouts use it while old licenses keep theirs", async () => {
    expect((await call(terms.GET, { token: support })).status).toBe(403);
    const body = { tier: "agency", version: "1.0", title: "Agency License 1.0", terms_md: "Reviewed by counsel. ".repeat(5), price_cents: 24900, artist_share_bps: 7500 };
    const c = await call(terms.POST, { token: admin, json: body });
    expect(c.status).toBe(201);
    expect((await call(terms.POST, { token: admin, json: body })).status).toBe(409);
    await call(activate.POST, { token: admin, params: { termsId: c.body.data.id }, method: "POST" });

    const active = await query<{ version: string }>("SELECT version FROM license_terms_versions WHERE tier = 'agency' AND active");
    expect(active.map((a) => a.version)).toEqual(["1.0"]);
    const old = await queryOne<{ version: string }>("SELECT tv.version FROM purchased_licenses l JOIN license_terms_versions tv ON tv.id = l.terms_version_id WHERE l.id = $1", [licenseId]);
    expect(old!.version).toBe("0.1-draft");
    const s = await call(checkout.POST, { token: (await signUp("buyer", "late@pages.test")).token, json: { track_id: trackId, tier: "agency", terms_accepted: true } });
    const ps = await queryOne<{ amount_cents: number }>("SELECT amount_cents FROM payment_sessions WHERE id = $1", [s.body.data.payment_session_id]);
    expect(ps!.amount_cents).toBe(24900);
  });

  it("changes roles (not your own) and revokes the user's sessions", async () => {
    const list = await call(users.GET, { token: admin, path: "/api/v1/admin/users?q=buyer@pages.test" });
    const target = list.body.data.users[0];
    expect(target.email).toBe("buyer@pages.test");
    const r = await call(role.POST, { token: admin, params: { userId: target.id }, json: { role: "artist" } });
    expect(r.body.data.role).toBe("artist");
    expect((await call(me.GET, { token: buyer })).status).toBe(401);
    const self = await queryOne<{ user_id: string }>("SELECT user_id FROM sessions WHERE token_hash = encode(sha256($1::bytea), 'hex')", [admin]);
    expect((await call(role.POST, { token: admin, params: { userId: self!.user_id }, json: { role: "buyer" } })).status).toBe(403);
    expect((await call(role.POST, { token: reviewer, params: { userId: target.id }, json: { role: "admin" } })).status).toBe(403);
  });
});
