"use strict";

const STORAGE_KEY = "eqalert.settings.v1";
const SEEN_KEY = "eqalert.seen.v1";
const SEEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // prune seen-ids older than a week

const FEED_URLS = {
  hour: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
  day: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
  week: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
};

const els = {
  btnLocate: document.getElementById("btn-locate"),
  locationStatus: document.getElementById("location-status"),
  lat: document.getElementById("lat"),
  lon: document.getElementById("lon"),
  btnManual: document.getElementById("btn-manual"),
  radius: document.getElementById("radius"),
  minMag: document.getElementById("min-mag"),
  feedWindow: document.getElementById("feed-window"),
  pollInterval: document.getElementById("poll-interval"),
  btnNotify: document.getElementById("btn-notify"),
  notifyStatus: document.getElementById("notify-status"),
  btnStart: document.getElementById("btn-start"),
  btnStop: document.getElementById("btn-stop"),
  btnCheckNow: document.getElementById("btn-check-now"),
  monitorStatus: document.getElementById("monitor-status"),
  alertCard: document.getElementById("alert-banner-card"),
  alertBanner: document.getElementById("alert-banner"),
  quakeList: document.getElementById("quake-list"),
};

let state = loadSettings();
let pollTimer = null;
let seenIds = loadSeen();

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore corrupt storage */ }
  return { lat: null, lon: null, radius: 300, minMag: 3.0, feedWindow: "day", pollInterval: 120000 };
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadSeen() {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore corrupt storage */ }
  return {};
}

function saveSeen() {
  const cutoff = Date.now() - SEEN_MAX_AGE_MS;
  for (const id of Object.keys(seenIds)) {
    if (seenIds[id] < cutoff) delete seenIds[id];
  }
  localStorage.setItem(SEEN_KEY, JSON.stringify(seenIds));
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime;
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.3, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.3);
    });
  } catch (e) { /* audio not available */ }
}

function initUI() {
  if (state.lat != null && state.lon != null) {
    els.lat.value = state.lat;
    els.lon.value = state.lon;
    els.locationStatus.textContent = `Ubicación: ${state.lat.toFixed(4)}, ${state.lon.toFixed(4)}`;
  }
  els.radius.value = state.radius;
  els.minMag.value = state.minMag;
  els.feedWindow.value = state.feedWindow;
  els.pollInterval.value = String(state.pollInterval);

  if ("Notification" in window && Notification.permission === "granted") {
    els.notifyStatus.textContent = "Notificaciones activadas";
  }
}

function setLocation(lat, lon) {
  state.lat = lat;
  state.lon = lon;
  saveSettings();
  els.lat.value = lat;
  els.lon.value = lon;
  els.locationStatus.textContent = `Ubicación: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}

els.btnLocate.addEventListener("click", () => {
  if (!("geolocation" in navigator)) {
    els.locationStatus.textContent = "Geolocalización no disponible en este navegador";
    return;
  }
  els.locationStatus.textContent = "Obteniendo ubicación...";
  navigator.geolocation.getCurrentPosition(
    (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
    (err) => {
      els.locationStatus.textContent = `No se pudo obtener ubicación (${err.message}). Ingrésala manualmente.`;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
});

els.btnManual.addEventListener("click", () => {
  const lat = parseFloat(els.lat.value);
  const lon = parseFloat(els.lon.value);
  if (Number.isNaN(lat) || Number.isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    els.locationStatus.textContent = "Coordenadas inválidas";
    return;
  }
  setLocation(lat, lon);
});

els.radius.addEventListener("change", () => {
  state.radius = Math.max(1, parseFloat(els.radius.value) || 300);
  saveSettings();
});

els.minMag.addEventListener("change", () => {
  state.minMag = parseFloat(els.minMag.value) || 0;
  saveSettings();
});

els.feedWindow.addEventListener("change", () => {
  state.feedWindow = els.feedWindow.value;
  saveSettings();
});

els.pollInterval.addEventListener("change", () => {
  state.pollInterval = parseInt(els.pollInterval.value, 10);
  saveSettings();
  if (pollTimer) restartPolling();
});

els.btnNotify.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    els.notifyStatus.textContent = "Este navegador no soporta notificaciones";
    return;
  }
  const perm = await Notification.requestPermission();
  els.notifyStatus.textContent =
    perm === "granted" ? "Notificaciones activadas" : "Notificaciones bloqueadas por el navegador";
});

els.btnStart.addEventListener("click", () => {
  if (state.lat == null || state.lon == null) {
    els.monitorStatus.textContent = "Configura tu ubicación antes de iniciar el monitoreo";
    return;
  }
  startPolling();
});

els.btnStop.addEventListener("click", stopPolling);
els.btnCheckNow.addEventListener("click", () => checkNow());

function startPolling() {
  els.btnStart.disabled = true;
  els.btnStop.disabled = false;
  els.monitorStatus.textContent = "Monitoreo activo";
  checkNow();
  pollTimer = setInterval(checkNow, state.pollInterval);
}

function stopPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  els.btnStart.disabled = false;
  els.btnStop.disabled = true;
  els.monitorStatus.textContent = "Monitoreo detenido";
}

function restartPolling() {
  stopPolling();
  startPolling();
}

async function checkNow() {
  if (state.lat == null || state.lon == null) {
    els.monitorStatus.textContent = "Configura tu ubicación antes de revisar";
    return;
  }
  els.monitorStatus.textContent = `Revisando... (última revisión: ${new Date().toLocaleTimeString()})`;
  try {
    const url = FEED_URLS[state.feedWindow] || FEED_URLS.day;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    processQuakes(data.features || []);
    els.monitorStatus.textContent = `Monitoreo activo — última revisión ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    els.monitorStatus.textContent = `Error al consultar USGS: ${err.message}. Reintentando en el próximo ciclo.`;
  }
}

function processQuakes(features) {
  const nearby = features
    .map((f) => {
      const [lon, lat, depth] = f.geometry.coordinates;
      const distanceKm = haversineKm(state.lat, state.lon, lat, lon);
      return {
        id: f.id,
        mag: f.properties.mag,
        place: f.properties.place || "Ubicación desconocida",
        time: f.properties.time,
        url: f.properties.url,
        depth,
        distanceKm,
      };
    })
    .filter((q) => q.distanceKm <= state.radius)
    .sort((a, b) => b.time - a.time);

  renderList(nearby);

  const newMatches = nearby.filter(
    (q) => q.mag != null && q.mag >= state.minMag && !seenIds[q.id]
  );

  if (newMatches.length > 0) {
    newMatches.forEach((q) => (seenIds[q.id] = Date.now()));
    saveSeen();
    triggerAlert(newMatches);
  }

  // mark everything currently in range as seen so we don't re-alert on the
  // same event across polls, even if it's below the alert threshold
  nearby.forEach((q) => {
    if (!seenIds[q.id]) seenIds[q.id] = Date.now();
  });
  saveSeen();
}

function triggerAlert(matches) {
  playAlertSound();

  const top = matches[0];
  const msg =
    matches.length === 1
      ? `⚠️ Sismo M${top.mag.toFixed(1)} a ${Math.round(top.distanceKm)} km — ${top.place}`
      : `⚠️ ${matches.length} sismos detectados en tu zona. El más fuerte: M${top.mag.toFixed(1)} — ${top.place}`;

  els.alertCard.hidden = false;
  els.alertBanner.textContent = msg;

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Alerta de terremoto", { body: msg, tag: top.id });
  }
}

function renderList(quakes) {
  els.quakeList.innerHTML = "";
  if (quakes.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No hay sismos registrados en tu zona dentro del rango seleccionado.";
    els.quakeList.appendChild(li);
    return;
  }

  for (const q of quakes) {
    const li = document.createElement("li");
    li.className = "quake-item" + (q.mag >= state.minMag ? " matched" : "");

    const magSpan = document.createElement("span");
    magSpan.className = "quake-mag" + (q.mag >= 5 ? " high" : q.mag >= 3.5 ? " mid" : "");
    magSpan.textContent = q.mag != null ? q.mag.toFixed(1) : "?";

    const info = document.createElement("div");
    info.className = "quake-info";
    const place = document.createElement("div");
    place.className = "quake-place";
    place.textContent = q.place;
    const meta = document.createElement("div");
    meta.className = "quake-meta";
    meta.textContent = `${Math.round(q.distanceKm)} km de tu ubicación · profundidad ${Math.round(q.depth)} km · ${new Date(q.time).toLocaleString()}`;
    info.appendChild(place);
    info.appendChild(meta);

    li.appendChild(magSpan);
    li.appendChild(info);
    els.quakeList.appendChild(li);
  }
}

initUI();
