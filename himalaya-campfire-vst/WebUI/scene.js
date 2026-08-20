// Fondo estático: oreja roja gigante sobre negro, con tramado de semitono
// real (se dibuja la oreja suave en un lienzo auxiliar, se lee su luminancia
// y se re-dibuja como puntos de radio proporcional, como una serigrafía).
//
// La geometría vive en un "design box" de 400x560 que Scene.layout() escala y
// centra en la ventana; el querubín (cherub.js) comparte ese sistema de
// coordenadas.
const Scene = (() => {
  const DESIGN_W = 400;
  const DESIGN_H = 560;

  // Silueta exterior de la oreja: ancha arriba, estrechando hasta el lóbulo.
  const EAR_PATH =
    "M196,18 C268,14 340,62 362,140 C380,205 372,268 352,322 " +
    "C334,372 318,410 300,446 C282,486 246,516 206,514 " +
    "C168,512 146,486 142,452 C138,414 150,392 140,362 " +
    "C126,322 96,300 78,262 C56,214 62,140 96,86 C122,44 156,20 196,18 Z";

  // Hélix: el reborde enrollado que recorre el contorno por dentro.
  const HELIX_PATH =
    "M96,300 C74,240 82,150 118,104 C150,64 210,44 262,64 " +
    "C316,84 344,140 346,196 C348,250 336,300 322,340 C308,382 296,414 282,440";

  // Antihélix: la "Y" central, con su tronco y sus dos ramas.
  const ANTIHELIX_STEM = "M256,336 C252,362 246,384 238,406";
  const ANTIHELIX_UPPER = "M256,336 C254,290 264,242 288,212";
  const ANTIHELIX_LOWER = "M256,336 C248,296 232,260 214,236";

  // El canal va en el centro de la cuenca, rodeado de rojo por todas partes;
  // pegado al borde se confundía con el fondo negro y parecía un bulto fuera
  // de la oreja en vez de un hueco dentro.
  const CANAL = { x: 168, y: 330, rx: 26, ry: 34 };
  const CONCHA = { x: 176, y: 328, rx: 68, ry: 86 };

  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  function layout(width, height) {
    // La oreja desborda ligeramente el alto: encuadre cerrado, recortada por
    // arriba y por abajo, como en un cartel.
    const scale = (height * 1.06) / DESIGN_H;
    const ox = width * 0.47 - (DESIGN_W / 2) * scale;
    const oy = (height - DESIGN_H * scale) / 2;
    return { scale, ox, oy, canal: CANAL };
  }

  // Dibuja una cresta: banda ancha de sombra + filo claro desplazado, para
  // que el relieve se lea como volumen y no como un tubo pegado encima.
  function ridge(ctx, pathString, baseWidth, lightOffset) {
    const p = new Path2D(pathString);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    [
      [baseWidth * 2.1, "rgba(108, 6, 16, 0.30)"],
      [baseWidth * 1.35, "rgba(122, 8, 18, 0.42)"],
      [baseWidth * 0.85, "rgba(140, 10, 20, 0.5)"],
    ].forEach(([w, color]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = w;
      ctx.stroke(p);
    });

    ctx.save();
    ctx.translate(lightOffset[0], lightOffset[1]);
    ctx.strokeStyle = "rgba(255, 138, 138, 0.55)";
    ctx.lineWidth = baseWidth * 0.62;
    ctx.stroke(p);
    ctx.restore();
  }

  // Pinta la oreja "suave" (sin tramar) en el contexto dado.
  function paintEar(ctx, width, height) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const { scale, ox, oy } = layout(width, height);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const earShape = new Path2D(EAR_PATH);

    // Halo rojo difuso: da presencia sobre el negro y evita el recorte seco.
    const halo = ctx.createRadialGradient(200, 280, 60, 200, 280, 330);
    halo.addColorStop(0, "rgba(214, 26, 42, 0.34)");
    halo.addColorStop(1, "rgba(214, 26, 42, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(-200, -160, DESIGN_W + 400, DESIGN_H + 320);

    ctx.fillStyle = "#ee1f2f";
    ctx.fill(earShape);

    ctx.save();
    ctx.clip(earShape);

    // Modelado general: luz arriba-izquierda, sombra hacia la cuenca.
    const shade = ctx.createLinearGradient(60, 40, 340, 520);
    shade.addColorStop(0, "rgba(255, 132, 132, 0.30)");
    shade.addColorStop(0.45, "rgba(255, 90, 95, 0.05)");
    shade.addColorStop(1, "rgba(96, 4, 14, 0.42)");
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    ridge(ctx, HELIX_PATH, 30, [-7, -8]);
    // El antihélix va mucho más suave que el hélix: marcarlo igual de fuerte
    // convierte la "Y" en una cicatriz que compite con la figura.
    ctx.save();
    ctx.globalAlpha = 0.32;
    ridge(ctx, ANTIHELIX_UPPER, 15, [-5, -5]);
    ridge(ctx, ANTIHELIX_LOWER, 13, [-5, -5]);
    ridge(ctx, ANTIHELIX_STEM, 13, [-5, -5]);
    ctx.restore();

    // Cuenca (concha): hueco profundo alrededor del canal.
    const bowl = ctx.createRadialGradient(
      CONCHA.x, CONCHA.y, 8,
      CONCHA.x + 10, CONCHA.y + 6, CONCHA.rx * 1.5
    );
    bowl.addColorStop(0, "rgba(48, 1, 8, 0.96)");
    bowl.addColorStop(0.42, "rgba(96, 3, 14, 0.5)");
    bowl.addColorStop(1, "rgba(104, 4, 16, 0)");
    ctx.fillStyle = bowl;
    ctx.beginPath();
    ctx.ellipse(CONCHA.x, CONCHA.y, CONCHA.rx, CONCHA.ry, -0.1, 0, Math.PI * 2);
    ctx.fill();

    // Canal auditivo: el punto más oscuro de toda la imagen.
    ctx.fillStyle = "#22030a";
    ctx.beginPath();
    ctx.ellipse(CANAL.x, CANAL.y, CANAL.rx, CANAL.ry, -0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#050106";
    ctx.beginPath();
    ctx.ellipse(CANAL.x - 3, CANAL.y + 2, CANAL.rx * 0.62, CANAL.ry * 0.66, -0.16, 0, Math.PI * 2);
    ctx.fill();

    // Trago: el pequeño saliente delante del canal.
    const tragus = ctx.createRadialGradient(118, 322, 3, 114, 330, 40);
    tragus.addColorStop(0, "rgba(255, 142, 140, 0.6)");
    tragus.addColorStop(0.62, "rgba(190, 22, 34, 0.35)");
    tragus.addColorStop(1, "rgba(120, 6, 16, 0)");
    ctx.fillStyle = tragus;
    ctx.beginPath();
    ctx.ellipse(118, 328, 32, 44, 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Lóbulo: carnoso, más iluminado, sin estructura dura.
    const lobe = ctx.createRadialGradient(206, 452, 6, 206, 462, 78);
    lobe.addColorStop(0, "rgba(255, 128, 128, 0.42)");
    lobe.addColorStop(1, "rgba(255, 128, 128, 0)");
    ctx.fillStyle = lobe;
    ctx.beginPath();
    ctx.arc(206, 458, 78, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // fin del clip

    ctx.restore(); // fin de la transformación de layout
  }

  // Convierte el lienzo suave en puntos de semitono: cada celda mide la
  // luminancia local y se dibuja un punto de ese tamaño y color.
  function halftone(sourceCtx, targetCtx, width, height) {
    const cell = 3.1;
    const cols = Math.ceil(width / cell);
    const rows = Math.ceil(height / cell);
    const { data } = sourceCtx.getImageData(0, 0, width, height);
    const rand = seededRandom(4242);

    targetCtx.fillStyle = "#000000";
    targetCtx.fillRect(0, 0, width, height);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Muestra el centro de la celda (más rápido y nítido que promediar).
        const sx = Math.min(width - 1, Math.floor(col * cell + cell / 2));
        const sy = Math.min(height - 1, Math.floor(row * cell + cell / 2));
        const i = (sy * width + sx) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (lum < 0.012) continue;

        // Curva agresiva: el rojo pleno de la oreja debe salir sólido (los
        // puntos se solapan) y solo romperse en grano hacia las sombras. Con
        // una gamma suave el conjunto se apaga y la oreja pierde cuerpo.
        const grit = (rand() - 0.5) * 0.2;
        const amount = Math.max(0, Math.pow(lum, 0.42) * 1.2 + grit);
        if (amount <= 0.02) continue;

        const radius = Math.min(amount, 1.25) * cell * 0.82;
        const cx = col * cell + cell / 2 + (rand() - 0.5) * 0.9;
        const cy = row * cell + cell / 2 + (rand() - 0.5) * 0.9;

        // Los puntos claros tiran a rojo puro saturado; los oscuros, a granate.
        targetCtx.fillStyle = `rgb(${Math.min(255, r * 1.12 + 18)}, ${g * 0.85}, ${b * 0.85})`;
        targetCtx.beginPath();
        targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
        targetCtx.fill();
      }
    }
  }

  // El canal se repinta en negro sólido por encima del tramado: tramado se lee
  // como sombra, no como agujero, y el canal tiene que ser un hueco real. El
  // borde se deshilacha con puntitos para que no corte como una pegatina.
  function punchCanal(ctx, width, height) {
    const { scale, ox, oy } = layout(width, height);
    const rand = seededRandom(555);

    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(CANAL.x, CANAL.y, CANAL.rx * 0.94, CANAL.ry * 0.94, -0.16, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 260; i++) {
      const a = rand() * Math.PI * 2;
      const spread = 0.94 + rand() * 0.3;
      ctx.beginPath();
      ctx.arc(
        CANAL.x + Math.cos(a) * CANAL.rx * spread,
        CANAL.y + Math.sin(a) * CANAL.ry * spread,
        rand() * 1.7,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.restore();
  }

  function build(width, height) {
    const art = document.createElement("canvas");
    art.width = width;
    art.height = height;
    paintEar(art.getContext("2d", { willReadFrequently: true }), width, height);

    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const outCtx = out.getContext("2d");
    halftone(art.getContext("2d", { willReadFrequently: true }), outCtx, width, height);
    punchCanal(outCtx, width, height);

    return out;
  }

  // Textura de grano que app.js superpone en cada fotograma (desplazándola)
  // para que toda la escena, querubín incluido, comparta el mismo ruido.
  function buildGrainTile(size = 180) {
    const tile = document.createElement("canvas");
    tile.width = size;
    tile.height = size;
    const ctx = tile.getContext("2d");
    const img = ctx.createImageData(size, size);
    const rand = seededRandom(909);

    for (let i = 0; i < size * size; i++) {
      const v = rand();
      const o = i * 4;
      // Motas claras y oscuras, mayoritariamente transparentes.
      const light = v > 0.94;
      const dark = v < 0.06;
      img.data[o] = light ? 255 : 0;
      img.data[o + 1] = light ? 210 : 0;
      img.data[o + 2] = light ? 210 : 0;
      img.data[o + 3] = light ? 48 : dark ? 56 : 0;
    }

    ctx.putImageData(img, 0, 0);
    return tile;
  }

  return { build, layout, buildGrainTile };
})();
