# Angel Whisper — plugin VST3 para FL Studio

Plugin visual para FL Studio (o cualquier DAW con VST3 en Windows/macOS):
una gran oreja roja con textura de semitono/grano sobre fondo negro y un
querubín de alas azules que le susurra al oído — todo arte original
dibujado por código, en el mismo estilo grunge/boceteado del resto del
proyecto.

- **Puramente visual**: el audio pasa sin modificarse (passthrough).
- Un único parámetro, **Intensity**, controla el susurro: el ritmo del
  aleteo del ala, las partículas y ondas que entran al canal auditivo y el
  resplandor pulsante. Al ser un parámetro real del plugin se puede
  **automatizar desde FL Studio** (clip de automatización, link a un
  controlador MIDI…), al estilo del knob de Endless Smile.
- La interfaz es una escena web (canvas + rough.js) incrustada con el
  WebView nativo de JUCE (WebView2 en Windows, WebKit en macOS), con
  sincronización bidireccional knob ↔ DAW.

> Nota: la carpeta y el target de CMake conservan el nombre histórico
> `himalaya-campfire-vst`/`HimalayaCampfire` (el proyecto nació como una
> fogata); el plugin que ve el DAW se llama **Angel Whisper**.

## Cómo conseguir el .vst3 (GitHub Actions)

No hace falta instalar Visual Studio ni Xcode: el workflow
`.github/workflows/build-vst.yml` compila automáticamente en cada push que
toque esta carpeta y sube el plugin como artefacto:

1. Ve a la pestaña **Actions** del repo → workflow "Build Angel Whisper VST3".
2. Abre la ejecución más reciente (o lánzala a mano con "Run workflow").
3. Descarga el artefacto **AngelWhisper-Windows-VST3** (o el de macOS).
4. Descomprime y copia `Angel Whisper.vst3` a la carpeta de plugins:
   - **Windows**: `C:\Program Files\Common Files\VST3\`
   - **macOS**: `~/Library/Audio/Plug-Ins/VST3/`
5. En FL Studio: Options → Manage plugins → Find installed plugins.
   Aparecerá como "Angel Whisper" (categoría efecto). Insértalo en
   cualquier canal del mixer.

> Nota macOS: el binario de CI no va firmado/notarizado; si macOS lo
> bloquea, quítale la cuarentena con
> `xattr -dr com.apple.quarantine ~/Library/Audio/Plug-Ins/VST3/Angel\ Whisper.vst3`.

## Compilar en local (opcional)

Requiere CMake 3.22+ y el toolchain nativo (MSVC en Windows, Xcode en
macOS). JUCE 9.0.1 se descarga solo vía FetchContent.

```bash
cmake -B build -S himalaya-campfire-vst          # añade -G Xcode en macOS
cmake --build build --config Release --target HimalayaCampfire_VST3
```

En Windows necesitas además el paquete NuGet de WebView2:

```powershell
nuget install Microsoft.Web.WebView2 -OutputDirectory nuget-packages
cmake -B build -S himalaya-campfire-vst -DJUCE_WEBVIEW2_PACKAGE_LOCATION="$PWD\nuget-packages"
```

También se genera un target **Standalone** (`HimalayaCampfire_Standalone`)
que abre el plugin como app suelta, útil para probar sin DAW.

## Estructura

- `Source/PluginProcessor.*` — el AudioProcessor: passthrough de audio +
  parámetro `intensity` (AudioProcessorValueTreeState, con estado
  guardado/restaurado con el proyecto del DAW).
- `Source/PluginEditor.*` — el editor: un WebBrowserComponent de JUCE que
  sirve la carpeta `WebUI/` desde recursos embebidos en el binario
  (BinaryData) y conecta el parámetro con la página vía WebSliderRelay /
  WebSliderParameterAttachment.
- `WebUI/scene.js` — la oreja: silueta bezier, crestas sombreadas, canal,
  trama de semitono y grano, horneado una vez a un canvas offscreen.
- `WebUI/cherub.js` — el querubín: cuerpo por elipses rotadas con rough.js
  (redibujado cada frame para que el trazo respire), ala azul que aletea, y
  el susurro (partículas + ondas + resplandor) gobernado por la intensidad.
- `WebUI/knob.js` / `WebUI/app.js` — el mando y el pegamento con JUCE
  mediante `vendor/juce-webview-interop.js` (la librería JS oficial de
  JUCE, con fallback standalone: la página también funciona abierta en un
  navegador normal para desarrollo).

La UI se verificó en Chromium headless (capturas con Playwright) usando el
stub standalone del interop; la compilación C++/VST3 la valida el workflow
de CI, ya que este entorno Linux no tiene las dependencias de WebKit
necesarias para compilar JUCE con WebView.

## Licencias

- JUCE 9 (framework y `juce-webview-interop.js`): licencia JUCE (gratuita
  para uso personal/educativo con splash screen) o AGPLv3 — ver
  `WebUI/vendor/juce-webview-interop.LICENSE.md`.
- rough.js: MIT — ver `WebUI/vendor/rough.LICENSE.txt`.
- El arte (oreja, querubín) es original, generado por código; el concepto
  visual está inspirado en la estética collage de referencia del usuario,
  sin reutilizar la imagen.
