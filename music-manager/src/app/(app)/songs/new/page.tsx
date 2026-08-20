import SongForm from "@/components/SongForm";
import { createSong } from "@/lib/actions/songs";

export default function NewSongPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="display-title text-5xl sm:text-6xl mb-8">Nueva canción</h1>
      <div className="card p-6">
        <SongForm action={createSong} submitLabel="Crear canción" />
      </div>
    </div>
  );
}
