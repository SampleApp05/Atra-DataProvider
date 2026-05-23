# `@atra/config`

Centralised configuration loader with environment variable validation and typed access.

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned API

```ts
import { config } from '@atra/config'

console.log(config.jwtSecret)     // validated at startup
console.log(config.databaseUrl)
```

Throws at startup if required variables are missing, avoiding runtime surprises.
