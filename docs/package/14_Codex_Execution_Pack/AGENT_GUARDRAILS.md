# Agent Guardrails for Codex

These rules are designed to prevent the implementation from drifting away from the CTO/design-lock package.

## Non-negotiable execution rules

1. Implement the smallest PR that satisfies the current acceptance criteria.
2. Do not edit design-lock/product specification documents unless the task explicitly asks for a documentation PR.
3. Prefer extending existing ownership files over creating new abstractions.
4. Public API responses must use the `ok/data/request_id` or `ok/error/request_id` envelope.
5. Do not make checkout fulfillment depend on a success page. Fulfillment must be webhook-driven and idempotent.
6. Do not mark a track as licensable unless its status is `approved` or `live`.
7. Do not bypass proof-of-effort, rights warranty, or terms acceptance.
8. Every mutating endpoint needs an idempotency, rollback, or safety note before implementation.
9. Every new route must update the route ownership map and include a fixture/example.
10. No broad refactor while implementing PR 01-10.

## Required Codex response pattern per PR

Codex should end every PR with:

- Files changed
- Why each file changed
- Verification commands run
- Known gaps
- Next recommended PR
- Rollback path
