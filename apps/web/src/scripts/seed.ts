import "./load-env";
/**
 * Local/staging seed. Idempotent for users; demo tracks are created once.
 *   pnpm db:seed            → staff + demo accounts
 *   pnpm db:seed --demo     → also runs 3 synthetic demo tracks through the REAL pipeline
 *                             (upload → PoE → submit → EchoScore → approve). Needs EchoScore running.
 * Demo audio is synthesised in code — no third-party music.
 */
import { closePool, query, queryOne } from "../server/db";
import { hashPassword, type SessionUser } from "../server/auth";
import { createDraft, saveProofOfEffort, submitTrack, uploadTrackFile } from "../server/services/artist";
import { approveTrack } from "../server/services/review";
import { drainJobs } from "../server/worker";
import { musicWav } from "./synth";

const PASSWORD = process.env.SEED_PASSWORD ?? "echovault-dev-password";

async function user(email: string, role: string, display: string, artist?: string): Promise<SessionUser> {
  const row = await queryOne<SessionUser>(
    `INSERT INTO users (email, role, display_name, artist_name, password_hash) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role RETURNING id, role, email, display_name, artist_name`,
    [email, role, display, artist ?? null, await hashPassword(PASSWORD)]
  );
  return row!;
}

async function main() {
  const admin = await user("admin@echovault.local", "admin", "Admin");
  const reviewer = await user("reviewer@echovault.local", "reviewer", "Reviewer");
  const artist = await user("artist@echovault.local", "artist", "Demo Artist", "Glass Signal");
  await user("buyer@echovault.local", "buyer", "Demo Buyer");
  console.log(`accounts (password: ${process.env.SEED_PASSWORD ? "$SEED_PASSWORD" : PASSWORD}):`);
  for (const e of ["admin", "reviewer", "artist", "buyer"]) console.log(`  ${e}@echovault.local`);

  if (!process.argv.includes("--demo")) return;
  const existing = await query("SELECT 1 FROM tracks WHERE artist_id = $1", [artist.id]);
  if (existing.length) {
    console.log("demo tracks already exist — skipping");
    return;
  }
  const demos = [
    { title: "Neon Harbor", genre: "Electronic", mood: "Cinematic", bpm: 124, root: 220 },
    { title: "Glass Signal", genre: "Ambient", mood: "Calm", bpm: 90, root: 196 },
    { title: "Night Shift Loop", genre: "Lo-fi", mood: "Focused", bpm: 82, root: 174.6 }
  ];
  const rid = "seed";
  for (const d of demos) {
    const track = await createDraft(artist, { title: d.title, genre: d.genre, mood: d.mood, bpm: d.bpm, description: `Synthetic demo track (${d.genre.toLowerCase()}) generated for local testing.` }, rid);
    await uploadTrackFile(artist, track.id, { kind: "high_res_wav", bytes: musicWav(30, { root: d.root }), filename: `${d.title}.wav`, mimeType: "audio/wav" }, rid);
    await saveProofOfEffort(
      artist,
      track.id,
      {
        creation_mode: "hybrid_producer",
        ai_tools_used: ["Synthetic generator"],
        process_summary: "Synthesised in code for the EchoVault demo catalog; no third-party material.",
        daw_manual_work: "Programmatic arrangement",
        time_spent_bucket: "under_1h",
        samples_used: "none",
        voice_or_likeness_used: false,
        named_artist_imitation: false,
        rights_warranty_accepted: true
      },
      rid
    );
    await submitTrack(artist, track.id, rid);
    console.log(`submitted ${d.title}`);
  }
  await drainJobs();
  const pending = await query<{ id: string; title: string; status: string }>("SELECT id, title, status FROM tracks WHERE artist_id = $1", [artist.id]);
  for (const t of pending) {
    if (t.status === "needs_human_review") {
      await approveTrack(reviewer, t.id, { reason_code: "meets_standard", notes: "Seeded demo" }, rid).catch((e) =>
        approveTrack(reviewer, t.id, { reason_code: "meets_standard", override_reason: `Seeded demo: ${(e as Error).message}` }, rid)
      );
      console.log(`approved ${t.title}`);
    } else console.log(`${t.title}: ${t.status} (is the EchoScore service running?)`);
  }
  void admin;
}

main()
  .then(() => closePool())
  .catch(async (e) => {
    console.error(e);
    await closePool();
    process.exit(1);
  });
