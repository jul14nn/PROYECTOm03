"""CLI: extrae el MIDI exacto y un WAV one-shot de un instrumento en un instante dado."""

from pathlib import Path

import click

from . import audio_io, capture, instruments, locate, render, separate, transcribe
from .plugin_service import plugin_extract
from .timeparse import TimestampError, parse_timestamp


@click.group()
def main() -> None:
    """Captura o carga una canción y extrae el MIDI + WAV one-shot de un instrumento."""


# Entrada que usa el plugin VST3 (habla JSON por stdout, ver plugin_service).
main.add_command(plugin_extract, name="plugin-extract")


@main.command()
@click.argument("input_path", required=False, type=click.Path(exists=True, dir_okay=False))
@click.option("--record", "record_seconds", type=float, default=None,
              help="Graba N segundos desde el micrófono en vez de usar INPUT_PATH.")
@click.option("--instrument", "-i", required=True, help="piano, voz, bajo, guitarra, bateria...")
@click.option("--time", "-t", "time_str", required=True, help="Instante de la nota: '1:04', '64', etc.")
@click.option("--window", default=2.0, show_default=True, help="Segundos de búsqueda alrededor de --time.")
@click.option("--min-release", default=0.05, show_default=True)
@click.option("--max-release", default=3.0, show_default=True)
@click.option("--pre-roll", default=0.01, show_default=True, help="Margen antes del ataque (segundos).")
@click.option("--fade", "fade_out", default=0.015, show_default=True, help="Fade-out del WAV (segundos).")
@click.option("--normalize/--no-normalize", default=False)
@click.option("--model", default="htdemucs_6s", show_default=True, help="Modelo de Demucs.")
@click.option("--device", default="cpu", show_default=True, help="cpu o cuda.")
@click.option("--out-dir", default="output", show_default=True, type=click.Path())
@click.option("--no-cache", is_flag=True, help="Fuerza volver a separar las pistas aunque ya estén en caché.")
def extract(
    input_path, record_seconds, instrument, time_str, window, min_release, max_release,
    pre_roll, fade_out, normalize, model, device, out_dir, no_cache,
) -> None:
    """Ejemplo: extract cancion.mp3 -i piano -t 1:04"""
    out_dir = Path(out_dir)

    if not input_path and record_seconds is None:
        raise click.UsageError("Indica INPUT_PATH o usa --record SEGUNDOS para grabar desde el micrófono.")
    if input_path and record_seconds is not None:
        raise click.UsageError("Usa INPUT_PATH o --record, no ambos.")

    if record_seconds is not None:
        input_path = capture.record_from_mic(record_seconds, out_dir / "captures" / "grabacion.wav")
    else:
        input_path = Path(input_path)

    try:
        target_time = parse_timestamp(time_str)
    except TimestampError as exc:
        raise click.UsageError(str(exc)) from exc

    stem_name, exact = instruments.resolve_stem(instrument)
    if not exact:
        click.echo(
            f"Aviso: '{instrument}' no tiene pista dedicada en el separador. "
            f"Se usará la pista 'other' (resto de instrumentos), con peor aislamiento.",
            err=True,
        )
    else:
        click.echo(f"Instrumento '{instrument}' -> stem '{stem_name}'.")

    click.echo(f"Separando pistas con Demucs ({model})... (puede tardar la primera vez)")
    stems = separate.separate_stems(
        input_path, cache_dir=out_dir / "stems_cache", model=model, device=device,
        reuse_cache=not no_cache,
    )
    if stem_name not in stems:
        raise click.ClickException(
            f"El modelo {model} no generó el stem '{stem_name}'. Stems disponibles: {list(stems)}"
        )
    stem_path = stems[stem_name]
    click.echo(f"Pista aislada: {stem_path}")

    samples, sr = audio_io.load_audio(stem_path)
    mono = audio_io.to_mono(samples)

    try:
        window_result = locate.find_note_window(
            mono, sr, target_time, search_window=window,
            min_release=min_release, max_release=max_release,
        )
    except locate.NoOnsetFoundError as exc:
        raise click.ClickException(str(exc)) from exc

    click.echo(
        f"Nota localizada: ataque en {window_result.onset:.3f}s, "
        f"apagado en {window_result.offset:.3f}s "
        f"({len(window_result.cluster_onsets)} ataque(s) simultáneo(s))."
    )

    base_name = f"{input_path.stem}_{stem_name}_{time_str.replace(':', '-')}"
    wav_path = out_dir / f"{base_name}.wav"
    midi_path = out_dir / f"{base_name}.mid"

    render.export_one_shot(
        samples, sr, window_result.onset, window_result.offset, wav_path,
        pre_roll=pre_roll, fade_out=fade_out, normalize=normalize,
    )
    click.echo(f"WAV one-shot exportado: {wav_path}")

    if stem_name == "drums":
        click.echo(
            "Aviso: basic-pitch detecta tono, no percusión. El WAV one-shot es "
            "fiable, pero el MIDI puede salir vacío o poco preciso para golpes "
            "sin tono definido (caja, hi-hat, platos); funciona mejor con "
            "bombo/toms.",
            err=True,
        )

    clip_start = max(0, int((window_result.onset - pre_roll) * sr))
    clip_end = min(len(samples), int(window_result.offset * sr))
    notes = transcribe.transcribe_segment(samples[clip_start:clip_end], sr, midi_path)
    click.echo(f"MIDI exportado: {midi_path}")

    if notes:
        click.echo("Notas detectadas:")
        for note in notes:
            click.echo(
                f"  {note.pitch_name:>4} (midi {note.pitch_midi:3d})  "
                f"{note.start:.3f}s -> {note.end:.3f}s  vel={note.velocity}"
            )
    else:
        click.echo(
            "No se detectaron notas claras en el fragmento. Prueba a ajustar "
            "--window, --pre-roll o revisa que el instrumento suene en ese instante."
        )


if __name__ == "__main__":
    main()
