import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      <AuthForm mode="login" next={next ?? "/"} initialError={error} />
      <p className="mt-6 text-sm text-echo-muted">
        New here?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-white underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
