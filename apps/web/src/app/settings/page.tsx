import Link from "next/link";
import { PasswordForm, ProfileForm } from "@/components/forms/settings-forms";
import { DataRow, Panel } from "@/components/ui/primitives";
import { dateTime } from "@/lib/format";
import { pageUser } from "@/lib/session";
import { getProfile } from "@/server/services/account";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await pageUser(undefined, "/settings");
  const profile = await getProfile(user);
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-10 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <Panel title="Profile">
          <ProfileForm profile={profile} />
        </Panel>
        <Panel title="Password">
          <PasswordForm hasPassword={profile.has_password} />
        </Panel>
      </div>
      <aside className="space-y-4 lg:pt-12">
        <Panel title="Account">
          <dl>
            <DataRow label="Email" value={profile.email} />
            <DataRow label="Role" value={profile.role} />
            <DataRow label="Google" value={profile.google_linked ? "Linked" : "Not linked"} />
            <DataRow label="Member since" value={dateTime(profile.created_at).slice(0, 10)} />
          </dl>
          {profile.role === "artist" && profile.artist_name ? (
            <Link href={`/artists/${profile.id}`} className="mt-4 block text-center font-mono text-xs text-echo-muted hover:text-white">
              View public artist page →
            </Link>
          ) : null}
        </Panel>
        <Panel title="Your data">
          <p className="text-sm leading-6 text-echo-muted">
            To get a copy of your data or close your account, contact support. License records are kept because they prove your rights.{" "}
            <Link href="/legal/privacy" className="underline">Privacy</Link>
          </p>
        </Panel>
      </aside>
    </main>
  );
}
