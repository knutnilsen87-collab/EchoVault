# Design-lock and canonical contract boundaries

Codex must treat design-lock documents as source-of-truth inputs, not implementation scratchpads.
Codex must preserve canonical domain contracts and must not create private incompatible variants.

# Do-Not-Touch Boundaries for Codex

These boundaries prevent useful PRs from becoming architecture drift.

## Do not change without explicit approval
- Product positioning and licensing model.
- Design-lock visual direction.
- Domain status semantics.
- Immutable license requirement.
- Proof-of-effort requirement.
- Webhook idempotency requirement.
- No-public-download-before-license rule.

## Do not introduce yet
- Real production Stripe charge flow.
- Real S3/R2 writes with credentials.
- Real AI/ML audio scoring.
- Social/community features.
- Mobile application.
- Marketplace ranking/recommendations.
- Enterprise API.

## Allowed stubs
- Fixture EchoScore.
- Fake signed URL provider.
- In-memory repository for local smoke tests.
- Test-mode checkout session.
- Certificate JSON without final PDF rendering.
