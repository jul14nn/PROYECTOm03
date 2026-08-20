// Querubín de alas azules susurrando al oído, redibujado cada frame con
// rough.js para que el trazo respire como un boceto. Trabaja en el mismo
// "design box" 400x560 que scene.js; app.js aplica la transformación de
// layout antes de llamar a draw(). La intensidad (0..1) controla el ritmo
// del aleteo, las partículas del susurro y el resplandor del canal.
const Cherub = (() => {
  const MOUTH = { x: 200, y: 330 };

  let particles = [];
  let arcs = [];
  let lastParticleSpawn = 0;
  let lastArcSpawn = 0;

  function reset() {
    particles = [];
    arcs = [];
  }

  function rotatedEllipse(rc, cx, cy, rx, ry, angleDeg, options) {
    const ctx = rc.canvas.getContext("2d");
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angleDeg * Math.PI) / 180);
    rc.ellipse(0, 0, rx * 2, ry * 2, options);
    ctx.restore();
  }

  const SKIN = {
    fill: "#f4f7fb",
    fillStyle: "solid",
    stroke: "#14161c",
    strokeWidth: 2,
    roughness: 0.9,
  };

  function drawWing(rc, ctx, time, intensity) {
    const anchorX = 262;
    const anchorY = 350;
    const flap =
      Math.sin(time * (2 + 6 * intensity)) * (6 + 10 * intensity);

    const feathers = 7;
    for (let i = 0; i < feathers; i++) {
      const t = i / (feathers - 1);
      // El abanico apunta arriba-derecha (espalda del querubín).
      const angle = -78 + t * 66 + flap;
      const len = 58 + Math.sin(t * Math.PI) * 52;
      const w = 9 + Math.sin(t * Math.PI) * 5;
      const rad = (angle * Math.PI) / 180;
      const cx = anchorX + Math.cos(rad) * len * 0.55;
      const cy = anchorY + Math.sin(rad) * len * 0.55;
      const shade = t < 0.34 ? "#8fd0ff" : t < 0.7 ? "#4a9be8" : "#2c6fc4";
      rotatedEllipse(rc, cx, cy, len * 0.55, w, angle, {
        fill: shade,
        fillStyle: "solid",
        stroke: "#0e2c4e",
        strokeWidth: 1.8,
        roughness: 1.1,
      });
    }
    // Coberteras cortas junto al hombro.
    for (let i = 0; i < 4; i++) {
      const angle = -70 + i * 18 + flap * 0.7;
      const rad = (angle * Math.PI) / 180;
      const cx = anchorX + Math.cos(rad) * 22;
      const cy = anchorY + Math.sin(rad) * 22;
      rotatedEllipse(rc, cx, cy, 18, 7, angle, {
        fill: "#b8e2ff",
        fillStyle: "solid",
        stroke: "#0e2c4e",
        strokeWidth: 1.4,
        roughness: 1.1,
      });
    }
  }

  function drawBody(rc, ctx) {
    // Pierna trasera: muslo-gemelo-pie muy solapados para leerse como una
    // sola pierna regordeta con pliegues, no como blobs sueltos.
    rotatedEllipse(rc, 294, 446, 24, 15, 75, SKIN);
    rotatedEllipse(rc, 296, 478, 13, 22, 8, SKIN);
    rotatedEllipse(rc, 292, 502, 9, 7, 0, SKIN);

    // Torso.
    rotatedEllipse(rc, 278, 380, 34, 48, 35, SKIN);

    // Pierna delantera.
    rotatedEllipse(rc, 312, 436, 27, 17, 55, SKIN);
    rotatedEllipse(rc, 322, 470, 13, 23, 18, SKIN);
    rotatedEllipse(rc, 327, 496, 10, 7, 10, SKIN);

    // Cabeza y rizos (solo en la coronilla, que no envuelvan la cara).
    rc.circle(228, 318, 60, SKIN);
    const curls = [
      [210, 291, 9],
      [224, 284, 10],
      [239, 286, 10],
      [251, 297, 9],
    ];
    curls.forEach(([x, y, r]) =>
      rc.circle(x, y, r * 2, {
        fill: "#e4e9f2",
        fillStyle: "solid",
        stroke: "#14161c",
        strokeWidth: 1.6,
        roughness: 1.2,
      })
    );

    // Naricilla y ojo cerrado (perfil mirando al canal).
    ctx.strokeStyle = "#14161c";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(199, 312);
    ctx.quadraticCurveTo(194, 317, 199, 321);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(207, 308);
    ctx.quadraticCurveTo(212, 312, 217, 309);
    ctx.stroke();

    // Brazo llevándose la mano a la boca.
    rotatedEllipse(rc, 245, 362, 17, 10, 30, SKIN);
    rotatedEllipse(rc, 216, 350, 10, 18, -20, SKIN);
    rotatedEllipse(rc, 204, 332, 8, 10, -10, SKIN);
  }

  function spawnParticles(time, intensity) {
    const interval = 1 / (2 + 16 * intensity);
    if (time - lastParticleSpawn > interval) {
      lastParticleSpawn = time;
      particles.push({
        x: MOUTH.x + (Math.random() - 0.5) * 6,
        y: MOUTH.y + (Math.random() - 0.5) * 8,
        vx: -(30 + 60 * intensity) * (0.8 + Math.random() * 0.4),
        vy: (Math.random() - 0.5) * 14,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5,
        size: 2.2 + Math.random() * 2,
        sparkle: Math.random() < 0.25,
      });
    }

    const arcInterval = 0.9 - 0.5 * intensity;
    if (time - lastArcSpawn > arcInterval) {
      lastArcSpawn = time;
      arcs.push({ life: 0, maxLife: 0.8 });
    }
  }

  function update(dt, time, intensity) {
    spawnParticles(time, intensity);

    particles.forEach((p) => {
      p.life += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt + Noise.fbm(p.x * 0.05, time, 2) * 10 * dt;
      // Curvan suavemente hacia el centro del canal.
      p.vy += (325 - p.y) * 0.8 * dt;
    });
    particles = particles.filter((p) => p.life < p.maxLife && p.x > 100);

    arcs.forEach((a) => (a.life += dt));
    arcs = arcs.filter((a) => a.life < a.maxLife);
  }

  function drawWhisper(ctx, intensity, time, canal) {
    // Resplandor pulsante dentro del canal.
    const pulse = 0.7 + 0.3 * Math.sin(time * 2.4);
    const glowAlpha = (0.08 + 0.3 * intensity) * pulse;
    const glow = ctx.createRadialGradient(canal.x, canal.y, 4, canal.x, canal.y, 70);
    glow.addColorStop(0, `rgba(255, 235, 220, ${glowAlpha})`);
    glow.addColorStop(1, "rgba(255, 235, 220, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glow;
    ctx.fillRect(canal.x - 70, canal.y - 70, 140, 140);
    ctx.restore();

    // Ondas del susurro abriéndose hacia el canal.
    arcs.forEach((a) => {
      const t = a.life / a.maxLife;
      const alpha = 0.5 * (1 - t);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(MOUTH.x - 4, MOUTH.y, 6 + t * 26, Math.PI * 0.62, Math.PI * 1.38);
      ctx.stroke();
    });

    // Partículas del susurro.
    particles.forEach((p) => {
      const t = p.life / p.maxLife;
      const alpha = (1 - t) * 0.9;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      if (p.sparkle) {
        const s = p.size * (1.6 - t);
        ctx.fillRect(p.x - s / 2, p.y - 0.7, s, 1.4);
        ctx.fillRect(p.x - 0.7, p.y - s / 2, 1.4, s);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function draw(ctx, rc, time, intensity, canal) {
    const bob = Math.sin(time * 1.3) * 3;
    ctx.save();
    ctx.translate(0, bob);
    drawWing(rc, ctx, time, intensity);
    drawBody(rc, ctx);
    ctx.restore();

    drawWhisper(ctx, intensity, time, canal);
  }

  return { update, draw, reset };
})();
