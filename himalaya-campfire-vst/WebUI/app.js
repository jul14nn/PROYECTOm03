// Módulo principal del plugin: bucle de animación + sincronización
// bidireccional del knob con el parámetro "intensity" del DAW. Si la página
// se abre fuera de JUCE (en un navegador normal, para desarrollo), el interop
// instala un stub de window.__JUCE__ y el knob funciona en local sin DAW.
import { getSliderState } from "./vendor/juce-webview-interop.js";

const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
const rc = rough.canvas(canvas);

let background = null;
let stars = [];
let width = 0;
let height = 0;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

let windGust = 0;
let windTarget = 0;
let nextWindChange = 0;

const intensityState = getSliderState("intensity");

Knob.attach(document.getElementById("knob"), {
  onChange: (v) => intensityState.setNormalisedValue(v),
  onDragStart: () => intensityState.sliderDragStarted(),
  onDragEnd: () => intensityState.sliderDragEnded(),
});

function syncFromHost() {
  Knob.setValue(intensityState.getNormalisedValue(), { fromHost: true });
}
intensityState.valueChangedEvent.addListener(syncFromHost);
intensityState.propertiesChangedEvent.addListener(syncFromHost);
syncFromHost();

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  background = Scene.build(width, height);
  stars = Scene.buildStars(width, height);
  Fire.reset();
}

function drawStars(time) {
  stars.forEach((s) => {
    const twinkle = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
    ctx.beginPath();
    ctx.fillStyle = `rgba(255,255,255,${0.35 + twinkle * 0.55})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function updateWind(time, dt) {
  if (time > nextWindChange) {
    windTarget = (Math.random() - 0.5) * (0.4 + Knob.value * 0.6);
    nextWindChange = time + 2 + Math.random() * 4;
  }
  windGust += (windTarget - windGust) * Math.min(1, dt * 1.5);
}

let lastTime = performance.now() / 1000;

function frame() {
  const now = performance.now() / 1000;
  const dt = Math.min(0.05, now - lastTime);
  lastTime = now;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(background, 0, 0, width, height);
  drawStars(now);

  updateWind(now, dt);

  const cx = width / 2;
  const baseY = height * 0.86;
  const intensity = Knob.value;

  Fire.update(dt, now, cx, baseY, intensity, windGust);
  Fire.draw(ctx, rc, now, cx, baseY, intensity, windGust);

  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
