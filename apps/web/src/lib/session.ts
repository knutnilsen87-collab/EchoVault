import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserRole } from "@echovault/domain";
import { SESSION_COOKIE, userForToken, type SessionUser } from "@/server/auth";

export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  return userForToken(jar.get(SESSION_COOKIE)?.value ?? null);
}

/** For server-rendered pages: redirect to login instead of throwing. */
export async function pageUser(roles?: readonly UserRole[], next = "/"): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (roles && !roles.includes(user.role) && user.role !== "admin") redirect("/?forbidden=1");
  return user;
}
