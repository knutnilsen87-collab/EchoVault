import { SubNav } from "@/components/ui/sub-nav";
import { currentUser } from "@/lib/session";

const ITEMS = [
  { href: "/admin", label: "Review queue", roles: ["reviewer"], exact: true },
  { href: "/admin/disputes", label: "Disputes", roles: ["reviewer", "support"] },
  { href: "/admin/licenses", label: "Licenses", roles: ["support", "finance"] },
  { href: "/admin/audit", label: "Audit log", roles: ["support"] },
  { href: "/admin/terms", label: "License terms", roles: [] },
  { href: "/admin/users", label: "Users", roles: [] }
];

/** Pages enforce access themselves; the menu only shows what the current role can open. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const items = ITEMS.filter((i) => user && (user.role === "admin" || i.roles.includes(user.role)));
  return (
    <>
      {items.length ? <SubNav label="Admin" items={items} /> : null}
      {children}
    </>
  );
}
