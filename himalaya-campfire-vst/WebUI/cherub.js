// Querubín de alas azules susurrando al canal auditivo.
//
// Las partes del cuerpo se dibujan en dos pasadas: primero todas rellenas y
// perfiladas en oscuro (lo que fusiona los contornos en una sola silueta) y
// después rellenas en claro sin perfil. Así se lee como una figura entera y
// no como elipses sueltas apiladas. Un temblor mínimo por ruido ("boiling")
// imita el trazo redibujado a mano de la animación tradicional.
//
// Trabaja en el design box 400x560 de scene.js; app.js aplica la
// transformación de layout antes de llamar a draw(). El "drive" (0..1)
// combina el knob de intensidad con el nivel de audio que llega del DAW.
const Cherub = (() => {
  // La figura se dibuja en su propio espacio y se coloca en el design box con
  // esta transformación: así se reajusta su tamaño y su sitio dentro de la
  // oreja sin tocar las coordenadas de cada parte del cuerpo.
  const FIGURE = { scale: 0.82, dx: 54, dy: 88 };

  const MOUTH_LOCAL = { x: 198, y: 316 };
  const MOUTH = {
    x: MOUTH_LOCAL.x * FIGURE.scale + FIGURE.dx,
    y: MOUTH_LOCAL.y * FIGURE.scale + FIGURE.dy,
  };
  const WING_ANCHOR = { x: 300, y: 344 };

  const OUTLINE = "#120a10";
  const SKIN = "#f6f3ea";
  const OUTLINE_WIDTH = 7;

  let particles = [];
  let rings = [];
  let lastParticleSpawn = 0;
  let lastRingSpawn = 0;

  function reset() {
    particles = [];
    rings = [];
  }

  function ellipsePath(part) {
    const p = new Path2D();
    p.ellipse(part.x, part.y, part.rx, part.ry, ((part.rot || 0) * Math.PI) / 180, 0, Math.PI * 2);
    return p;
  }

  // Dibuja un grupo de partes como una silueta única.
  function drawSilhouette(ctx, parts, fillColor) {
    const paths = parts.map(ellipsePath);

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = OUTLINE;
    ctx.fillStyle = OUTLINE;
    ctx.lineWidth = OUTLINE_WIDTH;
    paths.forEach((p) => {
      ctx.fill(p);
      ctx.stroke(p);
    });

    ctx.fillStyle = fillColor;
    paths.forEach((p) => ctx.fill(p));
  }

  // Temblor sutil por ruido, distinto para cada parte, para que el dibujo
  // "hierva" como un boceto redibujado fotograma a fotograma.
  function boil(parts, time, seedBase) {
    return parts.map((part, i) => {
      const s = seedBase + i * 7.3;
      return {
        ...part,
        x: part.x + Noise.fbm(s, time * 1.8, 2) * 1.1,
        y: part.y + Noise.fbm(s + 40, time * 1.8, 2) * 1.1,
        rx: part.rx + Noise.fbm(s + 80, time * 1.4, 2) * 0.8,
        ry: part.ry + Noise.fbm(s + 120, time * 1.4, 2) * 0.8,
      };
    });
  }

  // Postura de putto arrodillado sobre el lóbulo, inclinado hacia el canal.
  // Con las piernas recogidas debajo del cuerpo la figura queda tan ancha como
  // alta y cabe dentro de la oreja; estiradas hacia atrás se salía por la
  // derecha y tapaba el canal.
  //
  // El cuerpo va por capas y cada una se dibuja como su propia silueta, de
  // atrás hacia delante. Así el contorno de cada capa recorta la anterior y
  // los miembros se distinguen; fundiéndolo todo en una sola silueta el
  // conjunto se leía como un bulto continuo.
  function bodyLayers(breath, nod) {
    return [
      // Pierna trasera, doblada bajo el cuerpo.
      [
        { x: 332, y: 424, rx: 28, ry: 17, rot: 95 },
        { x: 336, y: 450, rx: 16, ry: 12, rot: 10 },
      ],
      // Tronco: grupa redonda y pecho que respira.
      [
        { x: 312, y: 398, rx: 31, ry: 28, rot: 12 },
        { x: 288, y: 370, rx: 34, ry: 31 + breath, rot: 22 },
      ],
      // Pierna delantera, por delante del tronco.
      [
        { x: 298, y: 428, rx: 30, ry: 17, rot: 100 },
        { x: 302, y: 454, rx: 17, ry: 12, rot: 8 },
      ],
      // Cabeza y cuello.
      [
        { x: 262, y: 336 + nod, rx: 17, ry: 15 },
        { x: 232, y: 296 + nod, rx: 43, ry: 42 },
      ],
      // Brazo que se lleva la mano a la boca, por delante del pecho.
      [
        { x: 246, y: 350 + nod, rx: 20, ry: 11, rot: 22 },
        { x: 217, y: 340 + nod, rx: 18, ry: 10, rot: -16 },
        { x: 199, y: 329 + nod, rx: 11, ry: 10 },
      ],
    ];
  }

  // Rizos solo en la coronilla y la nuca: si envuelven toda la cabeza, el
  // perfil de la cara se pierde y parece una peluca.
  function hairParts(nod) {
    return [
      { x: 220, y: 258 + nod, rx: 17, ry: 15 },
      { x: 248, y: 260 + nod, rx: 16, ry: 15 },
      { x: 270, y: 280 + nod, rx: 14, ry: 13 },
      { x: 274, y: 304 + nod, rx: 11, ry: 12 },
    ];
  }

  function drawWing(ctx, time, drive) {
    const flap = Math.sin(time * (2.4 + 7 * drive)) * (9 + 26 * drive);
    const feathers = 8;

    // Cada pluma arrastra un poco a la anterior: da el latigazo del aleteo.
    const parts = [];
    for (let i = 0; i < feathers; i++) {
      const t = i / (feathers - 1);
      const lag = Math.sin(time * (2.4 + 7 * drive) - t * 0.9) * (9 + 26 * drive);
      const angle = -102 + t * 88 + lag;
      const len = 60 + Math.sin(t * Math.PI) * 74;
      const rad = (angle * Math.PI) / 180;
      parts.push({
        x: WING_ANCHOR.x + Math.cos(rad) * len * 0.55,
        y: WING_ANCHOR.y + Math.sin(rad) * len * 0.55,
        rx: len * 0.58,
        ry: 8 + Math.sin(t * Math.PI) * 5,
        rot: angle,
        shade: t < 0.34 ? "#a8dcff" : t < 0.7 ? "#4d9de6" : "#2364b8",
      });
    }

    // Silueta común del ala en oscuro...
    const paths = parts.map(ellipsePath);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = OUTLINE;
    ctx.fillStyle = OUTLINE;
    ctx.lineWidth = OUTLINE_WIDTH;
    paths.forEach((p) => {
      ctx.fill(p);
      ctx.stroke(p);
    });

    // ...y encima cada pluma con su propio azul, de fuera hacia dentro.
    parts.forEach((part, i) => {
      ctx.fillStyle = part.shade;
      ctx.fill(paths[i]);
    });

    // Coberteras: el bloque corto donde el ala nace del hombro.
    drawSilhouette(
      ctx,
      [
        { x: WING_ANCHOR.x + 2, y: WING_ANCHOR.y + 4, rx: 26, ry: 20, rot: -30 },
      ],
      "#7cc6f5"
    );
  }

  function drawFace(ctx, nod) {
    ctx.save();
    ctx.translate(0, nod);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";

    // Ceja y ojo cerrado: concentrado en el susurro.
    ctx.beginPath();
    ctx.moveTo(203, 285);
    ctx.quadraticCurveTo(212, 281, 221, 285);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(202, 297);
    ctx.quadraticCurveTo(211, 303, 220, 296);
    ctx.stroke();

    // Naricilla respingona.
    ctx.beginPath();
    ctx.moveTo(199, 303);
    ctx.quadraticCurveTo(192, 310, 200, 314);
    ctx.stroke();

    // Boca abierta susurrando.
    ctx.beginPath();
    ctx.ellipse(202, 321, 5, 3.6, -0.25, 0, Math.PI * 2);
    ctx.fillStyle = "#8d1424";
    ctx.fill();

    // Mofletes y pliegues: dan la blandura de bebé sin cargar el dibujo.
    ctx.strokeStyle = "rgba(196, 152, 146, 0.65)";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(214, 316, 9, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(300, 340);
    ctx.quadraticCurveTo(316, 352, 322, 368);
    ctx.stroke();
    ctx.restore();
  }

  function spawnWhisper(time, drive) {
    const interval = 1 / (6 + 42 * drive);
    if (time - lastParticleSpawn > interval) {
      lastParticleSpawn = time;
      particles.push({
        x: MOUTH.x + (Math.random() - 0.5) * 5,
        y: MOUTH.y + (Math.random() - 0.5) * 6,
        vx: -(44 + 96 * drive) * (0.85 + Math.random() * 0.3),
        vy: (Math.random() - 0.5) * 16,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.55,
        size: 1.5 + Math.random() * 2.6,
        sparkle: Math.random() < 0.3,
        seed: Math.random() * 100,
      });
    }

    const ringInterval = 0.62 - 0.4 * drive;
    if (time - lastRingSpawn > ringInterval) {
      lastRingSpawn = time;
      rings.push({ life: 0, maxLife: 0.75 });
    }
  }

  function update(dt, time, drive, canal) {
    spawnWhisper(time, drive);

    particles.forEach((p) => {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt + Noise.fbm(p.x * 0.06, time + p.seed, 2) * 26 * dt;
      // Se curvan hacia el centro del canal, como si las absorbiera.
      p.vy += (canal.y - p.y) * 1.6 * dt;
      p.vx -= 26 * dt;
    });
    particles = particles.filter((p) => p.life < p.maxLife && p.x > canal.x - 6);

    rings.forEach((r) => (r.life += dt));
    rings = rings.filter((r) => r.life < r.maxLife);
  }

  function drawWhisper(ctx, time, drive, canal) {
    // Resplandor dentro del canal: la oreja "recibe" el susurro.
    const pulse = 0.72 + 0.28 * Math.sin(time * 3.1);
    const glowAlpha = (0.1 + 0.5 * drive) * pulse;
    const glow = ctx.createRadialGradient(canal.x, canal.y, 3, canal.x, canal.y, 62);
    glow.addColorStop(0, `rgba(255, 244, 226, ${glowAlpha})`);
    glow.addColorStop(0.45, `rgba(255, 176, 120, ${glowAlpha * 0.45})`);
    glow.addColorStop(1, "rgba(255, 150, 100, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glow;
    ctx.fillRect(canal.x - 62, canal.y - 62, 124, 124);

    // Estela luminosa de la boca al canal, visible al subir la intensidad.
    if (drive > 0.05) {
      const trail = ctx.createLinearGradient(MOUTH.x, MOUTH.y, canal.x, canal.y);
      trail.addColorStop(0, `rgba(255, 250, 235, ${0.24 * drive})`);
      trail.addColorStop(1, "rgba(255, 200, 150, 0)");
      ctx.strokeStyle = trail;
      ctx.lineWidth = 5 + 12 * drive;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(MOUTH.x, MOUTH.y);
      ctx.quadraticCurveTo((MOUTH.x + canal.x) / 2, MOUTH.y + 8, canal.x + 6, canal.y - 4);
      ctx.stroke();
    }
    ctx.restore();

    // Ondas que salen de la boca.
    rings.forEach((r) => {
      const t = r.life / r.maxLife;
      const alpha = 0.55 * (1 - t) * (0.35 + 0.65 * drive);
      ctx.strokeStyle = `rgba(255, 252, 240, ${alpha})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(MOUTH.x - 3, MOUTH.y, 7 + t * 30, Math.PI * 0.6, Math.PI * 1.4);
      ctx.stroke();
    });

    // Partículas del susurro.
    particles.forEach((p) => {
      const t = p.life / p.maxLife;
      const alpha = (1 - t) * 0.95;
      ctx.fillStyle = `rgba(255, 253, 244, ${alpha})`;
      if (p.sparkle) {
        const s = p.size * (2.1 - t);
        ctx.fillRect(p.x - s / 2, p.y - 0.8, s, 1.6);
        ctx.fillRect(p.x - 0.8, p.y - s / 2, 1.6, s);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function draw(ctx, time, drive, canal) {
    const bob = Math.sin(time * 1.5) * (2.5 + 2.5 * drive);
    const breath = Math.sin(time * 2.2) * (1.2 + 1.6 * drive);
    const nod = Math.sin(time * 3.4) * (0.8 + 2.2 * drive);

    ctx.save();
    ctx.translate(FIGURE.dx, FIGURE.dy + bob);
    ctx.scale(FIGURE.scale, FIGURE.scale);

    drawWing(ctx, time, drive);
    bodyLayers(breath, nod).forEach((layer, i) =>
      drawSilhouette(ctx, boil(layer, time, 3 + i * 17), SKIN)
    );
    drawSilhouette(ctx, boil(hairParts(nod), time, 61), "#e6e0d2");
    drawFace(ctx, nod);

    ctx.restore();

    drawWhisper(ctx, time, drive, canal);
  }

  return { update, draw, reset };
})();
