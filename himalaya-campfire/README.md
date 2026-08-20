# himalaya-campfire

App de escritorio (Electron) con una fogata ilustrada en lo alto del
Himalaya, animada en un estilo "grunge"/dibujado a mano (trazo negro
grueso, colores planos, texturas de boceto) — inspirado libremente en la
estética del plugin **Endless Smile** de Dada Life (mando circular con
etiqueta pegada tipo rótulo, sensación de dibujo animado que reacciona al
girar el knob), sin reutilizar ninguno de sus assets, personaje ni logo.

Se abre con doble clic como una app nativa (Mac/Windows/Linux), a pantalla
completa u en ventana, con un mando de **INTENSIDAD** que controla en vivo
la altura de las llamas, las chispas que saltan y el viento.

## Cómo funciona

Todo se dibuja por código en un `<canvas>`, redibujado cada frame con
[rough.js](https://roughjs.com/) para que el trazo tenga ese aspecto de
boceto ligeramente inestable (como si se redibujara a mano en cada
fotograma), sin depender de vídeos ni imágenes externas:

- `renderer/scene.js` — cielo nocturno, estrellas parpadeantes, luna y tres
  capas de cordillera del Himalaya con nieve, dibujado una vez a un canvas
  offscreen y reutilizado (no hace falta redibujar el fondo entero cada frame).
- `renderer/fire.js` — troncos, piedras, llamas (varias capas de color de
  fuera a dentro), brasas que saltan con física simple y humo, todo
  reactivo a la intensidad.
- `renderer/knob.js` — el mando de intensidad, arrastrable con el ratón
  (o con las flechas del teclado, es accesible).
- `renderer/noise.js` — ruido de valor 2D propio (sin dependencias) para
  el bamboleo orgánico de llamas/humo/viento.
- `renderer/app.js` — bucle de animación, ráfagas de viento aleatorias y
  redimensionado de la ventana.

## Instalación y ejecución

Requiere [Node.js](https://nodejs.org/) 18+.

```bash
cd himalaya-campfire
npm install
npm start
```

## Generar la app de doble clic

```bash
npm run dist
```

Esto usa [electron-builder](https://www.electron.build/) para generar el
instalable nativo en `dist/`:

- **macOS** → `.dmg` / `.zip` (con `Fogata del Himalaya.app` dentro, doble
  clic para abrir). **Tienes que ejecutar `npm run dist` en un Mac** —
  Apple no permite firmar/empaquetar apps `.app` desde Linux.
- **Windows** → instalador `.exe` (NSIS) y una versión portable `.exe`.
  Se puede generar tanto en Windows como, con Wine instalado, desde Linux.
- **Linux** → `.AppImage` (doble clic, no requiere instalación) y `.deb`.

Si solo quieres probarlo rápido sin generar el instalador, `npm start` ya
abre la ventana igual que la app final.

## Verificación visual sin pantalla (para desarrollo/CI)

Si estás en un entorno sin pantalla física (por ejemplo un contenedor
Linux), `tools/verify-visual.js` abre la app oculta con Electron, la deja
animar unos segundos y guarda una captura PNG — así es como se comprobó
visualmente esta app durante el desarrollo:

```bash
sudo apt-get install xvfb   # si no lo tienes
xvfb-run -a ./node_modules/.bin/electron --no-sandbox tools/verify-visual.js
xvfb-run -a ./node_modules/.bin/electron --no-sandbox tools/verify-visual.js --intensity=high
```

Genera `verify-default.png` / `verify-high.png` en la raíz del proyecto.

## Controles

| Acción | Cómo |
|---|---|
| Subir/bajar intensidad del fuego | Arrastra el mando "INTENSIDAD" hacia arriba/abajo, o enfócalo y usa las flechas ↑/↓ |
| Pantalla completa | Botón ⛶ (abajo a la izquierda) o tecla `F` |

## Notas de diseño

- No hay simulación de fluidos real: las llamas son formas geométricas
  (tongues) perturbadas con ruido, en capas de color — es una ilustración
  animada, no un intento de fotorrealismo.
- El viento es semi-aleatorio (cambia de objetivo cada pocos segundos) y
  se combina con la intensidad del knob para el bamboleo de llamas/humo/brasas.
- Todo el arte es original, generado por código; no se ha copiado ningún
  asset, personaje ni logo de terceros.
