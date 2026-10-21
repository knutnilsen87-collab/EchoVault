# Repo Structure and Conventions

## Recommended top-level structure
```txt
/apps
  /web
/services
  /echoscore
/packages
  /domain
  /ui
  /config
  /testing
/infra
/docs
/scripts
/tests
```

## Apps
- `apps/web`: Next.js app, API route handlers, dashboards, catalog.
- `services/echoscore`: FastAPI analysis service.

## Packages
- `packages/domain`: shared types, business rules, pricing/licensing constants.
- `packages/ui`: shared UI components.
- `packages/config`: eslint/tsconfig/tailwind shared config.
- `packages/testing`: fixtures and test helpers.

## Naming conventions
- Branches: `feature/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.
- DB migrations: timestamp + purpose.
- API paths: `/api/v1/...`.
- Event names: snake_case, e.g. `license_created`.
- IDs: UUID primary keys.
- Status enums: lowercase snake_case.

## Environment names
- local
- staging
- production
