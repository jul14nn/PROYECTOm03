// Fogata ilustrada estilo "grunge": troncos, piedras, llamas, brasas y humo,
// todo redibujado cada frame con rough.js para que el trazo respire como un
// boceto animado. La intensidad (0..1) viene del knob de la interfaz.
const Fire = (() => {
  let embers = [];
  let smokeWisps = [];
  let lastEmberSpawn = 0;
  let lastSmokeSpawn = 0;

  function reset() {
    embers = [];
    smokeWisps = [];
  }

  function flameTongue(cx, baseY, maxHeight, baseWidth, time, seed, windGust) {
    const segments = 14;
    const right = [];
    const left = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const y = baseY - maxHeight * t;
      const width = baseWidth * Math.pow(1 - t, 1.25) * (1 + 0.25 * Math.sin(t * Math.PI));
      const wobble = Noise.fbm(t * 2.4, time * 1.4 + seed, 2) * maxHeight * 0.16 * t;
      const sway = windGust * t * t * baseWidth * 1.6;
      const xOffset = wobble + sway;
      right.push([cx + xOffset + width / 2, y]);
      left.push([cx + xOffset - width / 2, y]);
    }
    return [...right, ...left.reverse()];
  }

  function drawLogsAndStones(rc, cx, baseY) {
    // Círculo de piedras.
    for (let i = 0; i < 9; i++) {
      const angle = (i / 9) * Math.PI * 2;
      const rx = cx + Math.cos(angle) * 78;
      const ry = baseY + 10 + Math.sin(angle) * 20;
      rc.ellipse(rx, ry, 26, 16, {
        fill: "#8b8496",
        fillStyle: "hachure",
        hachureGap: 3,
        stroke: "#1a1a1a",
        strokeWidth: 2,
        roughness: 1.6,
      });
    }
    // Troncos cruzados.
    const logs = [
      { x1: cx - 70, y1: baseY + 4, x2: cx + 55, y2: baseY - 14 },
      { x1: cx - 55, y1: baseY - 6, x2: cx + 70, y2: baseY + 8 },
      { x1: cx - 40, y1: baseY + 18, x2: cx + 40, y2: baseY + 20 },
    ];
    logs.forEach((log) => {
      rc.line(log.x1, log.y1, log.x2, log.y2, {
        stroke: "#1a1a1a",
        strokeWidth: 22,
        roughness: 1.8,
      });
      rc.line(log.x1, log.y1, log.x2, log.y2, {
        stroke: "#6b3f2a",
        strokeWidth: 16,
        roughness: 2.2,
      });
    });
  }

  function drawGlow(ctx, cx, baseY, intensity) {
    const radius = 140 + intensity * 260;
    const glow = ctx.createRadialGradient(cx, baseY - 20, 10, cx, baseY - 20, radius);
    glow.addColorStop(0, `rgba(255, 200, 90, ${0.55 * intensity + 0.15})`);
    glow.addColorStop(0.4, `rgba(255, 130, 40, ${0.28 * intensity + 0.08})`);
    glow.addColorStop(1, "rgba(255, 90, 20, 0)");
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glow;
    ctx.fillRect(cx - radius, baseY - radius, radius * 2, radius * 2);
    ctx.restore();
  }

  function drawFlames(rc, cx, baseY, time, intensity, windGust) {
    const clusters = [
      { dx: 0, seed: 0, heightMul: 1, widthMul: 1 },
      { dx: -30, seed: 4.1, heightMul: 0.72, widthMul: 0.6 },
      { dx: 32, seed: 8.3, heightMul: 0.68, widthMul: 0.58 },
    ];
    const layers = [
      { color: "#b8280f", inset: 1, heightMul: 1, roughness: 1.6, fillStyle: "hachure" },
      { color: "#e8630f", inset: 0.72, heightMul: 0.88, roughness: 1.4, fillStyle: "zigzag" },
      { color: "#f7a92e", inset: 0.46, heightMul: 0.7, roughness: 1.3, fillStyle: "zigzag" },
      { color: "#fff0b0", inset: 0.22, heightMul: 0.46, roughness: 1.1, fillStyle: "solid" },
    ];

    clusters.forEach((cluster) => {
      const maxH = (90 + intensity * 150) * cluster.heightMul;
      const baseW = (46 + intensity * 30) * cluster.widthMul;
      layers.forEach((layer) => {
        const points = flameTongue(
          cx + cluster.dx * layer.inset,
          baseY,
          maxH * layer.heightMul,
          baseW * layer.inset,
          time,
          cluster.seed + layer.inset * 3,
          windGust
        );
        rc.polygon(points, {
          fill: layer.color,
          fillStyle: layer.fillStyle,
          hachureGap: 2.4,
          fillWeight: 1,
          stroke: "#2a0e04",
          strokeWidth: layer.inset > 0.9 ? 2.2 : 1.2,
          roughness: layer.roughness,
        });
      });
    });
  }

  function spawnEmbers(time, cx, baseY, intensity, windGust) {
    const rate = 0.03 + intensity * 0.09;
    if (time - lastEmberSpawn > rate) {
      lastEmberSpawn = time;
      const count = 1 + Math.floor(intensity * 2);
      for (let i = 0; i < count; i++) {
        embers.push({
          x: cx + (Math.random() - 0.5) * 40,
          y: baseY - 40 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 12 + windGust * 40,
          vy: -(40 + Math.random() * 50 + intensity * 40),
          life: 0,
          maxLife: 1.2 + Math.random() * 1.4,
          size: 1.4 + Math.random() * 2,
        });
      }
    }
  }

  function updateEmbers(dt, windGust) {
    embers.forEach((e) => {
      e.life += dt;
      e.x += e.vx * dt + windGust * 20 * dt;
      e.y += e.vy * dt;
      e.vy += 18 * dt; // gravedad suave
      e.vx += (Noise.fbm(e.x * 0.02, e.y * 0.02, 2)) * 8 * dt;
    });
    embers = embers.filter((e) => e.life < e.maxLife);
  }

  function drawEmbers(ctx) {
    embers.forEach((e) => {
      const t = e.life / e.maxLife;
      const alpha = 1 - t;
      const r = e.size * (1 - t * 0.4);
      const hue = 50 - t * 40;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${hue}, 100%, ${60 - t * 20}%, ${alpha})`;
      ctx.arc(e.x, e.y, Math.max(0.4, r), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function spawnSmoke(time, cx, baseY, intensity) {
    if (intensity < 0.25) return;
    const rate = 0.9 - intensity * 0.4;
    if (time - lastSmokeSpawn > rate) {
      lastSmokeSpawn = time;
      smokeWisps.push({
        x: cx + (Math.random() - 0.5) * 20,
        y: baseY - 150 - intensity * 60,
        life: 0,
        maxLife: 4 + Math.random() * 2,
        seed: Math.random() * 100,
        drift: (Math.random() - 0.5) * 10,
      });
    }
  }

  function updateSmoke(dt) {
    smokeWisps.forEach((s) => (s.life += dt));
    smokeWisps = smokeWisps.filter((s) => s.life < s.maxLife);
  }

  function drawSmoke(rc, time) {
    smokeWisps.forEach((s) => {
      const t = s.life / s.maxLife;
      const alpha = 0.22 * (1 - t);
      if (alpha <= 0.01) return;
      const y = s.y - t * 120;
      const x = s.x + s.drift * t * 10 + Noise.fbm(t * 2, s.seed, 2) * 30;
      const size = 30 + t * 60;
      rc.ellipse(x, y, size, size * 0.7, {
        fill: `rgba(200, 200, 210, ${alpha})`,
        fillStyle: "hachure",
        hachureGap: 4,
        stroke: `rgba(120,120,130,${alpha})`,
        strokeWidth: 1,
        roughness: 2.4,
      });
    });
  }

  function update(dt, time, cx, baseY, intensity, windGust) {
    spawnEmbers(time, cx, baseY, intensity, windGust);
    updateEmbers(dt, windGust);
    spawnSmoke(time, cx, baseY, intensity);
    updateSmoke(dt);
  }

  function draw(ctx, rc, time, cx, baseY, intensity, windGust) {
    drawGlow(ctx, cx, baseY, intensity);
    drawSmoke(rc, time);
    drawLogsAndStones(rc, cx, baseY);
    drawFlames(rc, cx, baseY, time, intensity, windGust);
    drawEmbers(ctx);
  }

  return { update, draw, reset };
})();
