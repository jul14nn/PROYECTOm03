"""Entrada que usa el plugin VST3: extrae de un fragmento ya capturado por el DAW.

Se diferencia del comando `extract` normal en tres cosas:

1. La entrada no es una canción entera, sino el buffer que el plugin venía
   guardando del audio que lo atraviesa, y el instante se da como offset
   dentro de ese buffer (donde el usuario pulsó), no como marca de la canción.
2. Puede saltarse la separación de fuentes. Si el plugin está insertado en la
   pista del propio instrumento, el audio ya llega aislado: separar sobraría,
   tardaría minutos y encima degradaría el resultado.
3. Habla por stdout en líneas JSON, para que el plugin muestre progreso y
   resultados sin tener que interpretar texto pensado para humanos.
"""

from __future__ import annotations

import contextlib
import json
import os
import sys
import traceback
from pathlib import Path

import click

from . import audio_io, instruments, locate, render, separate, transcribe

# Descriptor reservado para hablar con el plugin. Se fija en _protected_stdout.
_channel = None


@contextlib.contextmanager
def _protected_stdout():
    """Deja stdout en exclusiva para el protocolo JSON.

    basic-pitch imprime "Predicting MIDI for..." por stdout, y Demucs y
    TensorFlow escriben barras de progreso, así que el plugin recibiría
    líneas que no son JSON y se atragantaría. Se duplica el stdout real a
    otro descriptor (por donde se emiten los eventos) y se redirige el
    descriptor 1 a stderr, que es donde debe ir todo ese ruido.

    Se hace a nivel de descriptor y no con redirect_stdout porque parte del
    ruido lo escriben librerías nativas, que no pasan por sys.stdout.
    """
    global _channel

    sys.stdout.flush()
    _channel = os.fdopen(os.dup(1), "w", encoding="utf-8")
    os.dup2(2, 1)
    try:
        yield
    finally:
        sys.stdout.flush()
        _channel.flush()
        _channel.close()
        _channel = None


def emit(payload: dict) -> None:
    """Escribe un evento como una línea JSON y la vacía enseguida.

    Sin el flush el plugin no vería el progreso hasta el final, porque la
    salida se almacena en bloque cuando el otro extremo es una tubería y no
    un terminal.
    """
    target = _channel if _channel is not None else sys.stdout
    target.write(json.dumps(payload, ensure_ascii=False) + "\n")
    target.flush()


def progress(stage: str, message: str) -> None:
    emit({"event": "progress", "stage": stage, "message": message})


@click.command()
@click.argument("capture_path", type=click.Path(exists=True, dir_okay=False))
@click.option("--offset", required=True, type=float,
              help="Instante dentro del fragmento capturado, en segundos.")
@click.option("--instrument", "-i", default="piano",
              help="Solo se usa si hay que separar: piano, voz, bajo, guitarra, bateria...")
@click.option("--separate/--no-separate", "do_separate", default=False,
              help="Separar el instrumento del resto. Innecesario si el plugin "
                   "está en la pista del instrumento (el audio ya llega aislado).")
@click.option("--label", default="captura", help="Etiqueta para el nombre de los archivos.")
@click.option("--out-dir", required=True, type=click.Path())
@click.option("--window", default=2.0, help="Segundos de búsqueda alrededor de --offset.")
@click.option("--pre-roll", default=0.01)
@click.option("--fade", "fade_out", default=0.015)
@click.option("--max-release", default=3.0)
@click.option("--device", default="cpu")
@click.option("--model", default="htdemucs_6s")
def plugin_extract(
    capture_path, offset, instrument, do_separate, label, out_dir,
    window, pre_roll, fade_out, max_release, device, model,
) -> None:
    """Extrae MIDI + WAV one-shot de un fragmento capturado por el plugin."""
    with _protected_stdout():
        try:
            _run(capture_path, offset, instrument, do_separate, label, out_dir,
                 window, pre_roll, fade_out, max_release, device, model)
        except Exception as exc:  # noqa: BLE001 - el plugin necesita el fallo como dato, no un traceback
            emit({
                "event": "error",
                "message": str(exc) or exc.__class__.__name__,
                "detail": traceback.format_exc(limit=3),
            })
            raise SystemExit(1) from exc


def _run(capture_path, offset, instrument, do_separate, label, out_dir,
         window, pre_roll, fade_out, max_release, device, model) -> None:
    capture_path = Path(capture_path)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    source_path = capture_path
    stem_name = "directo"

    if do_separate:
        stem_name, exact = instruments.resolve_stem(instrument)
        if not exact:
            progress("separating",
                     f"'{instrument}' no tiene pista propia; se usará 'other', "
                     f"con peor aislamiento.")
        progress("separating", f"Separando '{stem_name}' con Demucs ({model})...")

        stems = separate.separate_stems(
            capture_path, cache_dir=out_dir / "stems_cache", model=model,
            device=device, reuse_cache=True,
        )
        if stem_name not in stems:
            raise RuntimeError(
                f"El modelo {model} no generó el stem '{stem_name}'. "
                f"Disponibles: {sorted(stems)}"
            )
        source_path = stems[stem_name]
        progress("separating", f"Pista aislada: {source_path.name}")
    else:
        progress("separating", "Sin separación: el audio del canal ya llega aislado.")

    progress("locating", "Buscando el ataque de la nota...")
    samples, sr = audio_io.load_audio(source_path)
    mono = audio_io.to_mono(samples)

    note_window = locate.find_note_window(
        mono, sr, offset, search_window=window, max_release=max_release,
    )
    progress(
        "locating",
        f"Ataque en {note_window.onset:.3f}s, apagado en {note_window.offset:.3f}s "
        f"({len(note_window.cluster_onsets)} ataque(s) simultáneo(s)).",
    )

    base_name = f"{label}_{stem_name}"
    wav_path = _unique_path(out_dir / f"{base_name}.wav")
    midi_path = wav_path.with_suffix(".mid")

    progress("rendering", "Recortando el one-shot del audio original...")
    render.export_one_shot(
        samples, sr, note_window.onset, note_window.offset, wav_path,
        pre_roll=pre_roll, fade_out=fade_out,
    )

    progress("transcribing", "Transcribiendo a MIDI con basic-pitch...")
    clip_start = max(0, int((note_window.onset - pre_roll) * sr))
    clip_end = min(len(samples), int(note_window.offset * sr))
    notes = transcribe.transcribe_segment(samples[clip_start:clip_end], sr, midi_path)

    warning = None
    if do_separate and stem_name == "drums":
        warning = ("basic-pitch detecta tono, no percusión: el WAV es fiable, "
                   "pero el MIDI puede salir vacío para caja, hi-hat o platos.")
    elif not notes:
        warning = ("No se detectaron notas claras. Prueba a capturar más cerca "
                   "del ataque, o a separar el instrumento si el canal trae mezcla.")

    emit({
        "event": "result",
        "wav": str(wav_path.resolve()),
        "midi": str(midi_path.resolve()),
        "onset": round(note_window.onset, 4),
        "offset": round(note_window.offset, 4),
        "duration": round(note_window.offset - note_window.onset, 4),
        "separated": bool(do_separate),
        "stem": stem_name,
        "warning": warning,
        "notes": [
            {
                "midi": n.pitch_midi,
                "name": n.pitch_name,
                "start": round(n.start, 4),
                "end": round(n.end, 4),
                "velocity": n.velocity,
            }
            for n in notes
        ],
    })


def _unique_path(path: Path) -> Path:
    """Evita pisar capturas anteriores: añade _2, _3... si el nombre ya existe."""
    if not path.exists():
        return path
    stem, suffix, parent = path.stem, path.suffix, path.parent
    counter = 2
    while (candidate := parent / f"{stem}_{counter}{suffix}").exists():
        counter += 1
    return candidate


if __name__ == "__main__":
    plugin_extract()
