/** Minimal RIFF/WAVE header parser: enough to reject non-WAV uploads and read duration. */
export type WavInfo = {
  format: "pcm" | "float" | "extensible";
  channels: number;
  sampleRate: number;
  bitsPerSample: number;
  durationSeconds: number;
};

export function parseWav(bytes: Uint8Array): WavInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (off: number) => String.fromCharCode(bytes[off]!, bytes[off + 1]!, bytes[off + 2]!, bytes[off + 3]!);
  if (bytes.byteLength < 44 || ascii(0) !== "RIFF" || ascii(8) !== "WAVE") throw new Error("NOT_A_WAV_FILE");

  let offset = 12;
  let fmt: Omit<WavInfo, "durationSeconds"> | null = null;
  let byteRate = 0;
  let dataBytes: number | null = null;

  while (offset + 8 <= bytes.byteLength) {
    const id = ascii(offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === "fmt ") {
      const code = view.getUint16(body, true);
      const format = code === 1 ? "pcm" : code === 3 ? "float" : code === 0xfffe ? "extensible" : null;
      if (!format) throw new Error("UNSUPPORTED_WAV_ENCODING");
      fmt = {
        format,
        channels: view.getUint16(body + 2, true),
        sampleRate: view.getUint32(body + 4, true),
        bitsPerSample: view.getUint16(body + 14, true)
      };
      byteRate = view.getUint32(body + 8, true);
    } else if (id === "data") {
      // Streaming writers sometimes leave size 0/0xFFFFFFFF; fall back to remaining bytes.
      dataBytes = size === 0 || size === 0xffffffff ? bytes.byteLength - body : Math.min(size, bytes.byteLength - body);
      break;
    }
    offset = body + size + (size % 2);
  }

  if (!fmt || dataBytes === null || byteRate === 0) throw new Error("CORRUPT_WAV_FILE");
  if (fmt.channels < 1 || fmt.channels > 8 || fmt.sampleRate < 8000 || fmt.sampleRate > 384000) throw new Error("UNSUPPORTED_WAV_ENCODING");
  return { ...fmt, durationSeconds: dataBytes / byteRate };
}
