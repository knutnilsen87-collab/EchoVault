import * as React from "react";

export function Button({ className = "", variant = "secondary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "secondary" | "danger" | "ghost" }) {
  const styles = {
    secondary: "border border-echo-border bg-echo-surface text-white hover:border-white/40",
    danger: "border border-red-500/50 text-red-200 hover:bg-red-500/10",
    ghost: "text-echo-muted hover:text-white"
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-white">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-echo-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "w-full rounded-md border border-echo-border bg-echo-dark px-3 py-2 text-base text-white placeholder:text-neutral-600 focus:border-white/40 focus:outline-none";

export function Panel({ title, children, className = "", aside }: { title?: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={`rounded-xl border border-echo-border bg-echo-surface p-5 ${className}`}>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-echo-muted">{title}</h2>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: React.ReactNode }) {
  const styles = { info: "border-echo-border text-echo-muted", error: "border-red-500/40 text-red-200", success: "border-emerald-500/40 text-emerald-200" }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

export function DataRow({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-echo-border py-2 last:border-0">
      <dt className="text-sm text-echo-muted">{label}</dt>
      <dd className={`text-right text-sm text-white ${mono ? "font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
