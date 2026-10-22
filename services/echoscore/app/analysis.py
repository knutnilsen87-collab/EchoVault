"""EchoScore v0.2 — deterministic technical QA.

Measures what the Audio_Processing_Pipeline spec asks for: integrated loudness, true peak /
clipping, low-end ratio, spectral flatness, high-frequency rolloff, plus silence and stereo
phase. Thresholds are the spec's *starting proposal* and must be tuned on real submissions.

EchoScore never decides legal approval. A human reviewer always does.
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field

import numpy as np
import pyloudnorm
import soundfile as sf
from scipy.signal import resample_poly

ANALYSIS_VERSION = "echoscore-v0.2"
PASS_SCORE = 70.0
MAX_ANALYSIS_SECONDS = 600  # spectral stats use at most the first 10 minutes


class UnreadableAudio(Exception):
    pass


@dataclass
class Result:
    score: float
    passed: bool
    metrics: dict[str, float | int | None]
    flags: list[str] = field(default_factory=list)
    feedback: list[str] = field(default_factory=list)


def _db(x: float) -> float:
    return float(20 * np.log10(max(x, 1e-12)))


def decode(data: bytes) -> tuple[np.ndarray, int]:
    try:
        audio, sr = sf.read(io.BytesIO(data), dtype="float64", always_2d=True)
    except Exception as exc:  # soundfile raises several types
        raise UnreadableAudio(str(exc)) from exc
    if audio.size == 0:
        raise UnreadableAudio("empty audio stream")
    if not np.all(np.isfinite(audio)):
        raise UnreadableAudio("non-finite samples")
    return audio, int(sr)


def analyze(data: bytes) -> Result:
    audio, sr = decode(data)
    n, channels = audio.shape
    duration = n / sr
    mono = audio.mean(axis=1)

    # Loudness (ITU-R BS.1770 via pyloudnorm). Needs ≥ 0.4 s.
    meter = pyloudnorm.Meter(sr)
    try:
        lufs = float(meter.integrated_loudness(audio if channels <= 5 else mono))
    except Exception:
        lufs = float("-inf")
    if not np.isfinite(lufs):
        lufs = -70.0

    sample_peak = float(np.max(np.abs(audio)))
    # True peak: 4x oversampling per channel (approximation of BS.1770 Annex 2).
    seg = audio[: min(n, sr * MAX_ANALYSIS_SECONDS)]
    true_peak = max(float(np.max(np.abs(resample_poly(seg[:, c], 4, 1)))) for c in range(channels))
    clipped_ratio = float(np.mean(np.abs(audio) >= 0.999))

    # Spectral statistics on 2048-point frames of the mono mixdown.
    frame, hop = 2048, 1024
    x = mono[: min(n, sr * MAX_ANALYSIS_SECONDS)]
    if len(x) < frame:
        x = np.pad(x, (0, frame - len(x)))
    count = 1 + (len(x) - frame) // hop
    idx = np.arange(frame)[None, :] + hop * np.arange(count)[:, None]
    frames = x[idx] * np.hanning(frame)[None, :]
    rms = np.sqrt(np.mean(frames**2, axis=1))
    silence_ratio = float(np.mean(rms < 10 ** (-60 / 20)))

    spec = np.abs(np.fft.rfft(frames, axis=1)) ** 2
    freqs = np.fft.rfftfreq(frame, 1 / sr)
    voiced = rms >= 10 ** (-50 / 20)
    if not np.any(voiced):
        voiced = np.ones_like(rms, dtype=bool)
    spec_v = spec[voiced] + 1e-20
    total = spec_v.sum(axis=1)
    bass_ratio = float(np.mean(spec_v[:, freqs < 250].sum(axis=1) / total))
    flatness = float(np.mean(np.exp(np.mean(np.log(spec_v), axis=1)) / np.mean(spec_v, axis=1)))
    cumulative = np.cumsum(spec_v, axis=1) / total[:, None]
    rolloff = float(np.mean(freqs[np.argmax(cumulative >= 0.85, axis=1)]))
    # Effective bandwidth: highest frequency whose long-term level is within 50 dB of the spectral peak.
    # Low-passed "underwater" renders and lossy-sourced audio show a hard ceiling here.
    ltas_db = 10 * np.log10(spec_v.mean(axis=0))
    audible = np.nonzero(ltas_db >= ltas_db.max() - 50)[0]
    bandwidth = float(freqs[audible[-1]]) if audible.size else 0.0

    phase_corr = None
    if channels >= 2:
        l, r = audio[:, 0], audio[:, 1]
        denom = float(np.sqrt(np.sum(l * l) * np.sum(r * r)))
        phase_corr = float(np.sum(l * r) / denom) if denom > 0 else None

    metrics: dict[str, float | int | None] = {
        "duration_seconds": round(duration, 3),
        "sample_rate": sr,
        "channels": channels,
        "integrated_lufs": round(lufs, 2),
        "sample_peak_db": round(_db(sample_peak), 2),
        "true_peak_db": round(_db(true_peak), 2),
        "clipped_sample_ratio": round(clipped_ratio, 6),
        "silence_ratio": round(silence_ratio, 4),
        "bass_ratio": round(bass_ratio, 4),
        "spectral_flatness": round(flatness, 4),
        "high_frequency_rolloff_mean": round(rolloff, 1),
        "effective_bandwidth_hz": round(bandwidth, 0),
        "stereo_phase_correlation": None if phase_corr is None else round(phase_corr, 4),
    }

    score = 100.0
    flags: list[str] = []
    feedback: list[str] = []
    hard_fail = False

    tp = metrics["true_peak_db"]
    assert isinstance(tp, float)
    if clipped_ratio > 0.0005 or tp >= 0.0:
        flags.append("clipping")
        feedback.append("Audible clipping risk: true peak reaches 0 dBFS. Re-master with a limiter ceiling around -1 dBTP.")
        score -= 35
        hard_fail = True
    elif tp > -1.0:
        flags.append("true_peak_warning")
        feedback.append(f"True peak is {tp} dBTP; streaming platforms recommend ≤ -1 dBTP.")
        score -= 8

    if lufs < -40 or silence_ratio > 0.5:
        flags.append("mostly_silent")
        feedback.append("Track is mostly silent or extremely quiet.")
        score -= 50
        hard_fail = True
    elif lufs > -6:
        flags.append("loudness_extreme")
        feedback.append(f"Integrated loudness {lufs:.1f} LUFS is extremely loud; expect heavy distortion and platform turn-down.")
        score -= 25
        hard_fail = True
    elif lufs < -18 or lufs > -8:
        flags.append("loudness_outside_range")
        feedback.append(f"Integrated loudness {lufs:.1f} LUFS is outside the -18 to -8 LUFS marketplace range.")
        score -= 10

    if sr >= 32000 and bandwidth < 6000:
        flags.append("underwater_artifact")
        feedback.append(f"Audio is band-limited to ~{bandwidth / 1000:.1f} kHz — typical of a heavily low-passed or 'underwater' AI render.")
        score -= 30
        hard_fail = True
    elif sr >= 32000 and bandwidth < 12000:
        flags.append("dull_high_end")
        feedback.append(f"Little content above ~{bandwidth / 1000:.1f} kHz; check for over-filtering or a lossy (MP3) source.")
        score -= 10

    if bass_ratio > 0.75:
        flags.append("excessive_low_end")
        feedback.append("Low end (< 250 Hz) dominates the spectrum; the mix may sound muddy on small speakers.")
        score -= 10

    if flatness > 0.5:
        flags.append("noise_like")
        feedback.append("Spectrum is very flat (noise-like); verify the render is not mostly noise/static.")
        score -= 20

    if phase_corr is not None and phase_corr < -0.2:
        flags.append("phase_issue")
        feedback.append("Strong negative stereo correlation; the track may collapse in mono.")
        score -= 10

    score = float(max(0.0, min(100.0, score)))
    passed = score >= PASS_SCORE and not hard_fail
    if passed and not feedback:
        feedback.append("Technical quality acceptable for marketplace preview.")
    feedback.append("EchoScore is technical QA only — it is not a copyright or provenance check.")
    return Result(score=round(score, 1), passed=passed, metrics=metrics, flags=flags, feedback=feedback)
