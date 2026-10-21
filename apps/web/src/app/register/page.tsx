import Link from "next/link";
import { AuthForm } from "@/components/forms/auth-form";

export const metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
      <AuthForm mode="register" next={next ?? "/"} />
      <p className="mt-6 text-sm text-echo-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-white underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
