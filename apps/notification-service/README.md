# `notification-service`

Delivers real-time and async notifications (push, email, in-app) to ATRA users.

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned Responsibilities

- Push notifications (APNs / FCM) for price alerts and account events
- Email delivery for security events (new device login, ownership transfer)
- In-app notification feed
- Subscribes to internal event bus (account events from `auth-service`, price alerts from `market-service`)

---

## Dependencies

| Package        | Role               |
|----------------|--------------------|
| `@atra/logger` | Structured logging |
| `@atra/config` | Shared config      |
