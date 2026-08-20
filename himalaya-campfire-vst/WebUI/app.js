// Módulo principal del plugin: bucle de animación + sincronización
// bidireccional del knob con el parámetro "intensity" del DAW. Si la página
// se abre fuera de JUCE (en un navegador normal, para desarrollo), el interop
// instala un stub de window.__JUCE__ y el knob funciona en local sin DAW.
import { getSliderState } from "./vendor/juce-webview-interop.js";

const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");
const rc = rough.canvas(canvas);

let background = null;
let sceneLayout = null;
let width = 0;
let height = 0;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

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
  sceneLayout = Scene.layout(width, height);
  Cherub.reset();
}

let lastTime = performance.now() / 1000;

function frame() {
  const now = performance.now() / 1000;
  const dt = Math.min(0.05, now - lastTime);
  lastTime = now;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(background, 0, 0, width, height);

  const intensity = Knob.value;

  Cherub.update(dt, now, intensity);

  // El querubín y el susurro se dibujan en coordenadas del design box.
  ctx.save();
  ctx.translate(sceneLayout.ox, sceneLayout.oy);
  ctx.scale(sceneLayout.scale, sceneLayout.scale);
  Cherub.draw(ctx, rc, now, intensity, sceneLayout.canal);
  ctx.restore();

  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
