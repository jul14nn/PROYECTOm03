// Herramienta de desarrollo: renderiza la app sin ventana visible (headless,
// vía Xvfb en Linux) y guarda capturas PNG, útil para verificar cambios
// visuales en un entorno sin pantalla física, o para regresión visual manual.
//
// Uso:
//   xvfb-run -a electron --no-sandbox tools/verify-visual.js
//   xvfb-run -a electron --no-sandbox tools/verify-visual.js --intensity=high
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

app.commandLine.appendSwitch("no-sandbox");

const wantsHigh = process.argv.includes("--intensity=high");

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "..", "preload.js"),
      contextIsolation: true,
    },
  });
  await win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  await new Promise((r) => setTimeout(r, 500));

  if (wantsHigh) {
    await win.webContents.executeJavaScript(`
      (function() {
        const knob = document.getElementById('knob');
        const rect = knob.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        knob.dispatchEvent(new MouseEvent('mousedown', { clientX: cx, clientY: cy, bubbles: true }));
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: cx, clientY: cy - 400, bubbles: true }));
        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      })();
    `);
  }

  await new Promise((r) => setTimeout(r, 3000));
  const image = await win.webContents.capturePage();
  const outName = wantsHigh ? "verify-high.png" : "verify-default.png";
  fs.writeFileSync(path.join(__dirname, "..", outName), image.toPNG());
  console.log("Guardado:", outName);
  app.quit();
});
