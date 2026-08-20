// Módulo principal del plugin: bucle de animación, sincronización bidireccional
// del knob con el parámetro "intensity" del DAW, y recepción del nivel de audio
// que el procesador envía para que la escena reaccione a la música.
//
// Si la página se abre fuera de JUCE (en un navegador, para desarrollo), el
// interop instala un stub de window.__JUCE__: el knob sigue funcionando y el
// nivel de audio se queda a cero.
import { getSliderState } from "./vendor/juce-webview-interop.js";

const canvas = document.getElementById("scene");
const ctx = canvas.getContext("2d");

let background = null;
let sceneLayout = null;
let grainTile = null;
let grainPattern = null;
let width = 0;
let height = 0;
const dpr = Math.min(window.devicePixelRatio || 1, 2);

//==============================================================================
// Parámetro "intensity" <-> knob
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

//==============================================================================
// Nivel de audio enviado por el procesador (0..1, ya suavizado en C++).
let audioLevel = 0;
let smoothedLevel = 0;

window.__JUCE__.backend.addEventListener("audioLevel", (payload) => {
  const value = typeof payload === "number" ? payload : payload?.level;
  if (typeof value === "number" && Number.isFinite(value)) audioLevel = value;
});

//==============================================================================
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

  if (grainTile === null) grainTile = Scene.buildGrainTile();
  grainPattern = ctx.createPattern(grainTile, "repeat");

  Cherub.reset();
}

let lastTime = performance.now() / 1000;

function frame() {
  const now = performance.now() / 1000;
  const dt = Math.min(0.05, now - lastTime);
  lastTime = now;

  // El nivel sube rápido y cae despacio: así el golpe se ve y la caída
  // acompaña al sonido en vez de parpadear con cada bloque de audio.
  const attack = audioLevel > smoothedLevel ? 0.55 : 0.06;
  smoothedLevel += (audioLevel - smoothedLevel) * attack;

  // El knob decide cuánto reacciona la escena; el audio, cuándo. Sin señal
  // queda una animación de reposo para que el plugin nunca parezca congelado.
  const drive = Math.min(1, Knob.value * (0.32 + 0.85 * smoothedLevel));

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(background, 0, 0, width, height);

  Cherub.update(dt, now, drive, sceneLayout.canal);

  ctx.save();
  ctx.translate(sceneLayout.ox, sceneLayout.oy);
  ctx.scale(sceneLayout.scale, sceneLayout.scale);
  Cherub.draw(ctx, now, drive, sceneLayout.canal);
  ctx.restore();

  // Grano por encima de todo, desplazado cada fotograma, para que el
  // querubín y la oreja compartan la misma textura de impresión.
  if (grainPattern) {
    ctx.save();
    ctx.translate(-Math.floor(Math.random() * 180), -Math.floor(Math.random() * 180));
    ctx.fillStyle = grainPattern;
    ctx.fillRect(0, 0, width + 180, height + 180);
    ctx.restore();
  }

  requestAnimationFrame(frame);
}

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
