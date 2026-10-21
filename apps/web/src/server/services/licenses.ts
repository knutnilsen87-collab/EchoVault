import { createHash } from "node:crypto";
import { TIER_LABELS, type LicenseTier } from "@echovault/domain";
import { writeAudit } from "../audit";
import type { SessionUser } from "../auth";
import { query, queryOne, withTransaction } from "../db";
import { env } from "../env";
import { AppError, notFound } from "../errors";
import { storage } from "../storage";
import { renderCertificatePdf } from "./certificate-pdf";

const DOWNLOAD_TTL_SECONDS = 15 * 60;

export type LicenseRow = {
  id: string;
  track_id: string;
  track_title: string;
  artist_name: string;
  tier: LicenseTier;
  terms_version: string;
  price_paid_cents: number;
  currency: string;
  whitelisted_url: string | null;
  project_or_client_name: string | null;
  purchased_at: string;
  status: string;
  certificate_id: string | null;
  track_status: string;
};

/** Current status = latest append-only license event. */
const LICENSE_SELECT = `
  SELECT l.id, l.track_id, t.title AS track_title, COALESCE(a.artist_name, a.display_name) AS artist_name, l.tier,
         tv.version AS terms_version, l.price_paid_cents, l.currency, l.whitelisted_url, l.project_or_client_name, l.purchased_at,
         COALESCE((SELECT type FROM license_events e WHERE e.license_id = l.id AND e.type <> 'delivered' ORDER BY e.created_at DESC LIMIT 1), 'paid') AS status,
         c.id AS certificate_id, t.status AS track_status
    FROM purchased_licenses l
    JOIN tracks t ON t.id = l.track_id
    JOIN users a ON a.id = l.artist_id
    JOIN license_terms_versions tv ON tv.id = l.terms_version_id
    LEFT JOIN certificates c ON c.license_id = l.id`;

export async function listBuyerLicenses(user: SessionUser): Promise<LicenseRow[]> {
  return query<LicenseRow>(`${LICENSE_SELECT} WHERE l.buyer_id = $1 ORDER BY l.purchased_at DESC`, [user.id]);
}

async function ownedLicense(user: SessionUser, licenseId: string): Promise<LicenseRow & { buyer_id: string }> {
  const row = await queryOne<LicenseRow & { buyer_id: string }>(`${LICENSE_SELECT.replace("SELECT l.id,", "SELECT l.buyer_id, l.id,")} WHERE l.id = $1`, [licenseId]);
  // Same response for "missing" and "not yours" so license ids can't be probed (AC-010).
  if (!row || (row.buyer_id !== user.id && !["admin", "support", "finance"].includes(user.role))) throw notFound("License");
  return row;
}

export async function getLicense(user: SessionUser, licenseId: string) {
  const license = await ownedLicense(user, licenseId);
  const events = await query<{ type: string; created_at: string }>("SELECT type, created_at FROM license_events WHERE license_id = $1 ORDER BY created_at", [licenseId]);
  const snapshot = await queryOne<{ terms_snapshot: { title: string; terms_md: string } | null }>("SELECT terms_snapshot FROM purchased_licenses WHERE id = $1", [licenseId]);
  const { buyer_id: _b, ...rest } = license;
  return { license: rest, events, terms: snapshot?.terms_snapshot ?? null, tier: TIER_LABELS[license.tier] };
}

/** AC-009 / AC-010: owner-only, expiring URL, never the storage key. */
export async function createDownloadLink(user: SessionUser, licenseId: string, requestId: string) {
  const license = await ownedLicense(user, licenseId);
  if (license.status === "refunded") throw new AppError("FORBIDDEN", "This license was refunded.");
  const file = await queryOne<{ id: string; storage_key: string; original_filename: string | null }>(
    "SELECT id, storage_key, original_filename FROM track_files WHERE track_id = $1 AND kind = 'high_res_wav'",
    [license.track_id]
  );
  if (!file) throw new AppError("SERVICE_UNAVAILABLE", "High-res file is not available. Support has been notified.");
  const safeTitle = license.track_title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "_") || "track";
  const signed = await (await storage()).signedUrl(file.storage_key, {
    expiresInSeconds: DOWNLOAD_TTL_SECONDS,
    downloadName: `${safeTitle}_EchoVault_${license.id.slice(0, 8)}.wav`,
    contentType: "audio/wav"
  });
  await withTransaction(async (tx) => {
    const delivered = await tx.query("SELECT 1 FROM license_events WHERE license_id = $1 AND type = 'delivered'", [licenseId]);
    if (delivered.rowCount === 0) await tx.query("INSERT INTO license_events (license_id, type) VALUES ($1, 'delivered')", [licenseId]);
    await writeAudit(tx, { actorUserId: user.id, entityType: "purchased_license", entityId: licenseId, action: "license.download_link_created", metadata: { file_id: file.id, expires_at: signed.expiresAt }, requestId });
  });
  return { file_id: file.id, url: signed.url, expires_at: signed.expiresAt, file_type: "audio/wav", license_id: license.id, track_id: license.track_id };
}

export async function certificateDownloadUrl(user: SessionUser, licenseId: string) {
  await ownedLicense(user, licenseId);
  const cert = await queryOne<{ storage_key: string }>(
    "SELECT f.storage_key FROM certificates c JOIN track_files f ON f.id = c.file_id WHERE c.license_id = $1",
    [licenseId]
  );
  if (!cert) throw new AppError("INVALID_STATE", "Certificate is still being generated.");
  return (await (await storage()).signedUrl(cert.storage_key, { expiresInSeconds: 600, downloadName: `EchoVault_License_${licenseId.slice(0, 8)}.pdf`, contentType: "application/pdf" })).url;
}

/** Idempotent: safe to run from the webhook (inline) and again from the worker. */
export async function generateCertificate(licenseId: string): Promise<{ certificate_id: string; created: boolean }> {
  const existing = await queryOne<{ id: string }>("SELECT id FROM certificates WHERE license_id = $1", [licenseId]);
  if (existing) return { certificate_id: existing.id, created: false };

  const data = await queryOne<{
    id: string;
    track_id: string;
    track_title: string;
    artist_name: string;
    artist_id: string;
    buyer_name: string;
    buyer_email: string;
    tier: LicenseTier;
    terms_version: string;
    price_paid_cents: number;
    currency: string;
    whitelisted_url: string | null;
    project_or_client_name: string | null;
    purchased_at: Date;
  }>(
    `SELECT l.id, l.track_id, t.title AS track_title, COALESCE(a.artist_name, a.display_name) AS artist_name, l.artist_id,
            COALESCE(b.display_name, b.email) AS buyer_name, b.email AS buyer_email, l.tier, tv.version AS terms_version,
            l.price_paid_cents, l.currency, l.whitelisted_url, l.project_or_client_name, l.purchased_at
       FROM purchased_licenses l JOIN tracks t ON t.id = l.track_id JOIN users a ON a.id = l.artist_id
       JOIN users b ON b.id = l.buyer_id JOIN license_terms_versions tv ON tv.id = l.terms_version_id
      WHERE l.id = $1`,
    [licenseId]
  );
  if (!data) throw new Error("LICENSE_NOT_FOUND");

  const certificateId = crypto.randomUUID();
  const pdf = await renderCertificatePdf({
    certificateId,
    licenseId: data.id,
    trackTitle: data.track_title,
    trackId: data.track_id,
    artistName: data.artist_name,
    artistId: data.artist_id,
    buyerName: data.buyer_name,
    buyerEmail: data.buyer_email,
    tier: data.tier,
    termsVersion: data.terms_version,
    pricePaidCents: data.price_paid_cents,
    currency: data.currency,
    whitelistedUrl: data.whitelisted_url,
    projectOrClientName: data.project_or_client_name,
    purchasedAt: data.purchased_at,
    verificationUrl: `${env().NEXT_PUBLIC_APP_URL}/verify/${certificateId}`
  });
  const sha256 = createHash("sha256").update(pdf).digest("hex");
  const key = `certificates/${licenseId}/${certificateId}.pdf`;
  await (await storage()).put(key, pdf, "application/pdf");

  return withTransaction(async (tx) => {
    // Re-check under lock: a concurrent run may have won.
    await tx.query("SELECT 1 FROM purchased_licenses WHERE id = $1 FOR SHARE", [licenseId]);
    const raced = await tx.query<{ id: string }>("SELECT id FROM certificates WHERE license_id = $1", [licenseId]);
    if (raced.rows[0]) return { certificate_id: raced.rows[0].id, created: false };
    const file = await tx.query<{ id: string }>(
      `INSERT INTO track_files (track_id, kind, storage_key, original_filename, mime_type, size_bytes, checksum_sha256, is_public)
       VALUES ($1, 'certificate_pdf', $2, $3, 'application/pdf', $4, $5, FALSE) RETURNING id`,
      [data.track_id, key, `certificate_${licenseId}.pdf`, pdf.byteLength, sha256]
    );
    await tx.query("INSERT INTO certificates (id, license_id, file_id, sha256) VALUES ($1, $2, $3, $4)", [certificateId, licenseId, file.rows[0]!.id, sha256]);
    await tx.query("INSERT INTO license_events (license_id, type, metadata) VALUES ($1, 'certificate_generated', $2)", [licenseId, JSON.stringify({ certificate_id: certificateId })]);
    await writeAudit(tx, { actorUserId: null, entityType: "purchased_license", entityId: licenseId, action: "license.certificate_generated", metadata: { certificate_id: certificateId, sha256 } });
    return { certificate_id: certificateId, created: true };
  });
}

/** Public verification (no buyer email; buyer name is masked). */
export async function verifyCertificate(certificateId: string) {
  const row = await queryOne<{
    certificate_id: string;
    license_id: string;
    generated_at: string;
    sha256: string;
    track_title: string;
    track_id: string;
    artist_name: string;
    buyer_name: string;
    tier: LicenseTier;
    terms_version: string;
    purchased_at: string;
    project_or_client_name: string | null;
    whitelisted_url: string | null;
    status: string;
  }>(
    `SELECT c.id AS certificate_id, l.id AS license_id, c.generated_at, c.sha256, t.title AS track_title, t.id AS track_id,
            COALESCE(a.artist_name, a.display_name) AS artist_name, COALESCE(b.display_name, 'Licensee') AS buyer_name,
            l.tier, tv.version AS terms_version, l.purchased_at, l.project_or_client_name, l.whitelisted_url,
            COALESCE((SELECT type FROM license_events e WHERE e.license_id = l.id AND e.type IN ('paid','refunded','disputed') ORDER BY e.created_at DESC LIMIT 1), 'paid') AS status
       FROM certificates c JOIN purchased_licenses l ON l.id = c.license_id JOIN tracks t ON t.id = l.track_id
       JOIN users a ON a.id = l.artist_id JOIN users b ON b.id = l.buyer_id JOIN license_terms_versions tv ON tv.id = l.terms_version_id
      WHERE c.id = $1`,
    [certificateId]
  );
  if (!row) throw notFound("Certificate");
  const masked = row.buyer_name.replace(/(?<=^.)[^\s]+|(?<=\s.)[^\s]+/g, (m) => "•".repeat(Math.min(m.length, 6)));
  return {
    ...row,
    buyer_name: masked,
    validity: row.status === "refunded" ? "revoked" : row.status === "disputed" ? "under_review" : "valid",
    tier_summary: TIER_LABELS[row.tier]
  };
}
