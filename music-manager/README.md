# Music Manager

Aplicación para automatizar la gestión de producción musical: desde la idea de una
canción hasta su lanzamiento, distribución, marketing y reparto de royalties.

## Módulos

- **Canciones**: título, tipo/género, color identificativo, etapa (idea → pre-producción →
  escritura → grabación → mezcla → máster → portada → distribución → lanzada), BPM,
  tonalidad, fecha de lanzamiento y si falta sacar la portada.
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
npm run db:seed        # (opcional) carga datos de ejemplo
npm run dev            # arranca la app en http://localhost:3000
```

### Configurar el envío de correos (agenda)

Para poder enviar invitaciones desde la Agenda, completa en `.env` los datos SMTP de tu
proveedor (Gmail, SendGrid, Mailgun, tu propio servidor, etc.):

```env
SMTP_HOST="smtp.tuproveedor.com"
SMTP_PORT="587"
SMTP_USER="tu_usuario"
SMTP_PASS="tu_contraseña_o_api_key"
SMTP_FROM="Tu Estudio <no-reply@tudominio.com>"
```

Con Gmail necesitas generar una "contraseña de aplicación" (no la contraseña normal de la
cuenta). Si no configuras estas variables, la app sigue funcionando con normalidad; solo
el botón de enviar invitaciones mostrará un aviso indicando que falta la configuración SMTP.

## Desplegar en Vercel

1. **Importa el repositorio.** En [vercel.com/new](https://vercel.com/new), importa
   `jul14nn/PROYECTOm03` y, en "Root Directory", selecciona **`music-manager`**.
2. **Conecta una base de datos Postgres.** Dentro del proyecto ya creado en Vercel, ve a
   la pestaña **Storage → Create Database** y elige un Postgres (Neon o similar, tienen
   capa gratuita). Al conectarlo al proyecto, Vercel añade automáticamente la variable
   `DATABASE_URL` — no hace falta copiarla a mano.
3. **(Opcional) Añade las variables SMTP** en **Settings → Environment Variables** si
   quieres que funcionen las invitaciones por email: `SMTP_HOST`, `SMTP_PORT`,
   `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
4. **Deploy.** El comando de build (`prisma migrate deploy && next build`) aplica el
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
principales: `Song`, `Contact`, `SongFeaturing`, `SongProducer`, `VideoIdea`,
`PreProductionTask`, `DistributionStep`, `MarketingBudgetItem`, `MarketingIdea`,
`Royalty`, `RoyaltyPayment`, `CalendarEvent`, `EventInvite`.
