# Music Manager

Aplicación para automatizar la gestión de producción musical: desde la idea de una
canción hasta su lanzamiento, distribución, marketing y reparto de royalties.

## Módulos

- **Canciones**: título, tipo/género, color identificativo, etapa (idea → pre-producción →
  escritura → grabación → mezcla → máster → portada → distribución → lanzada), BPM,
  tonalidad, **fecha aproximada de lanzamiento** (selector propio con calendario y año) y
  si falta sacar la portada.
- **Referencias visuales**: sube imágenes por canción para lluvia de ideas — portadas que
  inspiran, paletas, fotogramas de referencia para el vídeo.
- **Avisos de lanzamiento**: email automático al acercarse la fecha aproximada (30, 14, 7,
  3 y 1 días antes), con una recomendación de cuántas sesiones de TikTok grabar esa semana.
- **Consejo del día**: 20 consejos de marketing musical que rotan sin repetirse hasta
  agotar la ronda.
- **Colaboradores**: featuring y productores por canción, vinculados a la agenda de contactos.
- **Ideas de vídeo**: lluvia de ideas para el videoclip/lyric video de cada canción.
- **Pre-producción**: checklist de gestiones previas (registro en sociedad de autores,
  reserva de estudio, confirmaciones, etc.) con responsable y fecha límite.
- **Distribución**: pasos con la distribuidora (metadata, fecha de lanzamiento, pitching
  a playlists...), vista por canción y vista global.
- **Marketing**: presupuesto planificado vs. gastado por categoría, e ideas de marketing
  por canal, vista por canción y vista global.
- **Royalties**: splits por colaborador y canción, con registro de pagos.
- **Agenda**: calendario de eventos (sesiones, reuniones...) con ubicación, canción
  relacionada y **envío de invitaciones por correo electrónico** a los contactos deseados.
- **Contactos**: directorio único de productores, featuring, distribuidoras, etc.,
  reutilizado en toda la app.

**Cuentas de usuario**: acceso con enlace mágico por email (sin contraseñas). Cada
canción, contacto y evento pertenece a quien lo creó — nadie ve ni puede acceder a los
datos de otra cuenta, ni siquiera por URL directa.

Es una **PWA**: se puede instalar en el iPhone (u otro móvil) desde el navegador y se
abre a pantalla completa, con su propio icono, como una app nativa.

## Stack técnico

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + React 19 + TypeScript
- [Prisma 7](https://www.prisma.io) sobre PostgreSQL (adaptador `@prisma/adapter-pg`)
- Tailwind CSS 4
- [Nodemailer](https://nodemailer.com) para el envío de invitaciones por email
- Manifest + iconos para instalación como PWA en iOS/Android

## Puesta en marcha en local

Necesitas un Postgres accesible (local o en la nube). Para levantar uno local rápido con Docker:

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=musicmanager postgres:16-alpine
```

```bash
npm install            # instala dependencias y genera el cliente de Prisma
cp .env.example .env   # copia la plantilla de variables de entorno (ajusta DATABASE_URL si hace falta)
npm run db:migrate     # aplica el esquema a la base de datos
npm run db:seed        # (opcional) carga datos de ejemplo, asociados a tu cuenta
npm run dev            # arranca la app en http://localhost:3000
```

### Iniciar sesión

Abre `http://localhost:3000`, introduce tu email y pulsa "Enviar enlace de acceso". Sin
SMTP configurado (ver abajo), el enlace no se envía por correo: se imprime en la terminal
donde corre `npm run dev` — cópialo y ábrelo en el navegador para entrar.

### Configurar el envío de correos (agenda y enlaces de acceso)

El mismo SMTP se usa para dos cosas: enviar invitaciones desde la Agenda, y enviar los
enlaces mágicos de inicio de sesión. Completa en `.env` los datos de tu proveedor (Gmail,
SendGrid, Mailgun, tu propio servidor, etc.):

```env
SMTP_HOST="smtp.tuproveedor.com"
SMTP_PORT="587"
SMTP_USER="tu_usuario"
SMTP_PASS="tu_contraseña_o_api_key"
SMTP_FROM="Tu Estudio <no-reply@tudominio.com>"
```

Con Gmail necesitas generar una "contraseña de aplicación" (no la contraseña normal de la
cuenta). Si no configuras estas variables, la app sigue funcionando con normalidad; el
enlace de acceso se imprime en consola (ver arriba) y el botón de enviar invitaciones
mostrará un aviso indicando que falta la configuración SMTP.

### Variable `AUTH_SECRET`

Necesaria para firmar las sesiones. Genera la tuya con:

```bash
openssl rand -base64 33
```

y pégala en `.env` como `AUTH_SECRET`.

### Subir imágenes de referencia (Vercel Blob)

Opcional. Sin configurarlo, la app funciona igual — solo se oculta el formulario de
subida en la sección "Referencias visuales" de cada canción.

1. En el dashboard de Vercel: **Storage → Create → Blob**, conéctalo al proyecto.
2. Copia el token que genera y ponlo en `.env` como `BLOB_READ_WRITE_TOKEN` (en local, si
   quieres probar la subida) — en producción, Vercel lo añade solo al conectar el Blob.

### Avisos de lanzamiento por email

Cada canción con fecha aproximada recibe un email cuando quedan 30, 14, 7, 3 o 1 día(s)
para esa fecha, con una recomendación de sesiones de TikTok según lo cerca que esté. Esto
corre como una tarea programada (`vercel.json` → `crons`), una vez al día:

- **En local** puedes disparar la comprobación a mano visitando
  `http://localhost:3000/api/cron/release-reminders`.
- **En Vercel**, añade `CRON_SECRET` en Environment Variables (genera uno con
  `openssl rand -hex 24`) para que solo Vercel Cron pueda llamar al endpoint. El cron se
  activa solo con el `vercel.json` del repo — no hace falta configurarlo a mano en el
  dashboard.
- Requiere SMTP configurado (ver arriba); sin él, el aviso se salta ese día y se reintenta
  al siguiente, sin perderse.

## Desplegar en Vercel

1. **Importa el repositorio.** En [vercel.com/new](https://vercel.com/new), importa
   `jul14nn/PROYECTOm03` y, en "Root Directory", selecciona **`music-manager`**.
2. **Conecta una base de datos Postgres.** Dentro del proyecto ya creado en Vercel, ve a
   la pestaña **Storage → Create Database** y elige un Postgres (Neon o similar, tienen
   capa gratuita). Al conectarlo al proyecto, Vercel añade automáticamente la variable
   `DATABASE_URL` — no hace falta copiarla a mano.
3. **Añade `AUTH_SECRET`** en **Settings → Environment Variables** (genera uno con
   `openssl rand -base64 33`). Sin esto, el inicio de sesión no funciona.
4. **(Opcional) Añade las variables SMTP** en el mismo sitio si quieres que funcionen las
   invitaciones por email, el envío de enlaces de acceso y los avisos de lanzamiento:
   `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`. Sin SMTP configurado,
   para entrar tendrás que copiar el enlace de acceso de los **Runtime Logs** del
   deployment en Vercel.
5. **(Opcional) Conecta Vercel Blob** (Storage → Create → Blob) para poder subir imágenes
   de referencia, y añade `CRON_SECRET` para proteger los avisos de lanzamiento — ver
   detalles arriba.
6. **Deploy.** El comando de build (`prisma migrate deploy && next build`) aplica el
   esquema a la base de datos automáticamente en cada despliegue — no necesitas ejecutar
   migraciones a mano.

Al terminar tendrás una URL pública (`tu-proyecto.vercel.app`) accesible desde cualquier
dispositivo, incluido tu iPhone.

## Instalarla en el iPhone (PWA)

Con la app desplegada y su URL abierta en **Safari** (no en Chrome — en iOS la instalación
solo la ofrece Safari):

1. Toca el icono de **compartir** (el cuadrado con la flecha hacia arriba).
2. Elige **"Añadir a pantalla de inicio"**.
3. Confirma el nombre ("Music Manager") y toca **Añadir**.

Se instala un icono en tu pantalla de inicio que abre la app a pantalla completa, sin la
barra de Safari, igual que una app nativa.

## Otros comandos útiles

```bash
npm run build       # build de producción
npm run start       # sirve el build de producción
npm run db:studio   # explorador visual de la base de datos (Prisma Studio)
npm run lint        # linting
```

## Estructura de datos

El esquema completo vive en [`prisma/schema.prisma`](./prisma/schema.prisma). Modelos
principales: `Song`, `SongReference`, `Contact`, `SongFeaturing`, `SongProducer`,
`VideoIdea`, `PreProductionTask`, `DistributionStep`, `MarketingBudgetItem`,
`MarketingIdea`, `Royalty`, `RoyaltyPayment`, `CalendarEvent`, `EventInvite`.
