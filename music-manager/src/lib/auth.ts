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
          // Sin SMTP configurado (típicamente en desarrollo local): el enlace
          // mágico se imprime en la consola del servidor en vez de enviarse.
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
