"use client";

import * as React from "react";
import { api, describeError } from "@/lib/api-client";
import { Alert, Button } from "../ui/primitives";

export function StubPayButton({ stripeSessionId, paymentSessionId, cancelHref }: { stripeSessionId: string; paymentSessionId: string; cancelHref: string }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="space-y-3">
      <button
        disabled={busy}
        className="w-full rounded-md bg-[#635bff] px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          try {
            await api("/api/v1/dev/stripe/complete", { method: "POST", json: { stripe_session_id: stripeSessionId } });
            window.location.assign(`/checkout/success?ps=${paymentSessionId}`);
          } catch (e) {
            setError(describeError(e));
            setBusy(false);
          }
        }}
      >
        {busy ? "Processing…" : "Pay (test)"}
      </button>
      <Button variant="ghost" className="w-full" onClick={() => window.location.assign(cancelHref)}>
        Cancel
      </Button>
      {error ? <Alert tone="error">{error}</Alert> : null}
    </div>
  );
}
