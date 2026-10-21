# Data / ML Module

## Status
Active only for EchoScore audio analysis and product analytics. No model training is planned for MVP.

## Datasets
- Uploaded audio files.
- EchoScore metrics.
- Human review outcomes.
- Buyer conversion and support/dispute signals.

## Feature pipelines
MVP EchoScore uses deterministic audio features:
- loudness
- true peak
- bass ratio
- spectral flatness
- rolloff/high-frequency presence
- optional stereo/phase metrics

## Training cadence
None for MVP.

## Model registry
Not required for MVP.

## Inference requirements
EchoScore service must process one file at a time initially, return analysis version, return structured JSON, fail safely, and not block web request lifecycle.

## Drift monitoring
Track rejection reasons, human override rate, buyer complaints, disputes by EchoScore band, and review outcomes by metric pattern.

## Key warning
Do not turn EchoScore into an “AI legality detector.” It is technical audio QA only.
