import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-echo-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-echo-muted md:flex-row md:justify-between">
        <div className="max-w-md space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-white">EchoVault</p>
          <p className="leading-6">
            Curated AI/hybrid music licensing with documented provenance. Certificates document the license grant and purchase record; they are not a
            guarantee that third parties will never assert claims.
          </p>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2">
          <Link href="/" className="hover:text-white">Catalog</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
          <Link href="/support" className="hover:text-white">Support &amp; FAQ</Link>
          <Link href="/register" className="hover:text-white">Sell your music</Link>
          <Link href="/legal/terms" className="hover:text-white">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-white">Privacy</Link>
        </nav>
      </div>
    </footer>
  );
}
