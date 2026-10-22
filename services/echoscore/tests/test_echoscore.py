import io

import numpy as np
import soundfile as sf
from fastapi.testclient import TestClient

from app.analysis import analyze
from app.main import app

client = TestClient(app)
TOKEN = {"x-service-token": "change-me-service-token"}
SR = 48000


def wav(signal: np.ndarray, sr: int = SR) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, signal, sr, format="WAV", subtype="PCM_24")
    return buf.getvalue()


def music_like(seconds: float = 8.0, gain: float = 0.3) -> np.ndarray:
    """Chord with harmonics + kick + hats + air: broadband, music-like spectrum."""
    rng = np.random.default_rng(7)
    t = np.arange(int(seconds * SR)) / SR
    tones = sum(np.sin(2 * np.pi * f * k * t) / k for f in (220, 277.18, 329.63) for k in range(1, 12)) / 6
    kick = np.sin(2 * np.pi * 55 * t) * (np.mod(t, 0.5) < 0.12)
    hats = rng.normal(0, 1, t.size) * (np.mod(t, 0.25) < 0.03) * 0.5 + rng.normal(0, 0.01, t.size)
    left = gain * (tones + 0.6 * kick + hats)
    right = gain * (tones * 0.9 + 0.6 * kick + np.roll(hats, 100))
    return np.stack([left, right], axis=1)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_requires_service_token() -> None:
    r = client.post("/analyze", files={"file": ("t.wav", wav(music_like(2)), "audio/wav")}, data={"track_id": "x"})
    assert r.status_code == 401


def test_clean_master_passes() -> None:
    r = client.post("/analyze", headers=TOKEN, files={"file": ("t.wav", wav(music_like()), "audio/wav")}, data={"track_id": "t1"})
    body = r.json()
    assert r.status_code == 200, body
    assert body["status"] == "succeeded"
    assert body["pass"] is True, body
    assert -18 <= body["metrics"]["integrated_lufs"] <= -8, body["metrics"]
    assert body["metrics"]["true_peak_db"] < -1


def test_clipped_master_fails() -> None:
    clipped = np.clip(music_like(gain=3.0), -1.0, 1.0)
    result = analyze(wav(clipped))
    assert result.passed is False
    assert "clipping" in result.flags


def test_underwater_render_is_flagged() -> None:
    t = np.arange(8 * SR) / SR
    dull = 0.3 * (np.sin(2 * np.pi * 110 * t) + 0.5 * np.sin(2 * np.pi * 220 * t))
    result = analyze(wav(np.stack([dull, dull], axis=1)))
    assert "underwater_artifact" in result.flags
    assert result.passed is False


def test_silence_fails() -> None:
    result = analyze(wav(np.zeros((SR * 5, 2))))
    assert "mostly_silent" in result.flags
    assert result.passed is False


def test_garbage_is_unreadable_not_error() -> None:
    r = client.post("/analyze", headers=TOKEN, files={"file": ("t.wav", b"RIFF....not audio", "audio/wav")}, data={"track_id": "t2"})
    assert r.status_code == 200
    assert r.json()["status"] == "failed"
    assert r.json()["flags"] == ["unreadable_file"]


def test_lowpassed_render_is_flagged_but_mp3_bandwidth_is_only_a_warning() -> None:
    from scipy.signal import butter, sosfilt

    base = music_like()
    lp4k = sosfilt(butter(10, 4000, fs=SR, output="sos"), base, axis=0)
    assert "underwater_artifact" in analyze(wav(lp4k)).flags

    lp16k = sosfilt(butter(10, 10000, fs=SR, output="sos"), base, axis=0)
    r16 = analyze(wav(lp16k))
    assert "underwater_artifact" not in r16.flags
    assert "dull_high_end" in r16.flags
