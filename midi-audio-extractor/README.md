# midi-audio-extractor

Herramienta de línea de comandos: le das una canción (o grabas desde el
micrófono) y le dices algo como *"el piano del minuto 1:04"*, y te devuelve:

- el **MIDI exacto** de las notas que suenan en ese instante (pitch, tiempo, velocidad), y
- un **WAV one-shot** listo para arrastrar a tu DAW, recortado del **audio real
  aislado de ese instrumento** (no es una resíntesis: es el audio grabado
  original recortado, así que no pierde calidad).

## Cómo funciona

1. **Separación de fuentes** — [Demucs](https://github.com/facebookresearch/demucs)
   (`htdemucs_6s`) separa la canción en `vocals`, `drums`, `bass`, `guitar`,
   `piano` y `other`.
2. **Localización del evento** — dentro de la pista aislada se detecta el
   ataque (onset) más cercano al instante pedido y se calcula dónde termina
   la nota (por el siguiente ataque o por caída de energía), incluyendo
   acordes (varios ataques simultáneos).
3. **Transcripción a MIDI** — [basic-pitch](https://github.com/spotify/basic-pitch)
   (Spotify) transcribe ese fragmento aislado a notas MIDI polifónicas exactas.
4. **Exportación WAV** — se recorta el audio real aislado (con pequeño
   pre-roll y fade-out para que no haya clics) y se guarda sin recompresión
   (WAV PCM 24-bit), preservando la calidad del original.

## Instalación

Requiere Python 3.10-3.11 y **ffmpeg** instalado en el sistema:

```bash
# Linux (Debian/Ubuntu)
sudo apt-get install ffmpeg
# macOS
brew install ffmpeg
```

Luego, dentro de esta carpeta:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

> La primera vez que se ejecuta, Demucs y basic-pitch descargan sus modelos
> pre-entrenados (varios cientos de MB). No hace falta GPU, pero acelera
> bastante la separación de fuentes en canciones largas (`--device cuda`).

## Uso

Desde un archivo de audio:

```bash
python -m extractor extract cancion.mp3 --instrument piano --time 1:04
```

Grabando 20 segundos desde el micrófono en vez de usar un archivo:

```bash
python -m extractor extract --record 20 --instrument piano --time 0:12
```

Salida (en `output/` por defecto):

```
output/cancion_piano_1-04.wav   # one-shot, audio real aislado
output/cancion_piano_1-04.mid   # notas MIDI exactas
```

y en la terminal verás algo como:

```
Nota localizada: ataque en 64.120s, apagado en 65.310s (1 ataque(s) simultáneo(s)).
Notas detectadas:
   C4  (midi  60)  0.010s -> 1.180s  vel=96
   E4  (midi  64)  0.015s -> 1.150s  vel=88
   G4  (midi  67)  0.012s -> 1.200s  vel=91
```

(los tiempos del MIDI son relativos al propio one-shot, empezando cerca de 0,
para que se pueda arrastrar directamente a un sampler/DAW).

### Instrumentos soportados directamente

`piano`, `voz`/`vocals`, `bajo`/`bass`, `guitarra`/`guitar`, `bateria`/`drums`.
Cualquier otro nombre (saxofón, cuerdas, sintetizador...) cae en la pista
`other`, que mezcla todo lo que no sea las anteriores — el aislamiento será
peor porque Demucs no separa esos instrumentos entre sí.

**Batería:** el WAV one-shot funciona muy bien (la detección de ataque es
precisa en golpes percusivos), pero el MIDI es menos fiable porque
basic-pitch detecta **tono**, no percusión. Un bombo o un tom tienen algo de
tono grave y se transcriben razonablemente bien; una caja, hi-hat o platillo
son ruido de banda ancha sin tono definido, así que el MIDI puede salir
vacío o poco útil para esos golpes — usa el WAV en esos casos.

### Opciones útiles

| Opción | Qué hace |
|---|---|
| `--window` | Segundos de búsqueda alrededor de `--time` para encontrar el ataque más cercano (por defecto 2.0s). Si el instrumento no ataca justo en ese segundo, se coge el ataque real más próximo. |
| `--pre-roll` | Margen antes del ataque incluido en el WAV (por defecto 10ms). |
| `--fade` | Duración del fade-out final del WAV, para evitar clics (por defecto 15ms). |
| `--normalize` | Normaliza el pico del WAV a -0.2 dBFS. |
| `--no-cache` | Repite la separación de fuentes aunque ya esté cacheada (por defecto se reutiliza si pides varias notas de la misma canción). |
| `--device cuda` | Usa GPU para la separación de fuentes si está disponible. |

## Limitaciones honestas

- La separación de fuentes nunca es perfecta: puede quedar "fuga" de otros
  instrumentos en la pista aislada, sobre todo en mezclas muy densas.
- Instrumentos fuera de `piano/voz/bajo/guitarra/batería` comparten la pista
  `other`, así que si pides "el saxofón" en una mezcla con cuerdas, ambos
  estarán en esa pista.
- La detección de acordes agrupa ataques que ocurren a menos de 60ms entre sí;
  arpegios muy rápidos pueden confundirse con un acorde o viceversa.

## Estructura del proyecto

```
extractor/
  cli.py          # comando `extract`
  capture.py      # grabación por micrófono
  separate.py     # separación de fuentes (Demucs)
  locate.py       # detección de ataque/apagado de la nota
  transcribe.py   # transcripción a MIDI (basic-pitch)
  render.py       # recorte + exportación del WAV one-shot
  instruments.py  # mapeo nombre de instrumento -> stem
  timeparse.py    # parseo de timestamps
  audio_io.py     # carga/guardado de audio sin pérdida
tests/            # tests unitarios de las partes deterministas (sin ML)
```

## Tests

Los tests cubren el parseo de timestamps, la detección de onset/release y el
recorte/fade del WAV — todo lo que no depende de descargar los modelos de
ML pesados:

```bash
pip install pytest
pytest tests/
```
