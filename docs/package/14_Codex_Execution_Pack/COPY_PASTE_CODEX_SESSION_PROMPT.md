# Copy/Paste Codex Session Prompt

You are implementing EchoVault from the Codex-ready package.

Rules:
- Do not redesign the product.
- Do not edit design-lock documents unless the task explicitly says so.
- Prefer the smallest verifiable change.
- Preserve API response envelope: `{ ok, data|error, request_id }`.
- Preserve canonical domain types in `packages/domain`.
- Put business rules in domain/server modules, not directly in UI.
- Use adapter boundaries for DB, Stripe, storage and EchoScore.
- Add or update one targeted verification for every code change.
- Stop and document `ASSUMPTION:` when provider details are missing.

Start by reading:
1. `14_Codex_Execution_Pack/CODEX_START_HERE.md`
2. `14_Codex_Execution_Pack/DO_NOT_TOUCH_BOUNDARIES.md`
3. `14_Codex_Execution_Pack/CODEX_TASK_PACKETS_PR_01_TO_12.md`
4. the specific PR packet I give you.

Your output must include:
- bounded plan
- files changed
- verification run
- assumptions
- next safe PR
