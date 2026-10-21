import hmac
import os

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile

from .analysis import ANALYSIS_VERSION, UnreadableAudio, analyze

app = FastAPI(title="EchoScore", version="0.2.0")
MAX_BYTES = 260 * 1024 * 1024


def _check_token(token: str | None) -> None:
    expected = os.environ.get("ECHOSCORE_SERVICE_TOKEN", "change-me-service-token")
    if not token or not hmac.compare_digest(token, expected):
        raise HTTPException(status_code=401, detail="invalid service token")


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {"ok": True, "service": "echoscore", "analysis_version": ANALYSIS_VERSION}


@app.post("/analyze")
async def analyze_upload(
    file: UploadFile = File(...),
    track_id: str = Form(...),
    job_id: str = Form(""),
    x_service_token: str | None = Header(default=None),
) -> dict:
    _check_token(x_service_token)
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="file too large")
    try:
        result = analyze(data)
    except UnreadableAudio as exc:
        # Unreadable is a *result* (analysis_failed), not a service error — don't retry it.
        return {
            "track_id": track_id,
            "job_id": job_id,
            "analysis_version": ANALYSIS_VERSION,
            "status": "failed",
            "score": None,
            "pass": None,
            "metrics": None,
            "flags": ["unreadable_file"],
            "feedback": ["The file could not be decoded. Export a standard PCM WAV and re-upload."],
            "error_message": str(exc)[:500],
        }
    return {
        "track_id": track_id,
        "job_id": job_id,
        "analysis_version": ANALYSIS_VERSION,
        "status": "succeeded",
        "score": result.score,
        "pass": result.passed,
        "metrics": result.metrics,
        "flags": result.flags,
        "feedback": result.feedback,
        "error_message": None,
    }
