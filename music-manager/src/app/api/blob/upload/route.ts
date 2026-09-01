import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ASSET_RULES, isAssetKind } from "@/lib/assets";

/**
 * Subida directa del navegador al almacenamiento.
 *
 * El fichero NO pasa por aquí: esta ruta solo firma un permiso de subida y
 * después recibe el aviso de que terminó. Es lo que permite subir un clip de
 * 40 MB, porque el cuerpo de una función de servidor está limitado a 4,5 MB.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // La autorización se comprueba aquí, antes de firmar nada.
        const session = await auth();
        if (!session?.user?.id) throw new Error("No autenticado");

        const payload = JSON.parse(clientPayload ?? "{}") as {
          kind?: string;
          songId?: string | null;
        };
        if (!isAssetKind(payload.kind)) throw new Error("Tipo de archivo no admitido");

        const rule = ASSET_RULES[payload.kind];

        // Si dice pertenecer a una canción, tiene que ser suya.
        if (payload.songId) {
          const song = await prisma.song.findFirst({
            where: { id: payload.songId, userId: session.user.id },
            select: { id: true },
          });
          if (!song) throw new Error("Canción no encontrada");
        }

        return {
          allowedContentTypes: [...rule.mimeTypes],
          maximumSizeInBytes: rule.maxBytes,
          addRandomSuffix: true,
          // Se reenvía a onUploadCompleted para registrar el activo.
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            kind: payload.kind,
            songId: payload.songId ?? null,
            name: pathname.split("/").pop() ?? pathname,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const meta = JSON.parse(tokenPayload ?? "{}") as {
          userId: string;
          kind: "AUDIO" | "VIDEO" | "FONT";
          songId: string | null;
          name: string;
        };
        await prisma.asset.create({
          data: {
            userId: meta.userId,
            songId: meta.songId,
            kind: meta.kind,
            url: blob.url,
            pathname: blob.pathname,
            name: meta.name,
            // El aviso no siempre trae el tamaño; se guarda 0 si falta.
            size: (blob as { size?: number }).size ?? 0,
            mimeType: blob.contentType ?? "application/octet-stream",
          },
        });
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error de subida" },
      { status: 400 }
    );
  }
}
