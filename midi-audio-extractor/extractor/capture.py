"""Captura de audio en vivo desde el micrófono."""

from pathlib import Path

from .audio_io import save_wav


def record_from_mic(duration: float, out_path: str | Path, sr: int = 48000, channels: int = 2) -> Path:
    """Graba `duration` segundos desde el micrófono por defecto y guarda un WAV sin pérdida."""
    import sounddevice as sd

    out_path = Path(out_path)
    print(f"Grabando {duration:.1f}s desde el micrófono ({sr} Hz, {channels} canales)...")
    recording = sd.rec(int(duration * sr), samplerate=sr, channels=channels, dtype="float32")
    sd.wait()
    save_wav(out_path, recording, sr, subtype="FLOAT")
    print(f"Grabación guardada en {out_path}")
    return out_path
