import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Subida directa del navegador al almacenamiento.
 *
 * Las subidas que pasan por una acción de servidor chocan con el límite de
 * cuerpo de petición de las funciones serverless (4,5 MB), que un clip de
 * vídeo supera de sobra. Aquí el servidor solo firma un permiso de subida y
 * el archivo viaja directo, sin pasar por la función.
 */
const MAX_BYTES = 200 * 1024 * 1024; // 200 MB

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // El permiso se firma aquí: sin sesión válida y sin ser dueño de la
        // canción no se emite, así que nadie puede subir a la cuenta de otro.
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) throw new Error("No autenticado");

        const songId = pathname.split("/")[1];
        if (!songId) throw new Error("Ruta de subida no válida");

        const song = await prisma.song.findFirst({
          where: { id: songId, userId },
          select: { id: true },
        });
        if (!song) throw new Error("Canción no encontrada");

        return {
          allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime"],
          maximumSizeInBytes: MAX_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId, songId }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Se ejecuta cuando el archivo ya está subido: aquí se deja la
        // referencia en la base de datos.
        if (!tokenPayload) return;
        const { songId } = JSON.parse(tokenPayload) as { songId: string };
        await prisma.songReference.create({
          data: { songId, url: blob.url, caption: "Clip con subtítulos" },
        });
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir" },
      { status: 400 }
    );
  }
}
