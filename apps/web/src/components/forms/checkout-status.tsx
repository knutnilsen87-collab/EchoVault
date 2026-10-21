"use client";

import * as React from "react";
import { api } from "@/lib/api-client";
import { Alert } from "../ui/primitives";

export function CheckoutStatus({ paymentSessionId }: { paymentSessionId: string }) {
  const [state, setState] = React.useState<{ license_id: string | null; status: string } | null>(null);
  const [tries, setTries] = React.useState(0);

  React.useEffect(() => {
    let stop = false;
    const tick = async () => {
      try {
        const s = await api<{ license_id: string | null; status: string }>(`/api/v1/checkout/session/${paymentSessionId}`);
        if (stop) return;
        setState(s);
        if (s.license_id) {
          window.location.assign(`/licenses/${s.license_id}`);
          return;
        }
      } catch {
        /* keep polling */
      }
      setTries((t) => t + 1);
      if (!stop) setTimeout(tick, 1500);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [paymentSessionId]);

  if (tries > 40) {
    return <Alert tone="error">Payment confirmation is taking longer than usual. You will not be charged twice — your license will appear in “My licenses” as soon as Stripe confirms it.</Alert>;
  }
  return (
    <Alert>
      {state?.license_id ? "License issued — opening it…" : "Waiting for payment confirmation from Stripe. Your license and certificate are issued automatically."}
    </Alert>
  );
}
