import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-echo-muted">404</p>
      <h1 className="mt-3 text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-echo-muted">This page doesn’t exist, or the track isn’t available for licensing.</p>
      <Link href="/" className="mt-6 inline-block underline">
        Back to the catalog
      </Link>
    </main>
  );
}
