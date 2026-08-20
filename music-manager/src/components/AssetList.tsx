import { removeAsset } from "@/lib/actions/assets";
import { IconSubmit } from "@/components/SubmitButton";
import { formatBytes } from "@/lib/assets";
import { Trash2 } from "lucide-react";

export default function AssetList({
  assets,
}: {
  assets: { id: string; name: string; size: number }[];
}) {
  if (assets.length === 0) {
    return <p className="text-xs text-neutral-600 mt-3">Nada subido todavía.</p>;
  }
  return (
    <ul className="mt-3 space-y-1.5">
      {assets.map((a) => (
        <li key={a.id} className="flex items-center gap-2 text-xs tile px-2.5 py-1.5">
          <span className="flex-1 truncate">{a.name}</span>
          <span className="text-neutral-600 tabular-nums shrink-0">
            {formatBytes(a.size)}
          </span>
          <form action={removeAsset.bind(null, a.id)}>
            <IconSubmit
              label={`Eliminar ${a.name}`}
              confirm={`¿Eliminar «${a.name}»? Se borra también del almacenamiento.`}
              className="text-neutral-500 hover:text-red-400"
            >
              <Trash2 size={13} />
            </IconSubmit>
          </form>
        </li>
      ))}
    </ul>
  );
}
