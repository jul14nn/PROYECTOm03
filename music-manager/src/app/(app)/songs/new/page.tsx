import SongForm from "@/components/SongForm";
import { createSong } from "@/lib/actions/songs";

export default function NewSongPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold mb-6">Nueva canción</h1>
      <div className="card p-6">
        <SongForm action={createSong} submitLabel="Crear canción" />
      </div>
    </div>
  );
}
