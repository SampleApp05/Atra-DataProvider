# `api-gateway`

Central ingress for the ATRA platform. Routes requests to downstream services, enforces rate-limiting, and handles cross-cutting concerns such as CORS and request logging.

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned Responsibilities

- Route `/auth/*` → `auth-service`
- Route `/market/*` → `market-service`
- Route `/portfolio/*` → `portfolio-service`
- JWT pass-through validation (optional caching layer)
- Rate limiting per wallet address
- Request/response logging via `@atra/logger`

---

## Dependencies

| Package           | Role                    |
|-------------------|-------------------------|
| `@atra/logger`    | Structured logging      |
| `@atra/config`    | Shared config loader    |
