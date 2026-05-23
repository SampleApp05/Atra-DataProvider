# `@atra/sdk`

Official TypeScript client SDK for interacting with the ATRA backend APIs from front-end applications or external services.

> ⚠️ **Not yet implemented.** This README is a placeholder.

---

## Planned Usage

```ts
import { AtraClient } from '@atra/sdk'

const client = new AtraClient({ baseUrl: 'https://api.atra.io' })

// Auth flow
const { challengeId, message } = await client.auth.getNonce(address)
const { accessToken } = await client.auth.verify(challengeId, signature)

// Roles
await client.roles.grantAuth({ ... })
```

## Planned Features

- Type-safe request/response wrappers around all REST endpoints
- Automatic token refresh via interceptors
- WebSocket subscription helpers for market data
- Pagination helpers for cursor-based responses (audit logs, etc.)
