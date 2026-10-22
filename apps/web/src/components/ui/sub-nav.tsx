"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Section tabs (artist area, admin area). Active tab is marked with aria-current, not colour alone. */
export function SubNav({ items, label }: { items: { href: string; label: string; exact?: boolean }[]; label: string }) {
  const path = usePathname();
  return (
    <nav aria-label={label} className="border-b border-echo-border">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {items.map((i) => {
          const active = i.exact ? path === i.href : path === i.href || path.startsWith(`${i.href}/`);
          return (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-sm ${active ? "border-white text-white" : "border-transparent text-echo-muted hover:text-white"}`}
            >
              {i.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
