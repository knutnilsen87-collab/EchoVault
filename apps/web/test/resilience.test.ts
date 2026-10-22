import { describe, expect, it } from "vitest";
import { call, musicWav, validPoe, wavForm } from "./helpers";
import * as register from "@/app/api/v1/auth/register/route";
import * as artistTracks from "@/app/api/v1/artist/tracks/route";
import * as files from "@/app/api/v1/artist/tracks/[trackId]/files/route";
import * as poe from "@/app/api/v1/artist/tracks/[trackId]/poe/route";
import * as submit from "@/app/api/v1/artist/tracks/[trackId]/submit/route";
import { query, queryOne } from "@/server/db";
import { drainJobs } from "@/server/worker";

describe("EchoScore outage", () => {
  it("retries with backoff, then marks analysis_failed instead of publishing", async () => {
    const reg = await call(register.POST, {
      json: { email: "outage@echovault.test", password: "correct horse battery", display_name: "o", role: "artist", artist_name: "Outage" }
    });
    const token = reg.body.data.token;
    const draft = await call(artistTracks.POST, { token, json: { title: "Outage", genre: "Ambient" } });
    const id = draft.body.data.track.id;
    await call(files.POST, { token, params: { trackId: id }, form: wavForm(musicWav(6)) });
    await call(poe.PUT, { method: "PUT", token, params: { trackId: id }, json: validPoe });
    await call(submit.POST, { method: "POST", token, params: { trackId: id } });

    const original = process.env.ECHOSCORE_SERVICE_URL;
    const { resetEnvCache } = await import("@/server/env");
    process.env.ECHOSCORE_SERVICE_URL = "http://127.0.0.1:1"; // nothing listens here
    resetEnvCache();
    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        await drainJobs(["echoscore_analyze"]);
        await query("UPDATE jobs SET run_after = now() WHERE kind = 'echoscore_analyze' AND status = 'queued'"); // skip backoff wait
      }
    } finally {
      process.env.ECHOSCORE_SERVICE_URL = original;
      resetEnvCache();
    }
    const job = await queryOne<{ status: string; attempts: number }>("SELECT status, attempts FROM jobs WHERE kind = 'echoscore_analyze' AND payload->>'track_id' = $1", [id]);
    expect(job).toMatchObject({ status: "failed", attempts: 3 });
    const track = await queryOne<{ status: string }>("SELECT status FROM tracks WHERE id = $1", [id]);
    expect(track!.status).toBe("analysis_failed");
  });
});
