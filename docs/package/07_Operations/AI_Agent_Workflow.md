# AI Agent Workflow

## Purpose
This project may be built with AI coding agents, but guardrails are required because payment, licensing and security logic are sensitive.

## Agent roles
- Scaffold agent: repo structure, UI components, non-sensitive boilerplate.
- Test agent: unit/integration test generation.
- Documentation agent: keeps docs aligned with implementation.
- Refactor agent: local refactors only with test coverage.

## Human-only review areas
AI agents may draft but must not independently merge changes to:
- Stripe webhook logic
- license ledger creation
- license terms text
- artist warranty/legal copy
- admin RBAC
- signed URL generation
- privacy/security policy
- migration altering purchased licenses
- deletion scripts

## Required workflow
1. Give agent one file/module objective at a time.
2. Require tests with each change.
3. Run lint/typecheck/tests.
4. Human reviews diff.
5. Update decision log for architectural changes.
6. Do not expose production secrets to agent runtime.

## Prompting rule
Use this package as context. Tell agents explicitly:
- Build EchoVault MVP, not full EchoVerse.
- B2C streaming is out of scope.
- EchoScore is not legal validation.
- Payment fulfillment must be idempotent.
