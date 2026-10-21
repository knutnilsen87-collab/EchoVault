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

