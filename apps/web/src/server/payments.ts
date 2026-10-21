import Stripe from "stripe";
import { env, isStubMode } from "./env";

export type CreateCheckoutArgs = {
  paymentSessionId: string;
  amountCents: number;
  currency: string;
  productName: string;
  buyerEmail: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  expiresAt: Date;
};

export type CheckoutSession = { id: string; url: string };

let client: Stripe | null = null;

/** Stripe client. In stub mode a dummy key is used — only webhook signing helpers are called. */
export function stripe(): Stripe {
  if (!client) client = new Stripe(env().STRIPE_SECRET_KEY || "sk_test_stub_mode_no_network");
  return client;
}

export async function createCheckoutSession(args: CreateCheckoutArgs): Promise<CheckoutSession> {
  if (isStubMode()) {
    const id = `cs_stub_${crypto.randomUUID().replace(/-/g, "")}`;
    return { id, url: `${env().NEXT_PUBLIC_APP_URL}/dev/checkout/${id}` };
  }
  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: { currency: args.currency.toLowerCase(), unit_amount: args.amountCents, product_data: { name: args.productName } }
        }
      ],
      customer_email: args.buyerEmail,
      client_reference_id: args.paymentSessionId,
      metadata: args.metadata,
      payment_intent_data: { metadata: args.metadata },
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
      expires_at: Math.floor(args.expiresAt.getTime() / 1000)
    },
    { idempotencyKey: `checkout_${args.paymentSessionId}` }
  );
  if (!session.url) throw new Error("STRIPE_SESSION_WITHOUT_URL");
  return { id: session.id, url: session.url };
}

/** Throws if the signature is invalid. This is the only trusted source of payment truth. */
export function verifyWebhook(rawBody: string, signature: string | null): Stripe.Event {
  if (!signature) throw new Error("MISSING_SIGNATURE");
  return stripe().webhooks.constructEvent(rawBody, signature, env().STRIPE_WEBHOOK_SECRET);
}

/** Stub mode only: produce a Stripe-format, correctly signed checkout.session.completed event. */
export function buildSignedStubEvent(session: {
  id: string;
  amountCents: number;
  currency: string;
  metadata: Record<string, string>;
}): { payload: string; signature: string } {
  if (!isStubMode()) throw new Error("STUB_ONLY");
  const event = {
    id: `evt_stub_${crypto.randomUUID().replace(/-/g, "")}`,
    object: "event",
    type: "checkout.session.completed",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    data: {
      object: {
        id: session.id,
        object: "checkout.session",
        payment_status: "paid",
        status: "complete",
        amount_total: session.amountCents,
        currency: session.currency.toLowerCase(),
        payment_intent: `pi_stub_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`,
        metadata: session.metadata
      }
    }
  };
  const payload = JSON.stringify(event);
  const signature = stripe().webhooks.generateTestHeaderString({ payload, secret: env().STRIPE_WEBHOOK_SECRET });
  return { payload, signature };
}
