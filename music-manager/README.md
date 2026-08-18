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

## Stack técnico

- [Next.js 16](https://nextjs.org) (App Router, Server Actions) + React 19 + TypeScript
- [Prisma 7](https://www.prisma.io) sobre SQLite (adaptador `better-sqlite3`)
- Tailwind CSS 4
- [Nodemailer](https://nodemailer.com) para el envío de invitaciones por email

No requiere infraestructura externa: la base de datos es un archivo SQLite local.

## Puesta en marcha

```bash
npm install            # instala dependencias y genera el cliente de Prisma
cp .env.example .env   # copia la plantilla de variables de entorno
npm run db:migrate     # crea la base de datos (prisma/dev.db) y aplica el esquema
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
