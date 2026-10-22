import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatEur, TIER_LABELS, type LicenseTier } from "@echovault/domain";

export type CertificateData = {
  certificateId: string;
  licenseId: string;
  trackTitle: string;
  trackId: string;
  artistName: string;
  artistId: string;
  buyerName: string;
  buyerEmail: string;
  tier: LicenseTier;
  termsVersion: string;
  pricePaidCents: number;
  currency: string;
  whitelistedUrl: string | null;
  projectOrClientName: string | null;
  purchasedAt: Date;
  verificationUrl: string;
};

/** Required disclaimer — EchoVault_Licensing_Model.md. Do not soften without legal review. */
export const CERTIFICATE_DISCLAIMER =
  "This certificate documents platform license grant and purchase record. It is not a guarantee that third parties will never assert claims.";

// Standard PDF fonts are WinAnsi only; strip anything else instead of crashing.
const ansi = (s: string) => s.replace(/[–—]/g, "-").replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

export async function renderCertificatePdf(d: CertificateData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`EchoVault License Certificate ${d.licenseId}`);
  doc.setAuthor("EchoVault");
  doc.setCreationDate(d.purchasedAt);
  const page = doc.addPage([595.28, 841.89]); // A4
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const ink = rgb(0.06, 0.06, 0.06);
  const muted = rgb(0.4, 0.4, 0.4);
  const accent = rgb(0, 0.55, 0.62);

  let y = 780;
  page.drawText("ECHOVAULT", { x: 50, y, size: 10, font: mono, color: accent });
  y -= 30;
  page.drawText("License Certificate", { x: 50, y, size: 26, font: bold, color: ink });
  y -= 20;
  page.drawText(ansi(`${TIER_LABELS[d.tier].name} License - terms version ${d.termsVersion}`), { x: 50, y, size: 12, font: regular, color: muted });
  y -= 36;

  const rows: [string, string][] = [
    ["License ID", d.licenseId],
    ["Certificate ID", d.certificateId],
    ["Track", d.trackTitle],
    ["Track ID", d.trackId],
    ["Artist", d.artistName],
    ["Artist ID", d.artistId],
    ["Licensee", `${d.buyerName} <${d.buyerEmail}>`],
    ["Purchased", d.purchasedAt.toISOString()],
    ["Amount paid", `${formatEur(d.pricePaidCents).replace("€", "EUR ")} (${d.currency})`],
    ...(d.projectOrClientName ? ([["Project / client", d.projectOrClientName]] as [string, string][]) : []),
    ...(d.whitelistedUrl ? ([["Channel / URL", d.whitelistedUrl]] as [string, string][]) : [])
  ];
  for (const [label, value] of rows) {
    page.drawText(label.toUpperCase(), { x: 50, y, size: 8, font: mono, color: muted });
    page.drawText(ansi(value).slice(0, 90), { x: 170, y, size: 10, font: label.endsWith("ID") ? mono : regular, color: ink });
    y -= 20;
  }

  y -= 16;
  page.drawText("PERMITTED USE", { x: 50, y, size: 8, font: mono, color: muted });
  y -= 16;
  page.drawText(ansi(TIER_LABELS[d.tier].allowed), { x: 50, y, size: 11, font: regular, color: ink });
  y -= 24;
  page.drawText("LIMITS", { x: 50, y, size: 8, font: mono, color: muted });
  y -= 16;
  page.drawText(ansi(TIER_LABELS[d.tier].limits), { x: 50, y, size: 11, font: regular, color: ink });
  y -= 30;
  page.drawText(ansi("The full license terms for the version above apply and are stored with this purchase record."), { x: 50, y, size: 9, font: regular, color: muted });

  y -= 40;
  page.drawText("VERIFY", { x: 50, y, size: 8, font: mono, color: muted });
  y -= 16;
  page.drawText(ansi(d.verificationUrl), { x: 50, y, size: 10, font: mono, color: accent });

  // Disclaimer, wrapped.
  y = 110;
  const words = CERTIFICATE_DISCLAIMER.split(" ");
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (regular.widthOfTextAtSize(next, 9) > 495) {
      page.drawText(line, { x: 50, y, size: 9, font: regular, color: muted });
      y -= 13;
      line = w;
    } else line = next;
  }
  if (line) page.drawText(line, { x: 50, y, size: 9, font: regular, color: muted });

  return doc.save();
}
