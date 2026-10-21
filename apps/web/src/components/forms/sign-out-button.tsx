"use client";

export function SignOutButton() {
  return (
    <button
      className="text-sm text-echo-muted hover:text-white"
      onClick={async () => {
        await fetch("/api/v1/auth/logout", { method: "POST" });
        window.location.assign("/");
      }}
    >
      Sign out
    </button>
  );
}
