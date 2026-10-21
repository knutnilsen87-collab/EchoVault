import Link from "next/link";
import type { SessionUser } from "@/server/auth";
import { SignOutButton } from "../forms/sign-out-button";

export function SiteHeader({ user }: { user: SessionUser | null }) {
  const links: { href: string; label: string }[] = [{ href: "/", label: "Catalog" }];
  if (user) links.push({ href: "/dashboard", label: "My licenses" });
  if (user?.role === "artist" || user?.role === "admin") links.push({ href: "/artist", label: "Artist" });
  if (user?.role === "reviewer" || user?.role === "admin") links.push({ href: "/admin", label: "Review" });
  return (
    <header className="border-b border-echo-border">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4" aria-label="Main">
        <Link href="/" className="font-mono text-sm uppercase tracking-[0.3em] text-white">
          EchoVault
        </Link>
        <div className="flex flex-1 items-center gap-5 text-sm text-echo-muted">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-white">
              {l.label}
            </Link>
          ))}
        </div>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-xs text-echo-muted sm:inline">
              {user.email} · {user.role}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-echo-muted hover:text-white">
              Sign in
            </Link>
            <Link href="/register" className="rounded-md border border-echo-border px-3 py-1.5 hover:border-white/40">
              Create account
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
