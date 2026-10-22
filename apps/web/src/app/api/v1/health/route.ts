import { ok, route } from "@/server/http";

// Liveness only — must not touch the database (route ownership map).
export const GET = route(async (_req, ctx) => ok({ service: "echovault-web", version: "0.2.0" }, ctx));
