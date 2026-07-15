#!/usr/bin/env python3
"""Genera subtitulos .ass a partir de lyrics/lassie_lyrics.json.

Reparte el tiempo de cada seccion entre sus lineas proporcionalmente
a la longitud de caracteres, dejando un pequeno hueco entre lineas
para que el fundido de entrada/salida se note.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LYRICS_JSON = ROOT / "lyrics" / "lassie_lyrics.json"
OUT_ASS = ROOT / "output" / "lassie.ass"

PLAY_RES_X = 1080
PLAY_RES_Y = 1920
GAP = 0.35  # segundos de silencio visual entre lineas consecutivas
FADE_MS = 300  # fundido de entrada/salida por linea

HEADER = f"""[Script Info]
Title: Lassie - lyric video
ScriptType: v4.00+
PlayResX: {PLAY_RES_X}
PlayResY: {PLAY_RES_Y}
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Lyric,Liberation Serif,46,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,-1,0,0,100,100,0,0,1,0,0,1,90,90,260,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def fmt_time(t: float) -> str:
    if t < 0:
        t = 0.0
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    cs = int(round((s - int(s)) * 100))
    if cs == 100:
        cs = 0
        s += 1
    return f"{h:d}:{m:02d}:{int(s):02d}.{cs:02d}"


def main():
    data = json.loads(LYRICS_JSON.read_text(encoding="utf-8"))
    events = []
    timeline = []

    for section in data["sections"]:
        lines = section["lines"]
        if not lines:
            continue
        start, end = section["start"], section["end"]
        total_chars = sum(len(l) for l in lines)
        span = end - start
        n = len(lines)
        cursor = start
        for i, line in enumerate(lines):
            weight = len(line) / total_chars if total_chars else 1 / n
            dur = span * weight
            line_start = cursor
            line_end = cursor + dur - (GAP if i < n - 1 else 0)
            line_end = max(line_end, line_start + 0.5)
            cursor += dur
            timeline.append(
                {
                    "section": section["name"],
                    "text": line,
                    "start": round(line_start, 2),
                    "end": round(line_end, 2),
                }
            )
            text = line.replace("{", "(").replace("}", ")")
            events.append(
                f"Dialogue: 0,{fmt_time(line_start)},{fmt_time(line_end)},Lyric,,0,0,0,,"
                f"{{\\fad({FADE_MS},{FADE_MS})}}{text}"
            )

    OUT_ASS.parent.mkdir(parents=True, exist_ok=True)
    OUT_ASS.write_text(HEADER + "\n".join(events) + "\n", encoding="utf-8")

    timeline_path = ROOT / "lyrics" / "lassie_timeline.json"
    timeline_path.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Escrito {OUT_ASS}")
    print(f"Escrito {timeline_path}")
    for t in timeline:
        print(f"[{t['start']:6.2f} - {t['end']:6.2f}] ({t['section']}) {t['text']}")


if __name__ == "__main__":
    sys.exit(main())
