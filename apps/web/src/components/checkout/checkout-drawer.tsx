"use client";

import * as React from "react";
import { formatEur, type LicenseTier } from "@echovault/domain";
import { api, describeError } from "@/lib/api-client";
import { LicenseButton } from "../ui/license-button";
import { Alert, Field, inputClass } from "../ui/primitives";

export type TierOption = {
  tier: LicenseTier;
  name: string;
  buyer: string;
  allowed: string;
  limits: string;
  price_cents: number;
  terms_version: string;
  terms_md: string;
};

/**
 * Liquid-glass drawer (design lock). Terms acceptance is an explicit, unticked checkbox (BR-012 clickwrap).
 * Payment happens on Stripe; fulfillment happens only via the verified webhook.
 */
export function CheckoutDrawer({ trackId, trackTitle, tiers, signedIn }: { trackId: string; trackTitle: string; tiers: TierOption[]; signedIn: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [tier, setTier] = React.useState<LicenseTier>(tiers[0]?.tier ?? "creator");
  const [accepted, setAccepted] = React.useState(false);
  const [project, setProject] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const selected = tiers.find((t) => t.tier === tier);

  React.useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const session = await api<{ checkout_url: string }>("/api/v1/checkout/session", {
        method: "POST",
        json: {
          track_id: trackId,
          tier,
          terms_accepted: accepted,
          project_or_client_name: project.trim() || null,
          whitelisted_url: url.trim() || null
        }
      });
      window.location.assign(session.checkout_url);
    } catch (e) {
      setError(describeError(e));
      setBusy(false);
    }
  }

  return (
    <>
      <LicenseButton className="w-full py-3 text-base" onClick={() => (signedIn ? setOpen(true) : window.location.assign(`/login?next=/tracks/${trackId}`))}>
        License this track
      </LicenseButton>
      {open ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
          <button className="absolute inset-0 cursor-default bg-black/40" aria-label="Close checkout" tabIndex={-1} onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-echo-border bg-echo-surface/80 px-6 py-5 text-white backdrop-blur-glass">
            <div className="mb-6 flex items-center justify-between border-b border-echo-border pb-4">
              <div>
                <h2 id="checkout-title" className="text-lg font-semibold tracking-tight">
                  License “{trackTitle}”
                </h2>
                <span className="font-mono text-xs text-echo-muted">SECURE_CHECKOUT · STRIPE</span>
              </div>
              <button ref={closeRef} onClick={() => setOpen(false)} className="font-mono text-xs text-echo-muted hover:text-white" aria-label="Close">
                ESC
              </button>
            </div>

            <fieldset className="space-y-3">
              <legend className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-echo-muted">Choose license</legend>
              {tiers.map((t) => (
                <label
                  key={t.tier}
                  className={`block cursor-pointer rounded-lg border p-4 transition ${tier === t.tier ? "border-echo-cyan shadow-[0_0_0_1px_#00F0FF33]" : "border-echo-border hover:border-white/30"}`}
                >
                  <input type="radio" name="tier" value={t.tier} checked={tier === t.tier} onChange={() => setTier(t.tier)} className="sr-only" />
                  <div className="flex items-baseline justify-between">
                    <span className="font-semibold">{t.name}</span>
                    <span className="font-mono text-sm">{formatEur(t.price_cents)}</span>
                  </div>
                  <p className="mt-1 text-xs text-echo-muted">{t.buyer}</p>
                  <p className="mt-2 text-sm">{t.allowed}</p>
                  <p className="mt-1 text-xs text-echo-muted">{t.limits}</p>
                </label>
              ))}
            </fieldset>

            <div className="mt-6 space-y-4">
              <Field label="Project or client (optional)" hint="Printed on your certificate.">
                <input className={inputClass} value={project} maxLength={255} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Acme spring campaign" />
              </Field>
              <Field label="Channel / URL (optional)" hint="The channel or page where the music will be used.">
                <input className={inputClass} value={url} type="url" onChange={(e) => setUrl(e.target.value)} placeholder="https://youtube.com/@yourchannel" />
              </Field>
            </div>

            {selected ? (
              <details className="mt-6 rounded-lg border border-echo-border p-4 text-sm">
                <summary className="cursor-pointer font-medium">
                  Read the {selected.name} terms <span className="font-mono text-xs text-echo-muted">v{selected.terms_version}</span>
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-echo-muted">{selected.terms_md}</p>
              </details>
            ) : null}

            <label className="mt-6 flex items-start gap-3 text-sm">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 h-4 w-4 accent-[#00F0FF]" />
              <span>
                I accept the {selected?.name} license terms (version <span className="font-mono">{selected?.terms_version}</span>). I understand the license
                certificate documents my purchase and permitted use; it is not a guarantee that third parties will never assert claims.
              </span>
            </label>

            {error ? (
              <div className="mt-4">
                <Alert tone="error">{error}</Alert>
              </div>
            ) : null}

            <div className="mt-auto pt-6">
              <LicenseButton className="w-full py-3 text-base" disabled={!accepted || busy} onClick={pay}>
                {busy ? "Redirecting to Stripe…" : `Pay ${selected ? formatEur(selected.price_cents) : ""}`}
              </LicenseButton>
              <p className="mt-2 text-center font-mono text-[11px] text-echo-muted">Certificate + high-res WAV delivered after payment is confirmed.</p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
