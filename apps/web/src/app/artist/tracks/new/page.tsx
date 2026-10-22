import { NewTrackForm } from "@/components/forms/artist-forms";
import { pageUser } from "@/lib/session";

export const metadata = { title: "New track" };

export default async function NewTrackPage() {
  await pageUser(["artist"], "/artist/tracks/new");
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">New track</h1>
      <NewTrackForm />
    </main>
  );
}
