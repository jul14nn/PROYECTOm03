#!/usr/bin/env python3
"""Genera la imagen base del fondo: dos focos de luz simetricos sobre
negro, con niebla subiendo, inspirado en el ambiente de referencia
(sin ninguna figura humana). ffmpeg se encarga despues del zoom lento,
el grano y la mezcla con los subtitulos.
"""
import numpy as np
from PIL import Image
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "assets" / "bg_base.png"

# Lienzo mas grande que el 1080x1920 final para poder hacer zoom/pan sin bordes
W, H = 1600, 2844

canvas = np.zeros((H, W), dtype=np.float64)

yy, xx = np.mgrid[0:H, 0:W]


def spotlight(cx, cy, sigma_x, sigma_y, amp):
    return amp * np.exp(-(((xx - cx) ** 2) / (2 * sigma_x**2) + ((yy - cy) ** 2) / (2 * sigma_y**2)))


ground_y = H * 0.80
spread = W * 0.14

# focos elipticos en el suelo (simetricos izquierda/derecha), bien separados
canvas += spotlight(W * 0.26, ground_y, spread * 0.60, spread * 0.20, 130)
canvas += spotlight(W * 0.74, ground_y, spread * 0.60, spread * 0.20, 130)

# niebla/haz de luz subiendo desde cada foco, contenido a la mitad inferior del cuadro
beam_top = ground_y - H * 0.34
for cx in (W * 0.26, W * 0.74):
    beam = np.exp(-(((xx - cx) ** 2) / (2 * (W * 0.085) ** 2)))
    dist_above = np.clip(ground_y - yy, 0, None)
    vertical_fade = np.exp(-(dist_above**2) / (2 * (H * 0.11) ** 2))
    canvas += beam * vertical_fade * 60

canvas = np.clip(canvas, 0, 255)

img = Image.fromarray(canvas.astype(np.uint8), mode="L")
OUT.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT)
print(f"Escrito {OUT} ({W}x{H})")
