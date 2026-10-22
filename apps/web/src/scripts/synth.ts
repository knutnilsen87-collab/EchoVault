import { deflateSync } from "node:zlib";

/** Deterministic synthetic audio for tests, seeds and demos (no copyrighted material). */
/** 16-bit 44.1 kHz stereo WAV with a broadband, music-like signal (passes EchoScore). */
export function musicWav(seconds = 8, opts: { gain?: number; clip?: boolean; root?: number } = {}): Uint8Array {
  const sr = 44100;
  const n = Math.floor(seconds * sr);
  const gain = opts.gain ?? 0.3;
  const data = new Int16Array(n * 2);
  let seed = 7;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    let tones = 0;
    for (const f of [opts.root ?? 220, (opts.root ?? 220) * 1.26, (opts.root ?? 220) * 1.498]) for (let k = 1; k < 12; k++) tones += Math.sin(2 * Math.PI * f * k * t) / k;
    tones /= 6;
    const kick = t % 0.5 < 0.12 ? Math.sin(2 * Math.PI * 55 * t) : 0;
    const hats = (t % 0.25 < 0.03 ? rand() * 0.5 : 0) + rand() * 0.01;
    for (let c = 0; c < 2; c++) {
      let v = gain * ((c ? 0.9 : 1) * tones + 0.6 * kick + hats);
      if (opts.clip) v = Math.max(-1, Math.min(1, v * 10));
      data[i * 2 + c] = Math.round(Math.max(-1, Math.min(1, v)) * 32767);
    }
  }
  const bytes = new Uint8Array(44 + data.byteLength);
  const view = new DataView(bytes.buffer);
  const w = (o: number, s: string) => [...s].forEach((ch, i) => view.setUint8(o + i, ch.charCodeAt(0)));
  w(0, "RIFF");
  view.setUint32(4, 36 + data.byteLength, true);
  w(8, "WAVE");
  w(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 2, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * 4, true);
  view.setUint16(32, 4, true);
  view.setUint16(34, 16, true);
  w(36, "data");
  view.setUint32(40, data.byteLength, true);
  bytes.set(new Uint8Array(data.buffer), 44);
  return bytes;
}


/**
 * Deterministic abstract cover art (PNG) — dark gradient with a neon ring, seeded per track.
 * Pure Node (zlib), so seeds/tests need no image library.
 */
export function pngImage(size = 512, seed = 1): Uint8Array {
  const hue = (seed * 47) % 360;
  const hsl = (h: number, s: number, l: number) => {
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
    };
    return [f(0), f(8), f(4)] as const;
  };
  const [r1, g1, b1] = hsl(hue, 0.6, 0.12);
  const [r2, g2, b2] = hsl((hue + 60) % 360, 0.9, 0.55);
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x / size - 0.5;
      const dy = y / size - 0.5;
      const d = Math.sqrt(dx * dx + dy * dy);
      const ring = Math.exp(-Math.pow((d - 0.28) / 0.025, 2));
      const glow = Math.max(0, 1 - d * 1.6) * 0.35;
      const t = Math.min(1, ring + glow);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = Math.round(r1 + (r2 - r1) * t);
      raw[o + 1] = Math.round(g1 + (g2 - g1) * t);
      raw[o + 2] = Math.round(b1 + (b2 - b1) * t);
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return new Uint8Array(
    Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))])
  );
}
