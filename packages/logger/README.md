# `@atra/logger`

Structured JSON logger shared across all ATRA services, built on [pino](https://getpino.io).

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned API

```ts
import { logger } from '@atra/logger'

logger.info({ accountId }, 'Session created')
logger.error({ err }, 'Unexpected error in RoleService')
```

Output is newline-delimited JSON suitable for log aggregators (Datadog, Loki, CloudWatch).
