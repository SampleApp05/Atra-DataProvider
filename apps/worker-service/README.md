# `worker-service`

Background job processor for the ATRA platform (scheduled tasks, queue consumers).

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned Responsibilities

- Purge expired nonce challenges and revoked sessions on a schedule
- Process async jobs enqueued by other services (e.g. notification dispatch)
- Periodic portfolio snapshot snapshots
- Database maintenance tasks

---

## Dependencies

| Package          | Role                      |
|------------------|---------------------------|
| `@atra/database` | Shared schema + DB client |
| `@atra/logger`   | Structured logging        |
| `@atra/config`   | Shared config loader      |
