"""Localiza el ataque (onset) y la cola (release) exactos de la nota/acorde
más cercano al timestamp pedido, dentro de la pista ya aislada."""

from dataclasses import dataclass

import librosa
import numpy as np

# Notas muy próximas en el tiempo se consideran parte del mismo ataque/acorde.
CHORD_CLUSTER_SECONDS = 0.06
# Caída de energía (dB por debajo del pico) que marcamos como "silencio".
RELEASE_THRESHOLD_DB = -40.0


class NoOnsetFoundError(RuntimeError):
    pass


@dataclass
class NoteWindow:
    onset: float
    offset: float
    cluster_onsets: list[float]


def find_note_window(
    mono_samples: np.ndarray,
    sr: int,
    target_time: float,
    search_window: float = 2.0,
    min_release: float = 0.05,
    max_release: float = 3.0,
) -> NoteWindow:
    """Busca el evento (nota o acorde) más cercano a `target_time`.

    Devuelve el instante de ataque exacto y el instante en que la nota se
    apaga (por el siguiente onset o por caída de energía, lo que ocurra antes).
    """
    duration = len(mono_samples) / sr
    if not (0 <= target_time <= duration):
        raise NoOnsetFoundError(
            f"El timestamp {target_time:.2f}s está fuera de la duración del audio ({duration:.2f}s)."
        )

    onset_frames = librosa.onset.onset_detect(
        y=mono_samples, sr=sr, backtrack=True, units="frames"
    )
    onset_times = librosa.frames_to_time(onset_frames, sr=sr)

    if len(onset_times) == 0:
        raise NoOnsetFoundError(
            "No se detectó ningún ataque de nota en esta pista aislada. "
            "Puede que el instrumento pedido no suene, o que la separación "
            "de fuentes no haya aislado bien este stem."
        )

    lo, hi = target_time - search_window, target_time + search_window
    candidates = onset_times[(onset_times >= lo) & (onset_times <= hi)]
    if len(candidates) == 0:
        nearest = onset_times[np.argmin(np.abs(onset_times - target_time))]
        raise NoOnsetFoundError(
            f"No hay ningún ataque de nota a menos de {search_window:.1f}s de "
            f"{target_time:.2f}s en esta pista. El ataque más cercano detectado "
            f"está en {nearest:.2f}s; prueba con --time {nearest:.2f} o aumenta --window."
        )

    onset = min(candidates, key=lambda t: abs(t - target_time))

    cluster_onsets = sorted(
        t for t in onset_times if abs(t - onset) <= CHORD_CLUSTER_SECONDS
    )

    later_onsets = onset_times[onset_times > onset + CHORD_CLUSTER_SECONDS]
    next_onset = float(later_onsets[0]) if len(later_onsets) else None

    release = _detect_release(mono_samples, sr, onset, max_release)

    if next_onset is not None:
        offset = min(next_onset, release)
    else:
        offset = release

    offset = max(offset, onset + min_release)
    offset = min(offset, duration)

    return NoteWindow(onset=float(onset), offset=float(offset), cluster_onsets=cluster_onsets)


def _detect_release(mono_samples: np.ndarray, sr: int, onset: float, max_release: float) -> float:
    """Encuentra dónde la energía cae por debajo de RELEASE_THRESHOLD_DB tras el ataque."""
    start_sample = int(onset * sr)
    end_sample = min(len(mono_samples), int((onset + max_release) * sr))
    segment = mono_samples[start_sample:end_sample]
    if len(segment) == 0:
        return min(onset + max_release, len(mono_samples) / sr)

    hop = 256
    rms = librosa.feature.rms(y=segment, hop_length=hop)[0]
    if len(rms) == 0 or rms.max() <= 0:
        return min(onset + max_release, len(mono_samples) / sr)

    db = librosa.amplitude_to_db(rms, ref=rms.max())
    below = np.where(db < RELEASE_THRESHOLD_DB)[0]
    if len(below) == 0:
        return min(onset + max_release, len(mono_samples) / sr)

    release_sample = below[0] * hop
    return onset + release_sample / sr
