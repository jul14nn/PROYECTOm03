// Fondo estático: oreja roja gigante estilo semitono/grano sobre negro,
// dibujada una vez a un canvas offscreen. La geometría vive en un "design
// box" de 400x560 que Scene.layout() escala y centra en la ventana; el
// querubín (cherub.js) comparte ese mismo sistema de coordenadas.
const Scene = (() => {
  const DESIGN_W = 400;
  const DESIGN_H = 560;

  // Silueta de la oreja (canal mirando a la izquierda, lóbulo abajo).
  const EAR_PATH =
    "M70,120 C110,30 220,10 290,45 C360,80 390,170 385,260 " +
    "C380,360 340,440 280,495 C230,540 150,555 105,520 " +
    "C60,485 45,430 55,380 C40,330 40,250 55,200 C60,165 62,140 70,120 Z";

  // Crestas interiores (hélix y antihélix), como trazos abiertos.
  const HELIX_PATH = "M95,135 C160,60 260,60 320,125 C355,170 362,240 355,300 C348,370 315,430 275,465";
  const ANTIHELIX_PATH = "M170,150 C230,170 260,210 262,265 C263,300 256,330 244,355";

  const CANAL = { x: 145, y: 325, rx: 40, ry: 52 };

  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  function layout(width, height) {
    const scale = (height * 0.94) / DESIGN_H;
    const ox = width * 0.42 - 200 * scale;
    const oy = (height - DESIGN_H * scale) / 2;
    return { scale, ox, oy, canal: CANAL };
  }

  function build(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const rc = rough.canvas(canvas);

    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, width, height);

    const { scale, ox, oy } = layout(width, height);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const earShape = new Path2D(EAR_PATH);

    // Halo rojo suave alrededor de la oreja, sobre el negro.
    const halo = ctx.createRadialGradient(200, 290, 80, 200, 290, 340);
    halo.addColorStop(0, "rgba(220, 40, 55, 0.30)");
    halo.addColorStop(1, "rgba(220, 40, 55, 0)");
    ctx.fillStyle = halo;
    ctx.fillRect(-160, -120, DESIGN_W + 320, DESIGN_H + 240);

    // Base de la oreja.
    ctx.fillStyle = "#e8323c";
    ctx.fill(earShape);

    // Todo el detalle interior queda recortado a la silueta.
    ctx.save();
    ctx.clip(earShape);

    // Sombreado general hacia la cuenca.
    const bowlShade = ctx.createRadialGradient(185, 330, 30, 185, 330, 240);
    bowlShade.addColorStop(0, "rgba(140, 12, 24, 0.55)");
    bowlShade.addColorStop(0.55, "rgba(160, 18, 30, 0.18)");
    bowlShade.addColorStop(1, "rgba(255, 110, 115, 0.12)");
    ctx.fillStyle = bowlShade;
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);

    // Crestas: varias pasadas concéntricas de sombra difusa para que el
    // relieve se funda con la piel en vez de leerse como un tubo suelto.
    const ridge = (path, baseW, withHighlight) => {
      const p = new Path2D(path);
      ctx.lineCap = "round";
      const passes = [
        [baseW * 2.0, "rgba(150, 14, 26, 0.18)"],
        [baseW * 1.4, "rgba(150, 14, 26, 0.26)"],
        [baseW * 0.8, "rgba(140, 10, 22, 0.4)"],
      ];
      passes.forEach(([w, color]) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = w;
        ctx.stroke(p);
      });
      if (withHighlight) {
        ctx.save();
        ctx.translate(-5, -6);
        ctx.strokeStyle = "rgba(255, 130, 132, 0.35)";
        ctx.lineWidth = baseW * 0.7;
        ctx.stroke(p);
        ctx.restore();
      }
    };
    ridge(HELIX_PATH, 24, true);
    ridge(ANTIHELIX_PATH, 14, false);

    // Cuenca (concha) y canal auditivo.
    const bowl = ctx.createRadialGradient(185, 330, 15, 185, 330, 115);
    bowl.addColorStop(0, "rgba(120, 8, 18, 0.9)");
    bowl.addColorStop(1, "rgba(120, 8, 18, 0)");
    ctx.fillStyle = bowl;
    ctx.beginPath();
    ctx.ellipse(185, 330, 100, 110, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3d060c";
    ctx.beginPath();
    ctx.ellipse(CANAL.x, CANAL.y, CANAL.rx, CANAL.ry, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#17020a";
    ctx.beginPath();
    ctx.ellipse(CANAL.x - 6, CANAL.y, CANAL.rx * 0.55, CANAL.ry * 0.6, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Trago (bulto delante del canal): sombra y luz suaves, sin contorno.
    const tragusShade = ctx.createRadialGradient(100, 324, 4, 100, 324, 34);
    tragusShade.addColorStop(0, "rgba(255, 120, 124, 0.55)");
    tragusShade.addColorStop(0.7, "rgba(150, 14, 26, 0.3)");
    tragusShade.addColorStop(1, "rgba(150, 14, 26, 0)");
    ctx.fillStyle = tragusShade;
    ctx.beginPath();
    ctx.ellipse(100, 324, 34, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    const lobe = ctx.createRadialGradient(150, 480, 5, 150, 480, 62);
    lobe.addColorStop(0, "rgba(255, 120, 125, 0.5)");
    lobe.addColorStop(1, "rgba(255, 120, 125, 0)");
    ctx.fillStyle = lobe;
    ctx.beginPath();
    ctx.arc(150, 480, 62, 0, Math.PI * 2);
    ctx.fill();

    // Trama de semitono: rejilla de puntos oscuros de tamaño variable.
    const dotRand = seededRandom(77);
    ctx.fillStyle = "rgba(90, 5, 12, 0.32)";
    for (let gy = 0; gy < DESIGN_H; gy += 7) {
      for (let gx = 0; gx < DESIGN_W; gx += 7) {
        const n = Noise.fbm(gx * 0.02, gy * 0.02, 2);
        const r = 0.8 + (n + 0.5) * 1.6 + dotRand() * 0.5;
        ctx.beginPath();
        ctx.arc(gx + dotRand() * 2, gy + dotRand() * 2, Math.max(0.3, r), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Grano fino: motas claras y oscuras dispersas.
    const grainRand = seededRandom(191);
    for (let i = 0; i < 2600; i++) {
      const x = grainRand() * DESIGN_W;
      const y = grainRand() * DESIGN_H;
      ctx.fillStyle = grainRand() > 0.5 ? "rgba(255, 215, 215, 0.14)" : "rgba(40, 0, 5, 0.2)";
      ctx.fillRect(x, y, 1.4, 1.4);
    }

    ctx.restore(); // fin del clip

    // Contorno boceteado por encima de todo.
    rc.path(EAR_PATH, {
      stroke: "#1a1216",
      strokeWidth: 3.5,
      roughness: 1.7,
      fill: undefined,
    });
    rc.path(HELIX_PATH, {
      stroke: "rgba(70, 4, 12, 0.4)",
      strokeWidth: 1.6,
      roughness: 2.2,
    });
    rc.path(ANTIHELIX_PATH, {
      stroke: "rgba(70, 4, 12, 0.3)",
      strokeWidth: 1.4,
      roughness: 2.2,
    });

    ctx.restore();

    // Grano tenue también sobre el fondo negro, como en una impresión.
    const bgGrain = seededRandom(311);
    for (let i = 0; i < 1400; i++) {
      const x = bgGrain() * width;
      const y = bgGrain() * height;
      ctx.fillStyle = "rgba(200, 60, 70, 0.05)";
      ctx.fillRect(x, y, 1.5, 1.5);
    }

    return canvas;
  }

  return { build, layout };
})();
