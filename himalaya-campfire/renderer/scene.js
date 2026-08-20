// Fondo estático (cielo, estrellas, luna, cordillera del Himalaya) dibujado
// una vez a un canvas offscreen con trazo "boceteado" (rough.js) y reutilizado
// cada frame, para no repetir el sorteo del sketch en cada tick.
const Scene = (() => {
  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  }

  function buildStars(width, height, count = 140) {
    const rand = seededRandom(42);
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: rand() * width,
        y: rand() * height * 0.62,
        r: 0.6 + rand() * 1.6,
        phase: rand() * Math.PI * 2,
        speed: 0.6 + rand() * 1.2,
      });
    }
    return stars;
  }

  function mountainRidge(rand, width, baseY, amplitude, segments) {
    const points = [[-20, baseY + amplitude]];
    const step = (width + 40) / segments;
    for (let i = 0; i <= segments; i++) {
      const x = -20 + i * step;
      const peakChance = rand();
      const y =
        baseY -
        amplitude * (0.35 + 0.65 * Math.abs(Math.sin(i * 0.9 + rand() * 2))) *
          (peakChance > 0.25 ? 1 : 0.4);
      points.push([x, y]);
    }
    points.push([width + 20, baseY + amplitude]);
    return points;
  }

  function drawMoon(rc, ctx, cx, cy, radius) {
    rc.circle(cx, cy, radius * 2, {
      fill: "#f3ecd8",
      fillStyle: "hachure",
      hachureGap: 3,
      fillWeight: 1,
      stroke: "#1a1a1a",
      strokeWidth: 2.5,
      roughness: 1.6,
    });
    const craterRand = seededRandom(7);
    for (let i = 0; i < 4; i++) {
      const angle = craterRand() * Math.PI * 2;
      const dist = craterRand() * radius * 0.6;
      rc.circle(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, radius * (0.15 + craterRand() * 0.15), {
        fill: "#d8cba8",
        fillStyle: "solid",
        stroke: "#1a1a1a",
        strokeWidth: 1.2,
        roughness: 1.8,
      });
    }
  }

  function build(width, height) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const rc = rough.canvas(canvas);

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, "#0b1130");
    sky.addColorStop(0.45, "#1b2255");
    sky.addColorStop(0.72, "#3a2a5c");
    sky.addColorStop(1, "#5b3350");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    drawMoon(rc, ctx, width * 0.82, height * 0.16, Math.max(22, width * 0.022));

    const layers = [
      { baseY: height * 0.62, amp: height * 0.16, color: "#241a3e", segs: 7, seed: 11 },
      { baseY: height * 0.72, amp: height * 0.2, color: "#33244f", segs: 8, seed: 23 },
      { baseY: height * 0.84, amp: height * 0.24, color: "#3f2a4a", segs: 9, seed: 31 },
    ];

    layers.forEach((layer) => {
      const rand = seededRandom(layer.seed);
      const ridge = mountainRidge(rand, width, layer.baseY, layer.amp, layer.segs);
      const polygon = [...ridge, [width + 20, height + 20], [-20, height + 20]];
      rc.polygon(polygon, {
        fill: layer.color,
        fillStyle: "hachure",
        hachureGap: 6,
        fillWeight: 1.1,
        stroke: "#120a20",
        strokeWidth: 2.2,
        roughness: 1.4,
      });

      // Capuchones de nieve: un trazo claro cerca de cada pico.
      for (let i = 1; i < ridge.length - 2; i++) {
        const [x, y] = ridge[i];
        if (y < layer.baseY - layer.amp * 0.45) {
          rc.line(x - 14, y + 14, x + 14, y + 14, {
            stroke: "#e8e4f2",
            strokeWidth: 3,
            roughness: 2,
          });
        }
      }
    });

    // Nieve del campamento en primer plano.
    const foregroundRand = seededRandom(99);
    const groundY = height * 0.88;
    const groundPts = mountainRidge(foregroundRand, width, groundY, height * 0.02, 6).map(
      ([x, y]) => [x, Math.min(y, groundY + height * 0.02)]
    );
    const groundPolygon = [...groundPts, [width + 20, height + 20], [-20, height + 20]];
    rc.polygon(groundPolygon, {
      fill: "#efeaf4",
      fillStyle: "cross-hatch",
      hachureGap: 5,
      fillWeight: 1,
      stroke: "#1a1a1a",
      strokeWidth: 2.4,
      roughness: 1.3,
    });

    return canvas;
  }

  return { build, buildStars };
})();
