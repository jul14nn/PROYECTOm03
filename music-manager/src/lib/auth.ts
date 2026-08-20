import NextAuth from "next-auth";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email/mailer";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  trustHost: true,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
  providers: [
    Nodemailer({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      },
      from: process.env.SMTP_FROM,
      async sendVerificationRequest({ identifier, url }) {
        if (!isEmailConfigured()) {
          // En local esto es lo normal y cómodo: el enlace sale por consola.
          // En producción es un fallo silencioso — al usuario le decimos
          // "revisa tu correo" y no se envía nada. Por eso, desplegado, se
          // avisa nombrando las variables que faltan: sin esto, el único
          // síntoma es un correo que nunca llega.
          const missing = [
            ["SMTP_HOST", process.env.SMTP_HOST],
            ["SMTP_USER", process.env.SMTP_USER],
            ["SMTP_PASS", process.env.SMTP_PASS],
          ]
            .filter(([, v]) => !v)
            .map(([k]) => k);

          if (process.env.NODE_ENV === "production") {
            console.error(
              `[music-manager] No se ha enviado el enlace de acceso a ${identifier}: ` +
                `faltan estas variables de entorno: ${missing.join(", ")}. ` +
                `Añádelas en el despliegue y vuelve a desplegar.`
            );
            throw new Error("El envío de correo no está configurado en el servidor.");
          }

          console.log(`\n[music-manager] Enlace de acceso para ${identifier}:\n${url}\n`);
          return;
        }
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT ?? 587),
          secure: Number(process.env.SMTP_PORT ?? 587) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transport.sendMail({
          to: identifier,
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          subject: "Tu enlace de acceso a Music Manager",
          text: `Entra en Music Manager: ${url}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.5;">
              <h2>Music Manager</h2>
              <p>Pulsa el siguiente enlace para iniciar sesión:</p>
              <p><a href="${url}">${url}</a></p>
              <p style="color:#888; font-size: 12px;">Si no has solicitado este acceso, ignora este correo.</p>
            </div>
          `,
        });
      },
    }),
  ],
});

export async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  return session.user.id;
}
