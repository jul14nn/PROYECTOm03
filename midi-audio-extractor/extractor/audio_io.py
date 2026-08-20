"""Carga y guarda audio preservando la calidad (sin recompresión con pérdida)."""

from pathlib import Path

import numpy as np
import soundfile as sf


def load_audio(path: str | Path) -> tuple[np.ndarray, int]:
    """Carga un archivo de audio como float32, shape (samples, canales)."""
    samples, sr = sf.read(str(path), always_2d=True, dtype="float32")
    return samples, sr


def save_wav(path: str | Path, samples: np.ndarray, sr: int, subtype: str = "PCM_24") -> None:
    """Guarda WAV sin pérdida. subtype='FLOAT' si se prefiere precisión completa."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), samples, sr, subtype=subtype)


def to_mono(samples: np.ndarray) -> np.ndarray:
    if samples.ndim == 1:
        return samples
    return samples.mean(axis=1)
