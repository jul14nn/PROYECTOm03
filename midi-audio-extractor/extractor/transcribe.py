"""Transcripción a MIDI (polifónica) del fragmento aislado, usando basic-pitch."""

import tempfile
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from .audio_io import save_wav


@dataclass
class Note:
    start: float
    end: float
    pitch_midi: int
    pitch_name: str
    velocity: int


_MIDI_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def _midi_to_name(pitch: int) -> str:
    return f"{_MIDI_NAMES[pitch % 12]}{pitch // 12 - 1}"


def transcribe_segment(clip_samples: np.ndarray, sr: int, out_midi_path: str | Path) -> list[Note]:
    """Transcribe un fragmento corto (el one-shot) a notas MIDI exactas.

    Se transcribe solo el fragmento aislado (no la canción entera) para que
    basic-pitch se centre en el instrumento pedido y no confunda notas de
    otras pistas que hayan quedado como fuga en la separación.
    """
    from basic_pitch.inference import predict

    out_midi_path = Path(out_midi_path)
    out_midi_path.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        save_wav(tmp_path, clip_samples, sr, subtype="PCM_24")
        _, midi_data, note_events = predict(str(tmp_path))
    finally:
        tmp_path.unlink(missing_ok=True)

    midi_data.write(str(out_midi_path))

    notes: list[Note] = []
    for start, end, pitch, amplitude, _bends in note_events:
        velocity = int(np.clip(round(amplitude * 127), 1, 127))
        notes.append(
            Note(
                start=float(start),
                end=float(end),
                pitch_midi=int(pitch),
                pitch_name=_midi_to_name(int(pitch)),
                velocity=velocity,
            )
        )
    notes.sort(key=lambda n: n.start)
    return notes
