import { createHmac, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "./env";

export type SignedUrl = { url: string; expiresAt: string };

export type StorageDriver = {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array>;
  exists(key: string): Promise<boolean>;
  /** Short-lived URL for a private object. Never hand out keys without this. */
  signedUrl(key: string, opts: { expiresInSeconds: number; downloadName?: string; contentType?: string }): Promise<SignedUrl>;
};

const KEY_RE = /^[a-z0-9][a-z0-9/_.-]{0,500}$/i;

export function assertSafeKey(key: string): void {
  if (!KEY_RE.test(key) || key.includes("..") || key.includes("//")) throw new Error("UNSAFE_STORAGE_KEY");
}

// ── Local driver (dev/CI) ──────────────────────────────────────────────
function localRoot(): string {
  return path.resolve(env().STORAGE_LOCAL_DIR);
}

function localPath(key: string): string {
  assertSafeKey(key);
  const full = path.resolve(localRoot(), key);
  if (!full.startsWith(localRoot() + path.sep)) throw new Error("UNSAFE_STORAGE_KEY");
  return full;
}

function signLocal(key: string, exp: number, name: string, type: string): string {
  return createHmac("sha256", env().AUTH_SECRET).update(`file|${key}|${exp}|${name}|${type}`).digest("base64url");
}

export function verifyLocalSignature(params: URLSearchParams): { key: string; name: string; type: string } | null {
  const key = params.get("key") ?? "";
  const exp = Number(params.get("exp"));
  const name = params.get("name") ?? "";
  const type = params.get("type") ?? "";
  const sig = params.get("sig") ?? "";
  if (!key || !Number.isFinite(exp) || exp * 1000 < Date.now()) return null;
  const expected = Buffer.from(signLocal(key, exp, name, type));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return { key, name, type };
}

const localDriver: StorageDriver = {
  async put(key, body) {
    const file = localPath(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  },
  async get(key) {
    return new Uint8Array(await readFile(localPath(key)));
  },
  async exists(key) {
    return stat(localPath(key)).then(
      () => true,
      () => false
    );
  },
  async signedUrl(key, opts) {
    assertSafeKey(key);
    const exp = Math.floor(Date.now() / 1000) + opts.expiresInSeconds;
    const name = opts.downloadName ?? "";
    const type = opts.contentType ?? "";
    const params = new URLSearchParams({ key, exp: String(exp), name, type, sig: signLocal(key, exp, name, type) });
    return {
      url: `${env().NEXT_PUBLIC_APP_URL}/api/v1/files/signed?${params.toString()}`,
      expiresAt: new Date(exp * 1000).toISOString()
    };
  }
};

// ── S3 / R2 driver (live) ──────────────────────────────────────────────
// NOTE: written against the AWS SDK v3 API but not yet exercised against a real bucket.
async function s3Driver(): Promise<StorageDriver> {
  const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const e = env();
  const client = new S3Client({
    region: e.S3_REGION,
    endpoint: e.S3_ENDPOINT || undefined,
    credentials: { accessKeyId: e.S3_ACCESS_KEY_ID!, secretAccessKey: e.S3_SECRET_ACCESS_KEY! }
  });
  const Bucket = e.S3_BUCKET_PRIVATE!;
  return {
    async put(key, body, contentType) {
      assertSafeKey(key);
      await client.send(new PutObjectCommand({ Bucket, Key: key, Body: body, ContentType: contentType }));
    },
    async get(key) {
      const out = await client.send(new GetObjectCommand({ Bucket, Key: key }));
      return out.Body!.transformToByteArray();
    },
    async exists(key) {
      return client.send(new HeadObjectCommand({ Bucket, Key: key })).then(
        () => true,
        () => false
      );
    },
    async signedUrl(key, opts) {
      const command = new GetObjectCommand({
        Bucket,
        Key: key,
        ResponseContentDisposition: opts.downloadName ? `attachment; filename="${opts.downloadName.replace(/"/g, "")}"` : undefined,
        ResponseContentType: opts.contentType
      });
      const url = await getSignedUrl(client, command, { expiresIn: opts.expiresInSeconds });
      return { url, expiresAt: new Date(Date.now() + opts.expiresInSeconds * 1000).toISOString() };
    }
  };
}

let driver: Promise<StorageDriver> | null = null;

export function storage(): Promise<StorageDriver> {
  if (!driver) driver = env().STORAGE_DRIVER === "s3" ? s3Driver() : Promise.resolve(localDriver);
  return driver;
}

export function resetStorage(): void {
  driver = null;
}
