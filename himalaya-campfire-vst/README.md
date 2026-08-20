# Angel Whisper — plugin VST3 para FL Studio

Extractor de one-shots con forma de plugin para FL Studio (o cualquier DAW
con VST3 en Windows/macOS). Oyes una nota que te gusta mientras suena la
canción, pulsas EXTRAER, y te deja el **MIDI exacto** de esa nota y un
**WAV one-shot** recortado del audio real, listo para arrastrar al DAW.

La cara del plugin es una gran oreja roja con textura de semitono sobre
negro y un querubín que le susurra al oído — arte original dibujado por
código.

## Por qué como plugin y no como herramienta suelta

Porque **el plugin ya tiene el audio**. No hay que buscar el archivo ni
decirle el minuto: el plugin va guardando los últimos 30 segundos que lo
atraviesan, así que cuando oyes la nota, el fragmento ya está grabado.

Y hay un atajo que solo existe aquí: si insertas el plugin **en la pista
del propio instrumento**, el audio ya llega aislado, así que se salta la
separación de fuentes. Eso convierte una espera de minutos (Demucs) en una
de segundos, y encima con mejor calidad, porque no hay separación que
introduzca artefactos. Solo hace falta separar si lo pones en el máster.

- **El audio pasa sin modificarse** (passthrough). El plugin lo mide y lo
  guarda, pero no lo toca.
- **Reacciona a la música**: el procesador mide el nivel RMS de lo que
  pasa por el canal y se lo envía a la interfaz 30 veces por segundo, así
  que el aleteo y el susurro siguen al sonido en vez de animarse solos.
- El parámetro **Intensity** decide *cuánto* reacciona (el audio decide
  *cuándo*). Al ser un parámetro real del plugin se puede **automatizar
  desde FL Studio** (clip de automatización, link a un controlador MIDI…),
  al estilo del knob de Endless Smile. Sin señal queda una animación de
  reposo, para que el plugin nunca parezca congelado.
- La interfaz es una escena web (canvas 2D, sin dependencias) incrustada
  con el WebView nativo de JUCE (WebView2 en Windows, WebKit en macOS),
  con sincronización bidireccional knob ↔ DAW.

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

## Cómo se usa

1. Inserta el plugin en el canal del mixer donde suena lo que quieres pillar
   (mejor en la pista del instrumento que en el máster, ver arriba).
2. La primera vez, abre Ajustes (⚙) e indica dónde está tu Python y la
   carpeta `midi-audio-extractor` de este repositorio. Se guardan a nivel de
   máquina, así que solo se hace una vez.
3. Reproduce la canción. Cuando oigas la nota, pulsa **EXTRAER**.
4. En "Capturar lo de hace" ajusta cuántos segundos atrás estaba la nota
   respecto al momento en que pulsaste (por defecto medio segundo).
5. Te deja el `.wav` y el `.mid` en la carpeta de salida, con el minuto de
   la canción en el nombre, y te enseña las notas detectadas.

### Qué hace falta instalar

El trabajo pesado (separar instrumentos y transcribir) son modelos de
aprendizaje automático que pesan cientos de megas y viven en Python, así
que corren en un proceso aparte en vez de dentro del `.vst3`. Hay que
instalarlos una vez, siguiendo el README de `midi-audio-extractor/`.

Es también lo que evita que el DAW se quede congelado mientras trabaja: si
la extracción tarda minutos, tarda fuera del hilo de audio y fuera del
proceso del DAW.

## Cómo está dibujado

Todo el arte se genera por código, sin imágenes ni vídeo:

- `WebUI/scene.js` — la oreja. Se pinta suave (silueta, hélix, antihélix,
  cuenca, canal, trago, lóbulo) en un lienzo auxiliar y después se
  **retrama**: se lee la luminancia de cada celda y se redibuja como un
  punto de ese tamaño, que es lo que da el aspecto de serigrafía. El canal
  se repinta en negro sólido por encima para que se lea como hueco y no
  como sombra. Se calcula una sola vez por tamaño de ventana.
- `WebUI/cherub.js` — el querubín. Cada capa del cuerpo (pierna trasera,
  tronco, pierna delantera, cabeza, brazo) se dibuja como **silueta
  fusionada**: primero todas sus piezas rellenas y perfiladas en oscuro,
  después rellenas en claro sin perfil. Al ir por capas de atrás hacia
  delante, el contorno de cada una recorta la anterior y los miembros se
  distinguen. Un temblor por ruido ("boiling") imita el redibujado a mano.
- `WebUI/app.js` — bucle de animación, mezcla de knob + nivel de audio, y
  una textura de grano que se superpone desplazada en cada fotograma para
  que oreja y querubín compartan el mismo ruido de impresión.

## Cómo se comunican el plugin y el extractor

El plugin escribe el fragmento capturado a un WAV temporal y lanza
`extractor.plugin_service`, que le responde por stdout con una línea JSON
por evento (`progress`, `result`, `error`). El plugin las va traduciendo a
la interfaz según llegan, así que se ve el avance en vez de un cuelgue.

Ese canal está reservado: el servicio redirige a stderr todo lo que
impriman las librerías (basic-pitch y TensorFlow escriben en stdout por su
cuenta), porque si no, el plugin recibiría líneas que no son JSON.
