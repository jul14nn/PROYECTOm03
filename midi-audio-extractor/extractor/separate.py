"""Separación de fuentes con Demucs (modelo htdemucs_6s: vocals/drums/bass/guitar/piano/other)."""

import hashlib
import subprocess
import sys
from pathlib import Path


class SeparationError(RuntimeError):
    pass


def _cache_key(input_path: Path, model: str) -> str:
    stat = input_path.stat()
    digest = hashlib.sha1(f"{input_path.resolve()}|{stat.st_size}|{stat.st_mtime}|{model}".encode())
    return digest.hexdigest()[:16]


def separate_stems(
    input_path: str | Path,
    cache_dir: str | Path,
    model: str = "htdemucs_6s",
    device: str = "cpu",
    reuse_cache: bool = True,
) -> dict[str, Path]:
    """Separa `input_path` en stems y devuelve {stem_name: wav_path}.

    Cachea el resultado por archivo+modelo en `cache_dir` para no repetir
    la separación (lenta) si se piden varias notas de la misma canción.
    """
    input_path = Path(input_path)
    cache_dir = Path(cache_dir)
    key = _cache_key(input_path, model)
    track_dir = cache_dir / key / model / input_path.stem

    if reuse_cache and track_dir.exists():
        stems = {p.stem: p for p in track_dir.glob("*.wav")}
        if stems:
            return stems

    out_dir = cache_dir / key
    out_dir.mkdir(parents=True, exist_ok=True)

    cmd = [
        sys.executable,
        "-m",
        "demucs",
        "-n",
        model,
        "-d",
        device,
        "-o",
        str(out_dir),
        str(input_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        # El fallo más habitual con diferencia es no tener Demucs instalado.
        # Merece un mensaje que diga qué hacer, porque este error también se
        # muestra tal cual en el panel del plugin, donde un volcado del
        # comando no le sirve de nada a quien lo lee.
        if "No module named" in result.stderr and "demucs" in result.stderr:
            raise SeparationError(
                "Demucs no está instalado, así que no se puede separar el "
                "instrumento de la mezcla. Instálalo con 'pip install demucs', "
                "o desmarca la separación si el canal ya trae el instrumento "
                "aislado."
            )

        raise SeparationError(
            "Demucs falló al separar las pistas.\n"
            f"Comando: {' '.join(cmd)}\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}"
        )

    if not track_dir.exists():
        raise SeparationError(f"Demucs no generó la carpeta esperada: {track_dir}")

    stems = {p.stem: p for p in track_dir.glob("*.wav")}
    if not stems:
        raise SeparationError(f"Demucs no generó ningún stem en {track_dir}")
    return stems
