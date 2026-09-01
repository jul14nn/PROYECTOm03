import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const owner = await prisma.user.upsert({
    where: { email: "slazhys@gmail.com" },
    update: {},
    create: { email: "slazhys@gmail.com", name: "Julián" },
  });

  const productor = await prisma.contact.create({
    data: { userId: owner.id, name: "Marco Beats", role: "Productor", email: "marco@example.com" },
  });
  const featuring = await prisma.contact.create({
    data: { userId: owner.id, name: "Luna MC", role: "Featuring", email: "luna@example.com" },
  });
  const distro = await prisma.contact.create({
    data: { userId: owner.id, name: "DistroKid Support", role: "Distribuidora", email: "support@distrokid.com" },
  });

  const song = await prisma.song.create({
    data: {
      userId: owner.id,
      title: "Noches de Neón",
      genre: "Reggaetón / Pop urbano",
      color: "#ec4899",
      stage: "MEZCLA",
      needsCover: true,
      bpm: 96,
      key: "Am",
      notes: "Idea inicial surgida en sesión nocturna. Falta verso final.",
      releaseDate: new Date("2026-10-15"),
      featurings: {
        create: [{ artistName: "Luna MC", contactId: featuring.id, role: "Rap", confirmed: true }],
      },
      producers: {
        create: [{ contactId: productor.id, role: "Productor principal" }],
      },
      videoIdeas: {
        create: [
          { title: "Rooftop nocturno con neones", description: "Plano secuencia en azotea con luces de neón rosa/azul" },
          { title: "Lyric video minimalista", description: "Tipografía animada sobre fondo degradado", status: "PENDIENTE" },
        ],
      },
      tasks: {
        create: [
          { title: "Registrar canción en la SGAE", status: "PENDIENTE" },
          { title: "Reservar estudio para grabación de voces", status: "HECHO" },
          { title: "Confirmar disponibilidad de Luna MC", status: "HECHO" },
        ],
      },
      distributionSteps: {
        create: [
          { distributor: "DistroKid", step: "Subir metadata y créditos", status: "PENDIENTE" },
          { distributor: "DistroKid", step: "Programar fecha de lanzamiento", status: "PENDIENTE" },
          { distributor: "Spotify for Artists", step: "Enviar a playlist editorial (pitch)", status: "PENDIENTE" },
        ],
      },
      marketingBudgets: {
        create: [
          { category: "Ads (Meta/TikTok)", plannedAmount: 400, actualAmount: 0 },
          { category: "Playlisting", plannedAmount: 150, actualAmount: 0 },
        ],
      },
      marketingIdeas: {
        create: [
          { title: "Reto de baile en TikTok", channel: "TikTok", description: "Coreografía corta con el hook" },
          { title: "Behind the scenes en Reels", channel: "Instagram" },
        ],
      },
      royalties: {
        create: [
          { contactId: productor.id, name: "Marco Beats", role: "Productor", percentage: 20 },
          { contactId: featuring.id, name: "Luna MC", role: "Featuring", percentage: 15 },
          { name: "Autor principal", role: "Autor", percentage: 65 },
        ],
      },
    },
  });

  await prisma.calendarEvent.create({
    data: {
      userId: owner.id,
      title: "Sesión de mezcla - Noches de Neón",
      location: "Estudio Sonora, Madrid",
      startDate: new Date("2026-08-25T17:00:00"),
      endDate: new Date("2026-08-25T20:00:00"),
      songId: song.id,
      invites: {
        create: [{ contactId: productor.id, email: "marco@example.com" }],
      },
    },
  });

  await prisma.contact.update({ where: { id: distro.id }, data: {} });

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
