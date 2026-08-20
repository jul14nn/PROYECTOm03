"""Recorta el audio real aislado en un WAV one-shot, sin resíntesis ni pérdida de calidad."""

from pathlib import Path

import numpy as np

from .audio_io import save_wav


def export_one_shot(
    samples: np.ndarray,
    sr: int,
    onset: float,
    offset: float,
    out_path: str | Path,
    pre_roll: float = 0.01,
    fade_out: float = 0.015,
    normalize: bool = False,
) -> Path:
    """Exporta samples[onset-pre_roll : offset] como WAV, con fade-out anti-clicks.

    `samples` debe ser el audio ya separado (float32, shape (n, canales)), tal
    cual salió de Demucs: no se resintetiza nada, solo se recorta y se
    guarda sin recompresión, así que no hay pérdida de calidad frente al
    stem original.
    """
    n_samples, n_channels = samples.shape
    start = max(0, int((onset - pre_roll) * sr))
    end = min(n_samples, int(offset * sr))
    if end <= start:
        end = min(n_samples, start + int(0.05 * sr))

    clip = samples[start:end].copy()

    fade_samples = min(int(fade_out * sr), len(clip))
    if fade_samples > 1:
        ramp = np.linspace(1.0, 0.0, fade_samples, dtype=np.float32)
        clip[-fade_samples:] *= ramp[:, None]

    if normalize:
        peak = np.abs(clip).max()
        if peak > 0:
            clip = clip * (0.98 / peak)

    save_wav(out_path, clip, sr, subtype="PCM_24")
    return Path(out_path)
