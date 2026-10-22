import { RoleSelect } from "@/components/forms/admin-forms";
import { inputClass } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { listUsers } from "@/server/services/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

const ROLES = ["buyer", "artist", "reviewer", "support", "finance", "admin"];

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const me = await pageUser(["admin"], "/admin/users");
  const sp = await searchParams;
  const users = await listUsers({ q: sp.q?.slice(0, 100) || undefined, role: ROLES.includes(sp.role ?? "") ? sp.role : undefined });
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-echo-muted">Changing a role signs that user out everywhere so the new permissions apply immediately.</p>
      </div>
      <form className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Email or name" aria-label="Search users" className={`${inputClass} w-64 py-1.5 text-sm`} />
        <select name="role" defaultValue={sp.role ?? ""} aria-label="Role" className={`${inputClass} w-auto py-1.5 text-sm`}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <button className="rounded-md border border-echo-border px-4 text-sm hover:border-white/40">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-xl border border-echo-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-echo-border font-mono text-[11px] uppercase tracking-wider text-echo-muted">
            <tr>
              <th className="px-4 py-3 font-normal">User</th>
              <th className="px-4 py-3 font-normal">Joined</th>
              <th className="px-4 py-3 text-right font-normal">Tracks</th>
              <th className="px-4 py-3 text-right font-normal">Licenses</th>
              <th className="px-4 py-3 font-normal">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-echo-border last:border-0">
                <td className="px-4 py-2">
                  <div>{u.artist_name ?? u.display_name ?? "—"}</div>
                  <div className="font-mono text-xs text-echo-muted">{u.email}{u.google ? " · Google" : ""}</div>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-echo-muted">{dateTime(u.created_at).slice(0, 10)}</td>
                <td className="px-4 py-2 text-right font-mono">{u.tracks}</td>
                <td className="px-4 py-2 text-right font-mono">{u.licenses}</td>
                <td className="px-4 py-2"><RoleSelect userId={u.id} role={u.role} self={u.id === me.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
