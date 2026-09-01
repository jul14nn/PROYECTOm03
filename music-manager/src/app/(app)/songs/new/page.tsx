import NewSongForm from "@/components/NewSongForm";
import { createSong } from "@/lib/actions/songs";

export default function NewSongPage() {
  return (
    <div className="max-w-2xl mx-auto pt-4">
      <NewSongForm action={createSong} />
    </div>
  );
}
