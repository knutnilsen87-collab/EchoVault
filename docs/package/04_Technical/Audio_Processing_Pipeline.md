# Audio Processing Pipeline

## Purpose
EchoScore is the technical QA layer for uploaded audio. It detects quality problems and provides structured feedback before human review. It must never be presented as legal/copyright validation.

## Pipeline
1. Artist uploads high-res WAV.
2. Backend stores file privately and records checksum.
3. Submission creates analysis job.
4. Worker fetches file via secure internal access.
5. FastAPI service analyzes integrated loudness, true peak/clipping risk, low-end ratio, spectral flatness, high-frequency rolloff and optional stereo/phase checks.
6. Service returns numeric score 0–100, pass/fail, metrics JSON, human-readable feedback and processing version.
7. Admin review consumes result.
8. Public catalog may show simplified badge only.

## Libraries
- Python
- FastAPI
- librosa
- pyloudnorm
- numpy
- soundfile/ffmpeg where needed

## Thresholds — starting proposal
| Signal | Warning | Fail |
|---|---:|---:|
| True peak | > -1.0 dBTP | >= 0.0 dBFS / clipping |
| Integrated LUFS | outside -18 to -8 LUFS | extreme loudness or silence |
| Rolloff / high frequency | unusually low | strong “underwater” artifact |
| Low-end ratio | genre-dependent | excessive muddy bass |
| File integrity | decode warnings | unreadable/corrupt file |

Thresholds must be tuned against real submissions.

## Job failure handling
- Retry transient failures up to 3 times.
- Mark `analysis_failed` after final failure.
- Admin can retry.
- Do not publish without successful analysis or explicit admin override.

## Output JSON shape
```json
{
  "analysis_version": "echoscore-v0.1",
  "score": 82.4,
  "pass": true,
  "metrics": {
    "integrated_lufs": -13.7,
    "true_peak_db": -1.2,
    "bass_ratio": 0.31,
    "spectral_flatness": 0.08,
    "high_frequency_rolloff_mean": 10420
  },
  "flags": [],
  "feedback": ["Technical quality acceptable for marketplace preview."]
}
```
