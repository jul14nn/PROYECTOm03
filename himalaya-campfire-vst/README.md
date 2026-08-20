# Himalaya Campfire — plugin VST3 para FL Studio

La misma fogata ilustrada del Himalaya de `himalaya-campfire/` (la app de
escritorio), pero como **plugin VST3** que puedes cargar en FL Studio (o en
cualquier DAW que soporte VST3 en Windows/macOS).

- **Puramente visual**: el audio pasa sin modificarse (passthrough).
- Un único parámetro, **Intensity**, controla en vivo la altura de las
  llamas, las chispas y el viento. Al ser un parámetro real del plugin, se
  puede **automatizar desde FL Studio** (clip de automatización, tweaking,
  link a un controlador MIDI…) igual que el knob de Endless Smile.
- La interfaz es la misma escena web (canvas + rough.js) incrustada con el
  WebView nativo de JUCE (WebView2 en Windows, WebKit en macOS), con
  sincronización bidireccional knob ↔ DAW.

## Cómo conseguir el .vst3 (GitHub Actions)

No hace falta instalar Visual Studio ni Xcode: el workflow
`.github/workflows/build-vst.yml` compila automáticamente en cada push que
toque esta carpeta y sube el plugin como artefacto:

1. Ve a la pestaña **Actions** del repo → workflow "Build Himalaya Campfire VST3".
2. Abre la ejecución más reciente (o lánzala a mano con "Run workflow").
3. Descarga el artefacto **HimalayaCampfire-Windows-VST3** (o el de macOS).
4. Descomprime y copia `Himalaya Campfire.vst3` a la carpeta de plugins:
   - **Windows**: `C:\Program Files\Common Files\VST3\`
   - **macOS**: `~/Library/Audio/Plug-Ins/VST3/`
5. En FL Studio: Options → Manage plugins → Find installed plugins.
   Aparecerá como "Himalaya Campfire" (categoría efecto). Insértalo en
   cualquier canal del mixer.

> Nota macOS: el binario de CI no va firmado/notarizado; si macOS lo
> bloquea, quítale la cuarentena con
> `xattr -dr com.apple.quarantine ~/Library/Audio/Plug-Ins/VST3/Himalaya\ Campfire.vst3`.

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
- `WebUI/` — la escena (idéntica a la de la app Electron: `scene.js`,
  `fire.js`, `noise.js`) más `knob.js`/`app.js` adaptados para hablar con
  JUCE mediante `vendor/juce-webview-interop.js` (la librería JS oficial de
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
- El arte (escena, fuego) es original, generado por código.
