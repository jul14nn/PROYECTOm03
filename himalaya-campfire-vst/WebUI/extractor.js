// Panel del extractor: habla con el plugin (funciones nativas y eventos) y
// mantiene el estado de la interfaz. La escena del querubín sigue a lo suyo;
// aquí solo se le pide que refuerce el susurro cuando hay una extracción en
// marcha, para que el dibujo acompañe a lo que está pasando.
const Extractor = (() => {
  let native = null;
  let busy = false;
  let lastResult = null;
  let onBusyChange = () => {};

  const el = (id) => document.getElementById(id);

  function setStatusText(text, kind = "") {
    const node = el("status-text");
    node.textContent = text;
    node.className = "status-text " + kind;
  }

  function setBusy(value) {
    busy = value;
    el("capture-btn").disabled = value;
    el("panel").classList.toggle("busy", value);
    onBusyChange(value);
  }

  function formatTime(seconds) {
    if (seconds == null || seconds < 0) return "—";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function renderStatus(status) {
    el("python-path").value = status.python || "";
    el("extractor-path").value = status.extractor || "";
    el("output-path").value = status.output || "";

    el("buffer-info").textContent =
      `${status.capturedSeconds ? status.capturedSeconds.toFixed(1) : "0.0"} s en memoria` +
      (status.playhead >= 0 ? ` · canción en ${formatTime(status.playhead)}` : "");

    if (!status.ready) {
      setStatusText(status.problem || "Falta configurar el extractor.", "warn");
      el("panel").classList.add("needs-setup");
    } else {
      el("panel").classList.remove("needs-setup");
      if (!busy && !lastResult) setStatusText("Listo para capturar.", "");
    }
  }

  async function refreshStatus() {
    if (!native) return;
    try {
      renderStatus(await native.getStatus());
    } catch (err) {
      setStatusText("No se pudo leer el estado del plugin.", "error");
    }
  }

  function renderResult(result) {
    lastResult = result;
    const box = el("result");
    box.hidden = false;

    el("result-files").innerHTML = "";
    [
      ["WAV one-shot", result.wav],
      ["MIDI", result.midi],
    ].forEach(([label, path]) => {
      const row = document.createElement("div");
      row.className = "file-row";

      const name = document.createElement("span");
      name.className = "file-name";
      name.textContent = `${label}: ${path.split(/[\\/]/).pop()}`;

      const button = document.createElement("button");
      button.className = "reveal-btn";
      button.textContent = "Abrir carpeta";
      button.addEventListener("click", () => native && native.reveal(path));

      row.append(name, button);
      el("result-files").append(row);
    });

    const notes = result.notes || [];
    el("result-notes").innerHTML = notes.length
      ? notes
          .map(
            (n) =>
              `<span class="note-chip" title="MIDI ${n.midi} · vel ${n.velocity}">${n.name}</span>`
          )
          .join("")
      : '<span class="note-empty">Sin notas con tono claro.</span>';

    const duration = result.duration != null ? `${result.duration.toFixed(2)} s` : "";
    setStatusText(
      `Listo: ${notes.length} nota${notes.length === 1 ? "" : "s"} · one-shot de ${duration}`,
      "ok"
    );

    el("result-warning").textContent = result.warning || "";
    el("result-warning").hidden = !result.warning;
  }

  async function capture() {
    if (!native || busy) return;

    lastResult = null;
    el("result").hidden = true;
    setBusy(true);
    setStatusText("Capturando...", "");

    const instrument = el("instrument").value;
    const separate = el("separate").checked;
    const secondsAgo = parseFloat(el("seconds-ago").value) || 0.5;

    try {
      const response = await native.extract(instrument, separate, secondsAgo);
      if (!response || !response.started) {
        setBusy(false);
        setStatusText(response?.message || "No se pudo iniciar la extracción.", "error");
      }
    } catch (err) {
      setBusy(false);
      setStatusText("Error al llamar al plugin: " + err, "error");
    }
  }

  function bindEvents(backend) {
    backend.addEventListener("extractProgress", (payload) => {
      setStatusText(payload.message || "Procesando...", "");
    });

    backend.addEventListener("extractResult", (payload) => {
      setBusy(false);
      renderResult(payload);
      refreshStatus();
    });

    backend.addEventListener("extractError", (payload) => {
      setBusy(false);
      setStatusText(payload.message || "La extracción falló.", "error");
    });
  }

  function bindSettings() {
    [
      ["python-path", "python"],
      ["extractor-path", "extractor"],
      ["output-path", "output"],
    ].forEach(([id, key]) => {
      el(id).addEventListener("change", async (event) => {
        if (!native) return;
        renderStatus(await native.setSetting(key, event.target.value.trim()));
      });
    });

    el("settings-toggle").addEventListener("click", () => {
      el("settings").hidden = !el("settings").hidden;
    });

    // El toggle de separación avisa de su coste: separar tarda minutos y solo
    // hace falta si el canal trae la mezcla, no el instrumento solo.
    el("separate").addEventListener("change", (event) => {
      el("separate-note").textContent = event.target.checked
        ? "Separará el instrumento con Demucs: tarda minutos."
        : "El canal ya trae el instrumento aislado: extracción en segundos.";
    });
  }

  function attach(nativeApi, backend, options = {}) {
    native = nativeApi;
    onBusyChange = options.onBusyChange || (() => {});

    bindSettings();
    bindEvents(backend);
    el("capture-btn").addEventListener("click", capture);

    refreshStatus();
    setInterval(refreshStatus, 1000);
  }

  return {
    attach,
    get isBusy() {
      return busy;
    },
  };
})();
